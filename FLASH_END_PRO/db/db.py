from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "mysql+asyncmy://root:123456@localhost/db_on_work"
# DATABASE_URL = "mysql+asyncmy://root:Root123%40@39.96.182.141:3306/db_on_work"
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_async_db():
    async with async_session() as session:
        yield session