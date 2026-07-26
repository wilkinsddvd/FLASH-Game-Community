"""
Redis 异步连接模块
"""
from redis import asyncio as aioredis

from core.config import settings


class RedisClient:
    """Redis 连接管理器"""

    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def connect(self) -> aioredis.Redis:
        """获取 Redis 连接（单例）"""
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.redis_url,
                password=settings.redis_password or None,
                decode_responses=True,
                encoding="utf-8",
            )
        return self._redis

    async def close(self):
        """关闭 Redis 连接"""
        if self._redis:
            await self._redis.close()
            self._redis = None

    @property
    async def client(self) -> aioredis.Redis:
        return await self.connect()


redis_client = RedisClient()


async def get_redis() -> aioredis.Redis:
    """依赖注入：获取 Redis 客户端"""
    return await redis_client.connect()
