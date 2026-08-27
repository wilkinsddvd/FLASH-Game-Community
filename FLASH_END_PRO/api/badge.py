"""
勋章系统 API
- 公开：用户勋章列表（个人主页展示，任何人可见）
- 管理端：勋章定义 CRUD
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from db.db import get_async_db
from model.user import User
from model.badge import Badge, UserBadge
from schemas.badge import BadgeOut, UserBadgeOut

router = APIRouter(tags=["勋章系统"])


@router.get("/api/badges", response_model=List[BadgeOut])
async def list_badges(db: AsyncSession = Depends(get_async_db)):
    """勋章定义列表（公开，展示用）"""
    result = await db.execute(select(Badge).order_by(Badge.sort_order, Badge.id))
    return result.scalars().all()


@router.get("/api/users/{uid}/badges", response_model=List[UserBadgeOut])
async def user_badges(uid: int, db: AsyncSession = Depends(get_async_db)):
    """用户获得的勋章（公开，个人主页展示，他人可见）"""
    user = (await db.execute(select(User).where(User.uid == uid))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user.id)
        .order_by(UserBadge.created_at.desc())
    )
    out = []
    for ub, b in result.all():
        out.append(UserBadgeOut(
            id=b.id, code=b.code, name=b.name, icon=b.icon,
            description=b.description, sort_order=b.sort_order,
            source=ub.source, earned_at=ub.created_at,
        ))
    return out


@router.get("/api/users/{uid}/badges/check", response_model=dict)
async def check_user_badge_code(uid: int, db: AsyncSession = Depends(get_async_db)):
    """检查用户是否已获得某勋章（前端答题页轮询用，公开）"""
    user = (await db.execute(select(User).where(User.uid == uid))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    result = await db.execute(
        select(Badge.code).join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user.id)
    )
    return {"codes": [c for (c,) in result.all()]}


# ── 管理端：勋章定义 CRUD ──

@router.get("/api/admin/badges", response_model=List[BadgeOut])
async def admin_list_badges(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Badge).order_by(Badge.sort_order, Badge.id))
    return result.scalars().all()


@router.post("/api/admin/badges", response_model=BadgeOut, status_code=201)
async def admin_create_badge(
    req: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    badge = Badge(
        code=req.get("code", "").strip(),
        name=req.get("name", "").strip(),
        icon=req.get("icon", "🏅"),
        description=req.get("description"),
        sort_order=req.get("sort_order", 0),
    )
    if not badge.code or not badge.name:
        raise HTTPException(status_code=400, detail="code 和 name 必填")
    db.add(badge)
    await db.commit()
    await db.refresh(badge)
    return badge


@router.put("/api/admin/badges/{bid}", response_model=BadgeOut)
async def admin_update_badge(
    bid: int,
    req: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Badge).where(Badge.id == bid))
    badge = result.scalar_one_or_none()
    if not badge:
        raise HTTPException(status_code=404, detail="勋章不存在")
    for key in ("code", "name", "icon", "description", "sort_order"):
        if key in req:
            setattr(badge, key, req[key])
    await db.commit()
    await db.refresh(badge)
    return badge


@router.delete("/api/admin/badges/{bid}", status_code=204)
async def admin_delete_badge(
    bid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Badge).where(Badge.id == bid))
    badge = result.scalar_one_or_none()
    if not badge:
        raise HTTPException(status_code=404, detail="勋章不存在")
    # 删除关联的用户勋章记录
    ub_result = await db.execute(select(UserBadge).where(UserBadge.badge_id == bid))
    for ub in ub_result.scalars().all():
        await db.delete(ub)
    await db.delete(badge)
    await db.commit()
