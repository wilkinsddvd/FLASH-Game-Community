"""
轻量限流工具（基于 Redis 固定窗口计数）

用途：给「验证码签发」「注册」「登录」等易被刷的接口做预防性限制。
设计取舍：
- Redis 不可用时 **fail-open（放行）**：避免缓存抖动把正常登录/注册整体打挂。
- 只做「计数 + 超限拒绝」，不做队列/令牌桶（够用且好维护）。
"""
from __future__ import annotations

from fastapi import Request

from core.redis import redis_client

PREFIX = "rl:"


def get_client_ip(request: Request) -> str:
    """取真实客户端 IP（nginx 已透传 X-Real-IP / X-Forwarded-For）"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


async def hit(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """
    记一次访问并判断是否超限。

    :return: (allowed, retry_after_seconds)
    """
    full_key = f"{PREFIX}{key}"
    try:
        redis = await redis_client.connect()
        current = await redis.incr(full_key)
        if current == 1:
            await redis.expire(full_key, window_seconds)
        if current > limit:
            ttl = await redis.ttl(full_key)
            return False, max(int(ttl), 1)
        return True, 0
    except Exception:
        # Redis 异常 → 放行（可用性优先）
        return True, 0


async def peek(key: str) -> int:
    """查看当前计数（不 +1），仅用于诊断/测试"""
    try:
        redis = await redis_client.connect()
        value = await redis.get(f"{PREFIX}{key}")
        return int(value) if value else 0
    except Exception:
        return 0


async def reset(key: str) -> None:
    """清空计数（例如登录成功后）"""
    try:
        redis = await redis_client.connect()
        await redis.delete(f"{PREFIX}{key}")
    except Exception:
        pass
