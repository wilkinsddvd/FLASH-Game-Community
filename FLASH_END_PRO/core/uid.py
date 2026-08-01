"""
全局唯一 UID 生成（需求文档 v2：用户信息模块 UID 体系）
- 格式：纯数字，8~10 位
- 范围：10000000 ~ 9999999999
- 策略：随机生成 + 数据库查重（单实例部署下足够；分布式可换雪花算法）
"""
import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from model.user import User

MIN_UID = 10_000_000
MAX_UID = 9_999_999_999
MAX_RETRY = 20


def generate_uid_candidate() -> int:
    """生成一个 8~10 位数字 UID 候选值"""
    return random.randint(MIN_UID, MAX_UID)


async def generate_uid(db: AsyncSession) -> int:
    """
    生成全局唯一 UID（查重 + 重试）
    :raises RuntimeError: 重试后仍冲突
    """
    for _ in range(MAX_RETRY):
        uid = generate_uid_candidate()
        result = await db.execute(select(User.id).where(User.uid == uid))
        if result.scalar_one_or_none() is None:
            return uid
    raise RuntimeError("UID 生成失败，请重试")
