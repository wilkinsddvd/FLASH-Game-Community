"""
超级管理员口令核心逻辑
- 超管口令池：支持查看/增加/修改/删除（仅超级管理员可操作）
- 初始口令（is_builtin=True）由代码写入，不可删除，但可修改内容
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from passlib.context import CryptContext
from model.super_admin_passphrase import SuperAdminPassphrase

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_super_passphrase(passphrase: str) -> str:
    """对口令进行 bcrypt 哈希"""
    return pwd_context.hash(passphrase)


def verify_super_passphrase(passphrase: str, hashed: str) -> bool:
    """验证口令与哈希是否匹配"""
    return pwd_context.verify(passphrase, hashed)


async def list_super_passphrases(db: AsyncSession) -> list[SuperAdminPassphrase]:
    """获取全部超管口令（按创建顺序）"""
    result = await db.execute(
        select(SuperAdminPassphrase).order_by(SuperAdminPassphrase.id)
    )
    return list(result.scalars().all())


async def verify_super_admin_passphrase(passphrase: str, db: AsyncSession) -> bool:
    """校验超级管理员口令（遍历口令池比对）"""
    records = await list_super_passphrases(db)
    for record in records:
        if verify_super_passphrase(passphrase, record.passphrase_hash):
            return True
    return False


async def add_super_passphrase(passphrase: str, remark: str, db: AsyncSession) -> SuperAdminPassphrase:
    """
    新增超管口令
    :raises ValueError: 口令与已有口令重复
    """
    records = await list_super_passphrases(db)
    for record in records:
        if verify_super_passphrase(passphrase, record.passphrase_hash):
            raise ValueError("新口令不能与已有口令重复")

    record = SuperAdminPassphrase(
        passphrase_hash=hash_super_passphrase(passphrase),
        remark=remark or None,
        is_builtin=False,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def update_super_passphrase(
    passphrase_id: int,
    new_passphrase: str,
    remark: str,
    db: AsyncSession,
) -> SuperAdminPassphrase:
    """
    修改超管口令（内容可改）
    :raises ValueError: 口令不存在 / 新口令与其它口令重复
    """
    result = await db.execute(
        select(SuperAdminPassphrase).where(SuperAdminPassphrase.id == passphrase_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("口令不存在")

    records = await list_super_passphrases(db)
    for other in records:
        if other.id != passphrase_id and verify_super_passphrase(new_passphrase, other.passphrase_hash):
            raise ValueError("新口令不能与已有口令重复")

    record.passphrase_hash = hash_super_passphrase(new_passphrase)
    if remark is not None:
        record.remark = remark or None
    await db.commit()
    await db.refresh(record)
    return record


async def delete_super_passphrase(passphrase_id: int, db: AsyncSession) -> SuperAdminPassphrase:
    """
    删除超管口令
    :raises ValueError: 口令不存在 / 初始口令不可删除 / 不能删除最后一个口令
    """
    result = await db.execute(
        select(SuperAdminPassphrase).where(SuperAdminPassphrase.id == passphrase_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("口令不存在")

    if record.is_builtin:
        raise ValueError("初始口令由代码内置，不可删除")

    remaining = await list_super_passphrases(db)
    if len(remaining) <= 1:
        raise ValueError("至少保留一个口令，不能删除最后一个")

    await db.delete(record)
    await db.commit()
    return record
