"""
B站视频 API（首页攻略栏）
- 公开：获取展示中的视频列表
- 管理端：视频 CRUD、封面刷新

封面策略（2026-10 改造）：
- 支持粘贴「完整 B站链接 / b23.tv 短链 / 纯 BV 号」，后端自动解析出 BV 号
- 新增/编辑视频时**主动拉取并下载**封面到本地 /uploads/covers/<bvid>.jpg，
  前端配合 STATIC_BASE 直接读本地文件，彻底规避 B站图片防盗链
- 提供单条 / 全量「刷新封面」接口，便于补历史数据
"""
import asyncio
import json
import os
import re
import urllib.request
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.config import settings
from db.db import get_async_db
from model.user import User
from model.video import BiliVideo
from schemas.video import VideoCreate, VideoUpdate, VideoOut

router = APIRouter(tags=["B站视频"])

BILI_BASE = "https://www.bilibili.com/video/"
BILI_VIEW_API = "https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
COVER_DIRNAME = "covers"
COVER_URL_PREFIX = f"/uploads/{COVER_DIRNAME}/"

_BV_RE = re.compile(r"(BV[0-9A-Za-z]{10})")
_SHORT_RE = re.compile(r"https?://b23\.tv/[0-9A-Za-z]+", re.IGNORECASE)

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def _headers() -> dict:
    return {
        "User-Agent": _UA,
        "Referer": "https://www.bilibili.com/",
        # 部分接口需带 buvid3 才稳定返回；随机生成即可
        "Cookie": "buvid3=" + os.urandom(16).hex().upper(),
        "Accept": "application/json, text/plain, */*",
    }


def parse_bvid(raw: str) -> str:
    """从 BV 号 / 完整链接 / b23.tv 短链 中解析 BV 号；解析失败返回空串"""
    if not raw:
        return ""
    s = str(raw).strip()
    m = _BV_RE.search(s)
    if m:
        return m.group(1)
    # b23.tv 短链：跟随重定向拿到最终 URL 后再解析
    if _SHORT_RE.search(s):
        try:
            req = urllib.request.Request(s, headers={"User-Agent": _UA})
            with urllib.request.urlopen(req, timeout=6) as resp:
                final = resp.geturl() or ""
            m = _BV_RE.search(final)
            if m:
                return m.group(1)
        except Exception as exc:  # noqa: BLE001
            print(f"[video] 解析短链失败 {s}: {exc}")
    return ""


def _fetch_meta_sync(bvid: str) -> dict:
    """调 B站 API 取 {title, cover}；失败返回空 dict。带一次重试与日志"""
    if not _BV_RE.fullmatch(bvid or ""):
        return {}
    for attempt in range(2):
        try:
            req = urllib.request.Request(BILI_VIEW_API.format(bvid=bvid), headers=_headers())
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            if data.get("code") == 0 and isinstance(data.get("data"), dict):
                d = data["data"]
                return {"title": d.get("title") or "", "cover": d.get("pic") or ""}
            print(f"[video] B站返回异常 bvid={bvid} code={data.get('code')} msg={data.get('message')}")
        except Exception as exc:  # noqa: BLE001
            print(f"[video] 获取 B站信息失败 bvid={bvid}（第 {attempt + 1} 次）: {exc}")
    return {}


def _download_cover_sync(bvid: str, cover_url: str) -> str:
    """下载封面到本地，返回相对 URL；失败返回空串"""
    # 严格校验 BV 号，避免路径穿越
    if not _BV_RE.fullmatch(bvid or "") or not cover_url:
        return ""
    try:
        req = urllib.request.Request(
            cover_url,
            headers={"User-Agent": _UA, "Referer": "https://www.bilibili.com/"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        if not data:
            return ""
        target_dir = os.path.join(settings.upload_dir, COVER_DIRNAME)
        os.makedirs(target_dir, exist_ok=True)
        with open(os.path.join(target_dir, f"{bvid}.jpg"), "wb") as fp:
            fp.write(data)
        return f"{COVER_URL_PREFIX}{bvid}.jpg"
    except Exception as exc:  # noqa: BLE001
        print(f"[video] 下载封面失败 bvid={bvid}: {exc}")
        return ""


def _needs_localize(url: Optional[str]) -> bool:
    """封面是否需要本地化：空值，或历史遗留的 B站 直链"""
    if not url:
        return True
    low = url.lower()
    return ("hdslb.com" in low) or ("bilibili.com" in low)


async def ensure_cover(v: BiliVideo, force: bool = False) -> bool:
    """
    确保视频有本地封面。
    :return: 是否成功获得封面
    """
    if not force and not _needs_localize(v.cover_url):
        return True
    meta = await asyncio.to_thread(_fetch_meta_sync, v.bvid)
    cover = meta.get("cover") or ""
    if not cover:
        return False
    local = await asyncio.to_thread(_download_cover_sync, v.bvid, cover)
    v.cover_url = local or cover  # 下载失败则退回 B站 原始直链
    return True


async def _to_out(v: BiliVideo) -> VideoOut:
    out = VideoOut.model_validate(v)
    out.url = f"{BILI_BASE}{v.bvid}"
    return out


@router.get("/api/videos", response_model=List[VideoOut])
async def list_public_videos(db: AsyncSession = Depends(get_async_db)):
    """获取展示中的视频列表（公开，首页/攻略页用）。只读库存封面，不发起网络请求"""
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
    data = req.model_dump()
    bvid = parse_bvid(data.get("bvid") or "")
    if not bvid:
        raise HTTPException(status_code=400, detail="无法识别 BV 号，请检查链接或 BV 号是否填写正确")
    data["bvid"] = bvid

    v = BiliVideo(**data)
    db.add(v)
    await db.flush()

    # 标题为空 / 需要本地化封面时，统一抓一次 B站 元信息
    if not (v.title or "").strip() or _needs_localize(v.cover_url):
        meta = await asyncio.to_thread(_fetch_meta_sync, bvid)
        if not (v.title or "").strip() and meta.get("title"):
            v.title = meta["title"][:128]
        if _needs_localize(v.cover_url) and meta.get("cover"):
            local = await asyncio.to_thread(_download_cover_sync, bvid, meta["cover"])
            v.cover_url = local or meta["cover"]  # 下载失败则退回 B站 原始直链

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

    payload = req.model_dump(exclude_unset=True)
    bvid_changed = False
    if payload.get("bvid"):
        parsed = parse_bvid(payload["bvid"])
        if not parsed:
            raise HTTPException(status_code=400, detail="无法识别 BV 号，请检查链接或 BV 号是否填写正确")
        bvid_changed = parsed != v.bvid
        payload["bvid"] = parsed

    for key, value in payload.items():
        setattr(v, key, value)

    # BV 号变更 -> 先清空封面；随后若封面缺失/仍是 B站 直链则重新抓取
    if bvid_changed:
        v.cover_url = None
    if _needs_localize(v.cover_url):
        await ensure_cover(v)

    await db.commit()
    await db.refresh(v)
    return await _to_out(v)


@router.post("/api/admin/videos/{vid}/refresh-cover", response_model=VideoOut)
async def admin_refresh_cover(
    vid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """重新抓取单条视频封面"""
    result = await db.execute(select(BiliVideo).where(BiliVideo.id == vid))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="视频不存在")
    ok = await ensure_cover(v, force=True)
    if not ok:
        raise HTTPException(status_code=502, detail="未能获取到封面（B站接口异常或 BV 号无效）")
    await db.commit()
    await db.refresh(v)
    return await _to_out(v)


@router.post("/api/admin/videos/refresh-covers")
async def admin_refresh_all_covers(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """全量刷新封面（补历史数据）"""
    result = await db.execute(select(BiliVideo).order_by(BiliVideo.id))
    videos = result.scalars().all()
    ok, fail = 0, 0
    for v in videos:
        if await ensure_cover(v, force=True):
            ok += 1
        else:
            fail += 1
    await db.commit()
    return {"message": f"刷新完成：成功 {ok} 条，失败 {fail} 条", "ok": ok, "fail": fail}


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
