from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os


class Base(DeclarativeBase):
    pass


"""
数据库连接切换：
- DB_ENV=local（默认）：使用 DATABASE_URL（本地库）
- DB_ENV=cloud / production：使用 CLOUD_DATABASE_URL（云端库，mysql+asyncmy）
两种 URL 均写在 .env 中，互不覆盖。
"""
_DB_ENV = os.getenv("DB_ENV", "local").strip().lower()
_DB_ENV_VAR = "CLOUD_DATABASE_URL" if _DB_ENV in ("cloud", "prod", "production", "remote") else "DATABASE_URL"
DATABASE_URL = os.getenv(
    _DB_ENV_VAR,
    "mysql+aiomysql://root:123456@localhost:3306/flash_game_community",
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_async_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
