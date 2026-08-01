from __future__ import annotations

"""
管理员口令校验核心逻辑
支持多口令池：
- 口令可增加、可删除、不可修改内容
- 每个口令最大使用次数为 settings.passphrase_max_uses（默认 5 次），用满即失效
- 初始口令（is_builtin=True）由代码写入，不可删除
"""
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.redis import redis_client
from model.admin_passphrase import AdminPassphrase

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis 前缀
ATTEMPT_PREFIX = "admin_passphrase:attempt:"
LOCK_PREFIX = "admin_passphrase:lock:"


def hash_passphrase(passphrase: str) -> str:
    """对口令进行 bcrypt 哈希"""
    return pwd_context.hash(passphrase)


def verify_passphrase_hash(passphrase: str, hashed: str) -> bool:
    """验证口令与哈希是否匹配"""
    return pwd_context.verify(passphrase, hashed)


async def check_brute_force(identifier: str) -> bool:
    """
    检查是否被锁定
    :param identifier: 客户端标识（IP 或用户标识）
    :return: True=已锁定, False=可继续尝试
    """
    r = await redis_client.connect()
    lock_key = f"{LOCK_PREFIX}{identifier}"
    if await r.exists(lock_key):
        return True
    return False


async def record_failed_attempt(identifier: str) -> int:
    """
    记录失败尝试，超过阈值则锁定
    :return: 剩余尝试次数（0 表示已锁定）
    """
    r = await redis_client.connect()
    attempt_key = f"{ATTEMPT_PREFIX}{identifier}"

    current = await r.incr(attempt_key)
    if current == 1:
        # 第一次失败，设置 TTL 为锁定时长（防止累计永不重置）
        await r.expire(attempt_key, settings.brute_force_lockout_minutes * 60)

    remaining = settings.brute_force_max_attempts - current
    if remaining <= 0:
        # 锁定
        lock_key = f"{LOCK_PREFIX}{identifier}"
        await r.set(lock_key, "1", ex=settings.brute_force_lockout_minutes * 60)
        await r.delete(attempt_key)
        return 0

    return max(remaining, 0)


async def reset_attempts(identifier: str):
    """成功后清除尝试记录"""
    r = await redis_client.connect()
    await r.delete(f"{ATTEMPT_PREFIX}{identifier}")
    await r.delete(f"{LOCK_PREFIX}{identifier}")


async def list_passphrases(db: AsyncSession) -> list[AdminPassphrase]:
    """获取全部口令记录（按创建顺序）"""
    result = await db.execute(
        select(AdminPassphrase).order_by(AdminPassphrase.id)
    )
    return list(result.scalars().all())


async def verify_admin_passphrase(passphrase: str, db: AsyncSession) -> bool:
    """
    校验管理员口令（多口令池）
    遍历所有未用满的口令进行比对：
    - 匹配成功：对应口令 use_count +1，用满自动失效
    - 全部不匹配：返回 False
    """
    records = await list_passphrases(db)
    if not records:
        return False

    for record in records:
        if record.use_count >= settings.passphrase_max_uses:
            continue  # 已用满，跳过
        if verify_passphrase_hash(passphrase, record.passphrase_hash):
            record.use_count += 1
            await db.commit()
            return True

    return False


async def add_passphrase(passphrase: str, db: AsyncSession) -> AdminPassphrase:
    """
    新增口令
    :raises ValueError: 口令与已有口令重复
    """
    records = await list_passphrases(db)
    for record in records:
        if verify_passphrase_hash(passphrase, record.passphrase_hash):
            raise ValueError("新口令不能与已有口令重复")

    record = AdminPassphrase(
        passphrase_hash=hash_passphrase(passphrase),
        use_count=0,
        is_builtin=False,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_passphrase(passphrase_id: int, db: AsyncSession) -> AdminPassphrase:
    """
    删除口令
    :raises ValueError: 口令不存在 / 初始口令不可删除 / 不能删除最后一个口令
    """
    result = await db.execute(
        select(AdminPassphrase).where(AdminPassphrase.id == passphrase_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("口令不存在")

    if record.is_builtin:
        raise ValueError("初始口令由代码内置，不可删除")

    remaining = await list_passphrases(db)
    if len(remaining) <= 1:
        raise ValueError("至少保留一个口令，不能删除最后一个")

    await db.delete(record)
    await db.commit()
    return record
