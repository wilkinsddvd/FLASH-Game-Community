"""
管理员口令校验核心逻辑
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


async def verify_admin_passphrase(passphrase: str, db: AsyncSession) -> bool:
    """
    校验管理员口令
    从数据库中取最新存储的口令哈希进行比对
    """
    result = await db.execute(
        select(AdminPassphrase).order_by(AdminPassphrase.id.desc()).limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    return verify_passphrase_hash(passphrase, record.passphrase_hash)


async def get_stored_passphrase_hash(db: AsyncSession) -> str | None:
    """获取当前存储的口令哈希"""
    result = await db.execute(
        select(AdminPassphrase).order_by(AdminPassphrase.id.desc()).limit(1)
    )
    record = result.scalar_one_or_none()
    return record.passphrase_hash if record else None
