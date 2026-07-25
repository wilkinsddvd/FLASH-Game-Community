import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.db import init_db
from api.auth import router as auth_router
from api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：初始化数据库表 + 种子数据
    await init_db()
    from core.seed import seed_database
    await seed_database()
    yield
    # 关闭时：清理资源


app = FastAPI(
    title="FLASH-Game-Community API",
    description="游戏社区平台后端接口",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"message": "FLASH-Game-Community API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
