"""
留言板 API
- 公开：读取被管理员选中展示的留言 / 游客或用户提交留言（需登录）
- 管理端：查看全部留言，选择展示、匿名、修改内容、删除
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, require_admin
from db.db import get_async_db
from model.user import User
from model.message_board import MessageBoard
from schemas.message_board import (
    MessageBoardCreate,
    MessageBoardPublicOut,
    MessageBoardAdminOut,
)

router = APIRouter(tags=["留言板"])

ANONYMOUS_NAME = "匿名"


async def _user_names(user_ids: List[int], db: AsyncSession) -> dict[int, dict]:
    """批量获取用户昵称/用户名"""
    ids = [i for i in set(user_ids) if i]
    if not ids:
        return {}
    result = await db.execute(select(User).where(User.id.in_(ids)))
    return {
        u.id: {"username": u.username, "nickname": u.nickname}
        for u in result.scalars().all()
    }


async def _admin_out(m: MessageBoard, names: dict) -> MessageBoardAdminOut:
    info = names.get(m.user_id) or {}
    return MessageBoardAdminOut(
        id=m.id,
        user_id=m.user_id,
        user_name=info.get("username") or (f"用户{m.user_id}" if m.user_id else "游客"),
        nickname=info.get("nickname"),
        content=m.content,
        original_content=m.original_content,
        is_displayed=m.is_displayed or 0,
        is_anonymous=m.is_anonymous or 0,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


# ════════════════════════════════════════
# 公开接口
# ════════════════════════════════════════

@router.get("/api/message-board", response_model=List[MessageBoardPublicOut])
async def list_public_messages(db: AsyncSession = Depends(get_async_db)):
    """留言板：仅返回被管理员选中展示的留言"""
    result = await db.execute(
        select(MessageBoard)
        .where(MessageBoard.is_displayed == 1)
        .order_by(MessageBoard.id.desc())
        .limit(50)
    )
    rows = result.scalars().all()
    names = await _user_names([m.user_id for m in rows], db)
    out = []
    for m in rows:
        anonymous = bool(m.is_anonymous)
        info = names.get(m.user_id) or {}
        display_name = ANONYMOUS_NAME if anonymous else (
            info.get("nickname") or info.get("username") or "游客"
        )
        out.append(MessageBoardPublicOut(
            id=m.id,
            content=m.content,
            is_anonymous=1 if anonymous else 0,
            display_name=display_name,
            created_at=m.created_at,
        ))
    return out


@router.post("/api/message-board", status_code=status.HTTP_201_CREATED)
async def create_message(
    req: MessageBoardCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """提交留言（需登录）。留言默认不展示，管理员筛选后才会出现在首页留言板。"""
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="留言内容不能为空")
    m = MessageBoard(
        user_id=current_user.id,
        content=content,
        original_content=content,
        is_displayed=0,
        is_anonymous=0,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return {"message": "留言已提交，管理员筛选通过后将展示在留言板", "id": m.id}


# ════════════════════════════════════════
# 管理端接口
# ════════════════════════════════════════

@router.get("/api/admin/message-board", response_model=List[MessageBoardAdminOut])
async def admin_list_messages(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """管理端：查看全部留言（含未展示的）"""
    result = await db.execute(select(MessageBoard).order_by(MessageBoard.id.desc()))
    rows = result.scalars().all()
    names = await _user_names([m.user_id for m in rows], db)
    return [await _admin_out(m, names) for m in rows]


@router.put("/api/admin/message-board/{mid}", response_model=MessageBoardAdminOut)
async def admin_update_message(
    mid: int,
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """管理端：修改展示内容 / 选择展示 / 设置匿名"""
    result = await db.execute(select(MessageBoard).where(MessageBoard.id == mid))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="留言不存在")

    if body.get("content") is not None:
        content = str(body["content"]).strip()
        if not content:
            raise HTTPException(status_code=400, detail="留言内容不能为空")
        if len(content) > 500:
            raise HTTPException(status_code=400, detail="留言内容不能超过 500 字")
        m.content = content
    if body.get("is_displayed") is not None:
        m.is_displayed = 1 if body["is_displayed"] else 0
    if body.get("is_anonymous") is not None:
        m.is_anonymous = 1 if body["is_anonymous"] else 0

    await db.commit()
    await db.refresh(m)
    names = await _user_names([m.user_id], db)
    return await _admin_out(m, names)


@router.delete("/api/admin/message-board/{mid}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_message(
    mid: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_admin),
):
    """管理端：删除留言"""
    result = await db.execute(select(MessageBoard).where(MessageBoard.id == mid))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="留言不存在")
    await db.delete(m)
    await db.commit()
