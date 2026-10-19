import asyncio
import os
import sys
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "FLASH_END_PRO"))

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")


def _make_token_for_super_admin() -> str | None:
    env = os.getenv("E2E_ADMIN_TOKEN")
    if env:
        return env
    try:
        from sqlalchemy import select
        from db.db import async_session
        from model.user import User
        from model.role import Role, user_roles
        from core.security import create_access_token

        async def _find():
            async with async_session() as db:
                result = await db.execute(
                    select(User)
                    .join(user_roles, user_roles.c.user_id == User.id)
                    .join(Role, Role.id == user_roles.c.role_id)
                    .where(Role.code == "super_admin", User.status != 0)
                    .limit(1)
                )
                return result.scalars().first()

        async def _all():
            user = await _find()
            return create_access_token({"sub": str(user.id)}) if user else None

        return asyncio.run(_all())
    except Exception as e:
        print(f"[api-test] 无法生成管理员 token：{e}")
        return None


@pytest.fixture(scope="session")
def admin_token():
    token = _make_token_for_super_admin()
    if not token:
        pytest.skip("没有可用的 super_admin 账号，跳过需要登录的 API 用例")
    return token


@pytest.fixture(scope="session")
def client():
    with httpx.Client(base_url=API_BASE, timeout=20) as c:
        yield c
