"""
B站视频 API（首页攻略栏）
- 公开：获取展示中的视频列表
- 管理端：视频 CRUD
"""
import asyncio
import json
import urllib.request
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.redis import redis_client
from db.db import get_async_db
from model.user import User
from model.video import BiliVideo
from schemas.video import VideoCreate, VideoUpdate, VideoOut

router = APIRouter(tags=["B站视频"])

BILI_BASE = "https://www.bilibili.com/video/"
BILI_VIEW_API = "https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
COVER_CACHE_PREFIX = "bili_cover:"
COVER_CACHE_TTL = 86400  # 24小时


def _fetch_cover_sync(bvid: str) -> str:
    """同步调用 B站 API 获取视频封面 URL（带超时与异常兜底）"""
    try:
        req = urllib.request.Request(
            BILI_VIEW_API.format(bvid=bvid),
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "Referer": "https://www.bilibili.com/",
            },
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("code") == 0 and data.get("data", {}).get("pic"):
            pic = data["data"]["pic"]
            # B站 API 返回的封面可能是 http://，HTTPS 站点下会被浏览器按“混合内容”拦截
            if pic.startswith("http://"):
                pic = "https://" + pic[len("http://"):]
            return pic
    except Exception:
        pass
    return ""


async def _get_cover(bvid: str) -> str:
    """获取视频封面：优先 Redis 缓存，未命中则调 B站 API 并缓存"""
    try:
        r = await redis_client.connect()
        cache_key = f"{COVER_CACHE_PREFIX}{bvid}"
        cached = await r.get(cache_key)
        if cached:
            return cached
        cover = await asyncio.to_thread(_fetch_cover_sync, bvid)
        if cover:
            await r.set(cache_key, cover, ex=COVER_CACHE_TTL)
        return cover
    except Exception:
        return ""


async def _to_out(v: BiliVideo) -> VideoOut:
    out = VideoOut.model_validate(v)
    out.url = f"{BILI_BASE}{v.bvid}"
    # 封面为空时自动从 B站获取（修复视频图标无法显示）
    if not out.cover_url:
        out.cover_url = await _get_cover(v.bvid)
    # 统一强制 https（兼容 Redis 中可能已缓存的 http:// 旧值）
    if out.cover_url and out.cover_url.startswith("http://"):
        out.cover_url = "https://" + out.cover_url[len("http://"):]
    return out


@router.get("/api/videos", response_model=List[VideoOut])
async def list_public_videos(db: AsyncSession = Depends(get_async_db)):
    """获取展示中的视频列表（公开，首页攻略栏用）"""
    result = await db.execute(
        select(BiliVideo).where(BiliVideo.status == 1).order_by(BiliVideo.sort_order, BiliVideo.id)
    )
    return [await _to_out(v) for v in result.scalars().all()]


# ── 管理端 ──

@router.get("/api/admin/videos", response_model=List[VideoOut])
async def admin_list_videos(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BiliVideo).order_by(BiliVideo.sort_order, BiliVideo.id))
    return [await _to_out(v) for v in result.scalars().all()]


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
    return await _to_out(v)


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
    return await _to_out(v)


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
