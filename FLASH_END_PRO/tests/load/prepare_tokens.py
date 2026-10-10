"""
压测用 JWT 生成器

用途：Locust 无法通过图形验证码登录，这里直接用后端的 JWT 逻辑给测试用户签发 token。

用法（在 FLASH_END_PRO 目录下，且 DB_ENV 指向测试库）：
    python tests/load/prepare_tokens.py --count 20
    python tests/load/prepare_tokens.py --count 20 --create   # 测试用户不足时自动补建
    LOCUST_TOKENS="$(python tests/load/prepare_tokens.py --count 20 --csv)" ...

⚠️ 会直连数据库，只对本地 / staging 使用。
"""
import argparse
import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import select  # noqa: E402

from core.security import create_access_token, hash_password  # noqa: E402
from core.uid import generate_uid  # noqa: E402
from db.db import async_session  # noqa: E402
from model.user import User  # noqa: E402

TEST_USER_PREFIX = "loadtest_"
TEST_PASSWORD = "LoadTest@123456"


async def _ensure_users(db, need: int) -> list[User]:
    result = await db.execute(select(User).where(User.status != 0).limit(500))
    users = list(result.scalars().all())
    if len(users) >= need:
        return random.sample(users, need)

    have = len(users)
    for i in range(have, need):
        username = f"{TEST_USER_PREFIX}{i + 1:04d}"
        exists = await db.execute(select(User).where(User.username == username))
        if exists.scalar_one_or_none():
            continue
        u = User(
            username=username,
            password_hash=hash_password(TEST_PASSWORD),
            uid=await generate_uid(db),
            registration_method="normal",
        )
        db.add(u)
    await db.commit()
    result = await db.execute(select(User).where(User.status != 0).limit(500))
    return list(result.scalars().all())[:need]


async def main() -> None:
    parser = argparse.ArgumentParser(description="生成压测用 JWT")
    parser.add_argument("--count", type=int, default=20, help="需要多少个 token")
    parser.add_argument("--create", action="store_true", help="用户不足时自动补建 loadtest_ 用户")
    parser.add_argument("--csv", action="store_true", help="仅输出逗号分隔的 token（便于直接赋给 env）")
    args = parser.parse_args()

    async with async_session() as db:
        if args.create:
            users = await _ensure_users(db, args.count)
        else:
            result = await db.execute(select(User).where(User.status != 0).limit(args.count))
            users = list(result.scalars().all())

    if not users:
        print("没有可用用户，请加 --create 自动补建测试用户", file=sys.stderr)
        sys.exit(1)

    tokens = [create_access_token(data={"sub": str(u.id)}) for u in users]
    if args.csv:
        print(",".join(tokens))
    else:
        print(f"# 共 {len(tokens)} 个 token（用户 id: {[u.id for u in users]}）")
        print(f"LOCUST_TOKENS=\"{','.join(tokens)}\"")
        if args.create:
            print(f"# 测试用户密码统一为：{TEST_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
