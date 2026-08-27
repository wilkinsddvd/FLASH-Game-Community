"""
B站视频 API（首页攻略栏）
- 公开：获取展示中的视频列表
- 管理端：视频 CRUD
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from db.db import get_async_db
from model.user import User
from model.video import BiliVideo
from schemas.video import VideoCreate, VideoUpdate, VideoOut

router = APIRouter(tags=["B站视频"])

BILI_BASE = "https://www.bilibili.com/video/"


def _to_out(v: BiliVideo) -> VideoOut:
    out = VideoOut.model_validate(v)
    out.url = f"{BILI_BASE}{v.bvid}"
    return out


@router.get("/api/videos", response_model=List[VideoOut])
async def list_public_videos(db: AsyncSession = Depends(get_async_db)):
    """获取展示中的视频列表（公开，首页攻略栏用）"""
    result = await db.execute(
        select(BiliVideo).where(BiliVideo.status == 1).order_by(BiliVideo.sort_order, BiliVideo.id)
    )
    return [_to_out(v) for v in result.scalars().all()]


# ── 管理端 ──

@router.get("/api/admin/videos", response_model=List[VideoOut])
async def admin_list_videos(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BiliVideo).order_by(BiliVideo.sort_order, BiliVideo.id))
    return [_to_out(v) for v in result.scalars().all()]


@router.post("/api/admin/videos", response_model=VideoOut, status_code=201)
async def admin_create_video(
    req: VideoCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    v = BiliVideo(**req.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return _to_out(v)


@router.put("/api/admin/videos/{vid}", response_model=VideoOut)
async def admin_update_video(
    vid: int,
    req: VideoUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BiliVideo).where(BiliVideo.id == vid))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="视频不存在")
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(v, key, value)
    await db.commit()
    await db.refresh(v)
    return _to_out(v)


@router.delete("/api/admin/videos/{vid}", status_code=204)
async def admin_delete_video(
    vid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BiliVideo).where(BiliVideo.id == vid))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="视频不存在")
    await db.delete(v)
    await db.commit()
