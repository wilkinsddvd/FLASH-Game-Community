import uvicorn
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.db import init_db
from core.redis import redis_client
from core.config import settings
from api.auth import router as auth_router
from api.admin import router as admin_router
from api.forum import router as forum_router
from api.cms import router as cms_router
from api.email import router as email_router
from api.admin_auth import router as admin_auth_router
from api.messages import router as messages_router
from api.users import router as users_router
from api.quiz import router as quiz_router
from api.video import router as video_router
from api.feedback import router as feedback_router
from api.badge import router as badge_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动
    await init_db()
    await redis_client.connect()
    from core.seed import seed_database, seed_admin_passphrase
    await seed_database()
    await seed_admin_passphrase()
    yield
    # 关闭
    await redis_client.close()


app = FastAPI(
    title="FLASH-Game-Community API",
    description="游戏社区平台后端接口",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(forum_router)
app.include_router(cms_router)
app.include_router(email_router)
app.include_router(admin_auth_router)
app.include_router(messages_router)
app.include_router(users_router)
app.include_router(quiz_router)
app.include_router(video_router)
app.include_router(feedback_router)
app.include_router(badge_router)

# 静态文件（上传的头像/背景图）
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
async def root():
    return {"message": "FLASH-Game-Community API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
