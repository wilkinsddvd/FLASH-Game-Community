"""
资料审核 API（头像 / 昵称 / 个性签名）
- 用户修改后进入待审核状态，审核通过后才对外展示
- 管理员/超管可查看待审核列表并通过 / 拒绝
"""
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_admin
from core.config import settings
from db.db import get_async_db
from model.user import User

router = APIRouter(prefix="/api/admin/audits", tags=["资料审核"])

FIELDS = {
    "avatar": ("pending_avatar", "pending_avatar_at", "avatar"),
    "nickname": ("pending_nickname", "pending_nickname_at", "nickname"),
    "bio": ("pending_bio", "pending_bio_at", "bio"),
}


def _remove_upload_file(path: str | None):
    """删除上传的待审核文件（头像）"""
    if path and path.startswith("/uploads/"):
        full = os.path.join(settings.upload_dir, path.replace("/uploads/", "", 1))
        if os.path.exists(full):
            try:
                os.remove(full)
            except OSError:
                pass


@router.get("")
async def list_audits(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """待审核资料列表（按用户聚合）"""
    result = await db.execute(
        select(User).where(
            (User.pending_avatar.isnot(None))
            | (User.pending_nickname.isnot(None))
            | (User.pending_bio.isnot(None))
        ).order_by(User.id)
    )
    users = result.scalars().all()

    items = []
    for u in users:
        pending = []
        for field, (col, at_col, _formal) in FIELDS.items():
            value = getattr(u, col)
            if value is not None:
                pending.append({
                    "field": field,
                    "value": value,
                    "submitted_at": getattr(u, at_col),
                })
        if pending:
            items.append({
                "user_id": u.id,
                "uid": u.uid,
                "username": u.username,
                "nickname": u.nickname,
                "avatar": u.avatar,
                "bio": u.bio,
                "pending": pending,
            })
    return {"items": items, "total": len(items)}


@router.post("/{user_id}/approve")
async def approve_audit(
    user_id: int,
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """审核通过：将待审核值写入正式展示字段"""
    field = str(body.get("field") or "").strip()
    if field not in FIELDS:
        raise HTTPException(status_code=400, detail="field 必须是 avatar/nickname/bio")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    col, at_col, formal_col = FIELDS[field]
    pending_value = getattr(user, col)
    if pending_value is None:
        raise HTTPException(status_code=400, detail="该字段没有待审核内容")

    from datetime import datetime
    # 删除旧的正式文件（头像）
    if field == "avatar":
        old = getattr(user, formal_col)
        if old and old != pending_value and old.startswith("/uploads/"):
            _remove_upload_file(old)

    setattr(user, formal_col, pending_value)
    if field == "nickname":
        user.nickname_updated_at = datetime.now()
    setattr(user, col, None)
    setattr(user, at_col, None)
    await db.commit()

    return {"message": f"{field} 审核通过，已展示"}


@router.post("/{user_id}/reject")
async def reject_audit(
    user_id: int,
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """审核拒绝：丢弃待审核值，保留原展示值"""
    field = str(body.get("field") or "").strip()
    if field not in FIELDS:
        raise HTTPException(status_code=400, detail="field 必须是 avatar/nickname/bio")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    col, at_col, _formal_col = FIELDS[field]
    pending_value = getattr(user, col)
    if pending_value is None:
        raise HTTPException(status_code=400, detail="该字段没有待审核内容")

    if field == "avatar":
        _remove_upload_file(pending_value)

    setattr(user, col, None)
    setattr(user, at_col, None)
    await db.commit()

    return {"message": f"{field} 审核已拒绝，原内容保持不变"}
