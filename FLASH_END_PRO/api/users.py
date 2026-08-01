"""
用户空间 & 关注 API
- GET/PUT /users/me          当前用户信息（含私有字段）
- POST /users/me/avatar      上传头像
- POST /users/me/space-cover 上传空间背景
- PUT /users/me/username     修改用户名（180天1次）
- GET /users/{uid}/level     等级信息
- GET /users/{uid}           用户公开信息（个人空间）
- POST/DELETE /users/{uid}/follow 关注/取关
"""
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_current_user_optional
from core.security import verify_password
from core.config import settings
from db.db import get_async_db
from model.user import User
from model.follow import UserFollow
from model.message import Message
from model.role import Role, user_roles
from schemas.users import UserProfileOut, FollowActionOut, UserMeOut, LevelOut

router = APIRouter(prefix="/api/users", tags=["用户空间"])

# 等级体系（需求文档 v2）
LEVEL_THRESHOLDS = [0, 200, 1500, 4500, 10800, 28800]
LEVEL_TITLES = {
    1: "新手玩家", 2: "初级玩家", 3: "进阶玩家",
    4: "资深玩家", 5: "精英玩家", 6: "传奇玩家",
}
NICKNAME_CHANGE_DAYS = 90
USERNAME_CHANGE_DAYS = 180
ALLOWED_THEMES = {"default", "dark", "blue"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png"}


def _calc_level(exp: int):
    """根据经验值计算等级"""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS, start=1):
        if exp >= threshold:
            level = i
    next_exp = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
    prev_exp = LEVEL_THRESHOLDS[level - 1] if level > 1 else 0
    if level >= len(LEVEL_THRESHOLDS):
        progress = 100.0
    elif next_exp == prev_exp:
        progress = 100.0
    else:
        progress = round((exp - prev_exp) / (next_exp - prev_exp) * 100, 1)
    return level, next_exp, progress


async def _user_role(user: User, db: AsyncSession) -> str:
    """获取用户最高角色编码"""
    result = await db.execute(
        select(Role.code).join(user_roles).where(user_roles.c.user_id == user.id)
    )
    codes = {row[0] for row in result.all()}
    for code in ("super_admin", "admin"):
        if code in codes:
            return code
    return "user" if codes else "guest"


async def _profile_out(
    user: User,
    db: AsyncSession,
    viewer: Optional[User] = None,
) -> UserProfileOut:
    is_following = False
    if viewer and viewer.id != user.id:
        result = await db.execute(
            select(UserFollow.id).where(
                UserFollow.follower_id == viewer.id,
                UserFollow.following_id == user.id,
            )
        )
        is_following = result.scalar_one_or_none() is not None

    return UserProfileOut(
        id=user.id,
        uid=user.uid,
        username=user.username,
        nickname=user.nickname,
        avatar=user.avatar,
        bio=user.bio,
        gender=user.gender,
        birthday=user.birthday,
        location=user.location,
        space_cover=user.space_cover,
        space_theme=user.space_theme or "default",
        level=user.level or 1,
        exp=user.exp or 0,
        post_count=user.post_count or 0,
        reply_count=user.reply_count or 0,
        like_received=user.like_received or 0,
        follower_count=user.follower_count or 0,
        following_count=user.following_count or 0,
        role=await _user_role(user, db),
        is_following=is_following,
        created_at=user.created_at,
    )


async def _save_upload(
    file: UploadFile,
    subdir: str,
    max_mb: int,
    uid: int,
) -> str:
    """保存上传文件，返回 URL 路径"""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="仅支持 JPG/PNG 图片")
    content = await file.read()
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"图片大小不能超过 {max_mb}MB")

    upload_root = settings.upload_dir
    target_dir = os.path.join(upload_root, subdir)
    os.makedirs(target_dir, exist_ok=True)
    filename = f"{uid}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(target_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{subdir}/{filename}"


# ════════════════════════════════════════
# 0. 当前登录用户信息（注意：必须在 /{uid} 之前注册）
# ════════════════════════════════════════

@router.get("/me", response_model=UserMeOut)
async def get_me(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前登录用户完整信息（含私有字段）"""
    nickname_can_change_at = None
    if current_user.nickname_updated_at:
        nickname_can_change_at = current_user.nickname_updated_at + timedelta(days=NICKNAME_CHANGE_DAYS)

    return UserMeOut(
        id=current_user.id,
        uid=current_user.uid,
        username=current_user.username,
        nickname=current_user.nickname,
        avatar=current_user.avatar,
        bio=current_user.bio,
        gender=current_user.gender or 0,
        birthday=current_user.birthday,
        location=current_user.location,
        space_cover=current_user.space_cover,
        space_theme=current_user.space_theme or "default",
        level=current_user.level or 1,
        exp=current_user.exp or 0,
        post_count=current_user.post_count or 0,
        reply_count=current_user.reply_count or 0,
        like_received=current_user.like_received or 0,
        follower_count=current_user.follower_count or 0,
        following_count=current_user.following_count or 0,
        role=await _user_role(current_user, db),
        nickname_can_change_at=nickname_can_change_at,
        registration_method=current_user.registration_method,
        created_at=current_user.created_at,
    )


@router.put("/me")
async def update_me(
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """更新当前用户信息（昵称/签名/性别/生日/所在地/主题）"""
    # ── 昵称：90 天限改 1 次 ──
    if "nickname" in body and body["nickname"] is not None:
        nickname = str(body["nickname"]).strip()
        if not (1 <= len(nickname) <= 20):
            raise HTTPException(status_code=400, detail="昵称长度需为 1~20 字符")
        if nickname.isdigit():
            raise HTTPException(status_code=400, detail="昵称不允许为纯数字")
        if current_user.nickname_updated_at:
            can_change_at = current_user.nickname_updated_at + timedelta(days=NICKNAME_CHANGE_DAYS)
            if datetime.now() < can_change_at:
                remaining = (can_change_at - datetime.now()).days
                raise HTTPException(
                    status_code=400,
                    detail=f"昵称修改过于频繁，{remaining} 天后可再次修改",
                )
        current_user.nickname = nickname
        current_user.nickname_updated_at = datetime.now()

    # ── 个人签名 ──
    if "bio" in body and body["bio"] is not None:
        bio = str(body["bio"]).strip()
        if len(bio) > 30:
            raise HTTPException(status_code=400, detail="个人签名不能超过 30 字符")
        current_user.bio = bio

    # ── 性别：选择后不可修改 ──
    if "gender" in body and body["gender"] is not None:
        gender = int(body["gender"])
        if gender not in (0, 1, 2):
            raise HTTPException(status_code=400, detail="性别参数不正确")
        if current_user.gender and current_user.gender != 0 and gender != current_user.gender:
            raise HTTPException(status_code=400, detail="性别选择后无法修改")
        current_user.gender = gender

    # ── 生日：设置后不可修改 ──
    if "birthday" in body and body["birthday"] is not None:
        if current_user.birthday:
            raise HTTPException(status_code=400, detail="生日设置后无法修改")
        try:
            current_user.birthday = datetime.strptime(str(body["birthday"])[:10], "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="生日格式不正确")

    # ── 所在地 ──
    if "location" in body and body["location"] is not None:
        location = str(body["location"]).strip()
        if len(location) > 30:
            raise HTTPException(status_code=400, detail="所在地格式不正确")
        current_user.location = location or None

    # ── 空间主题 ──
    if "space_theme" in body and body["space_theme"] is not None:
        theme = str(body["space_theme"])
        if theme not in ALLOWED_THEMES:
            raise HTTPException(status_code=400, detail="空间主题不正确")
        current_user.space_theme = theme

    await db.commit()
    await db.refresh(current_user)
    return await get_me(db, current_user)


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """上传头像（JPG/PNG，最大 2MB）"""
    avatar = await _save_upload(file, "avatars", 2, current_user.uid)
    # 删除旧头像
    if current_user.avatar and current_user.avatar.startswith("/uploads/"):
        old_path = os.path.join(settings.upload_dir, current_user.avatar.replace("/uploads/", "", 1))
        if os.path.exists(old_path):
            os.remove(old_path)
    current_user.avatar = avatar
    await db.commit()
    return {"avatar": avatar}


@router.post("/me/space-cover")
async def upload_space_cover(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """上传空间背景图（JPG/PNG，最大 5MB）"""
    cover = await _save_upload(file, "covers", 5, current_user.uid)
    if current_user.space_cover and current_user.space_cover.startswith("/uploads/"):
        old_path = os.path.join(settings.upload_dir, current_user.space_cover.replace("/uploads/", "", 1))
        if os.path.exists(old_path):
            os.remove(old_path)
    current_user.space_cover = cover
    await db.commit()
    return {"space_cover": cover}


@router.put("/me/username")
async def change_username(
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """修改用户名（需验证密码，180 天限改 1 次）"""
    username = str(body.get("username") or "").strip()
    password = body.get("password") or ""

    if not re.match(r"^[a-zA-Z0-9_]{3,20}$", username):
        raise HTTPException(status_code=400, detail="用户名需为 3~20 位字母/数字/下划线")
    if not verify_password(password, current_user.password_hash):
        raise HTTPException(status_code=403, detail="当前密码错误")

    if current_user.username_updated_at:
        can_change_at = current_user.username_updated_at + timedelta(days=USERNAME_CHANGE_DAYS)
        if datetime.now() < can_change_at:
            remaining = (can_change_at - datetime.now()).days
            raise HTTPException(status_code=400, detail=f"用户名修改过于频繁，{remaining} 天后可再次修改")

    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="用户名已被占用")

    current_user.username = username
    current_user.username_updated_at = datetime.now()
    await db.commit()
    return {"message": "用户名修改成功"}


# ════════════════════════════════════════
# 1. 等级信息
# ════════════════════════════════════════

@router.get("/{uid}/level", response_model=LevelOut)
async def get_user_level(
    uid: int,
    db: AsyncSession = Depends(get_async_db),
):
    """获取用户等级信息"""
    result = await db.execute(select(User).where(User.uid == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    exp = user.exp or 0
    level, next_exp, progress = _calc_level(exp)
    return LevelOut(
        level=level,
        current_exp=exp,
        next_level_exp=next_exp,
        progress_percent=progress,
        title=LEVEL_TITLES.get(level, ""),
    )


# ════════════════════════════════════════
# 2. 获取用户公开信息（个人空间，游客可访问）
# ════════════════════════════════════════

@router.get("/{uid}", response_model=UserProfileOut)
async def get_user_profile(
    uid: int,
    db: AsyncSession = Depends(get_async_db),
    viewer: Optional[User] = Depends(get_current_user_optional),
):
    """获取指定用户公开信息（UID 定位）"""
    result = await db.execute(select(User).where(User.uid == uid))
    user = result.scalar_one_or_none()
    if not user or user.status == 0:
        raise HTTPException(status_code=404, detail="用户不存在")
    return await _profile_out(user, db, viewer)


# ════════════════════════════════════════
# 3. 关注 / 取关
# ════════════════════════════════════════

@router.post("/{uid}/follow", response_model=FollowActionOut)
async def follow_user(
    uid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """关注用户"""
    result = await db.execute(select(User).where(User.uid == uid))
    target = result.scalar_one_or_none()
    if not target or target.status == 0:
        raise HTTPException(status_code=404, detail="用户不存在")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能关注自己")

    exists = await db.execute(
        select(UserFollow.id).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == target.id,
        )
    )
    if exists.scalar_one_or_none():
        # 已关注，幂等返回
        return FollowActionOut(
            is_following=True,
            follower_count=target.follower_count or 0,
            following_count=current_user.following_count or 0,
        )

    db.add(UserFollow(follower_id=current_user.id, following_id=target.id))
    target.follower_count = (target.follower_count or 0) + 1
    current_user.following_count = (current_user.following_count or 0) + 1

    # 互动通知：有人关注了你
    db.add(Message(
        sender_id=current_user.id,
        receiver_id=target.id,
        type="interaction",
        title="新的关注",
        content=f"用户 {current_user.username} 关注了你",
        related_type="follow",
        related_id=current_user.id,
    ))
    await db.commit()

    return FollowActionOut(
        is_following=True,
        follower_count=target.follower_count,
        following_count=current_user.following_count,
    )


@router.delete("/{uid}/follow", response_model=FollowActionOut)
async def unfollow_user(
    uid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """取消关注"""
    result = await db.execute(select(User).where(User.uid == uid))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    rel = await db.execute(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == target.id,
        )
    )
    record = rel.scalar_one_or_none()
    if record:
        await db.delete(record)
        target.follower_count = max((target.follower_count or 0) - 1, 0)
        current_user.following_count = max((current_user.following_count or 0) - 1, 0)
        await db.commit()

    return FollowActionOut(
        is_following=False,
        follower_count=target.follower_count,
        following_count=current_user.following_count,
    )
