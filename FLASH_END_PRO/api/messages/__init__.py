"""
站内信系统（短轮询）
- 系统通知 system_notice：全站公告、系统维护通知（管理员广播）
- 用户私信 private_message：用户之间一对一消息
- 互动通知 interaction：点赞 like / 回复 reply / 关注 follow
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from api.deps import get_current_user, require_permissions
from db.db import get_async_db
from model.user import User
from model.message import Message
from schemas.message import (
    MessageCreate,
    MessageOut,
    UnreadCountOut,
    SystemNoticeCreate,
    SystemNoticeOut,
)

router = APIRouter(prefix="/api/messages", tags=["站内信"])


def _to_out(msg: Message, sender_username: Optional[str] = None) -> MessageOut:
    return MessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        sender_username=sender_username,
        receiver_id=msg.receiver_id,
        type=msg.type,
        title=msg.title,
        content=msg.content,
        related_type=msg.related_type,
        related_id=msg.related_id,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


async def _resolve_receiver(
    req: MessageCreate, db: AsyncSession
) -> User:
    """按 receiver_id 或 receiver_username 解析接收者"""
    if req.receiver_id is None and not req.receiver_username:
        raise HTTPException(status_code=400, detail="必须提供 receiver_id 或 receiver_username")

    if req.receiver_id is not None:
        result = await db.execute(select(User).where(User.id == req.receiver_id))
    else:
        result = await db.execute(select(User).where(User.username == req.receiver_username))
    receiver = result.scalar_one_or_none()
    if not receiver or receiver.status == 0:
        raise HTTPException(status_code=404, detail="接收者不存在")
    return receiver


# ════════════════════════════════════════
# 1. 消息列表（短轮询拉取）
# ════════════════════════════════════════

@router.get("", response_model=List[MessageOut])
async def list_messages(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    msg_type: Optional[str] = Query(None, description="按类型过滤: system_notice/private_message/interaction"),
    unread_only: bool = Query(False, description="只看未读"),
):
    """获取当前用户的消息列表（按时间倒序）"""
    query = (
        select(Message, User.username)
        .outerjoin(User, User.id == Message.sender_id)
        .where(Message.receiver_id == current_user.id)
    )
    if msg_type:
        query = query.where(Message.type == msg_type)
    if unread_only:
        query = query.where(Message.is_read == 0)

    query = (
        query.order_by(Message.created_at.desc(), Message.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.all()
    return [_to_out(msg, sender_username=username) for msg, username in rows]


# ════════════════════════════════════════
# 2. 未读数量
# ════════════════════════════════════════

@router.get("/unread-count", response_model=UnreadCountOut)
async def unread_count(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """获取未读消息数"""
    result = await db.execute(
        select(func.count(Message.id)).where(
            Message.receiver_id == current_user.id,
            Message.is_read == 0,
        )
    )
    return UnreadCountOut(count=result.scalar() or 0)


# ════════════════════════════════════════
# 3. 发送私信
# ════════════════════════════════════════

@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_private_message(
    req: MessageCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """发送用户私信"""
    receiver = await _resolve_receiver(req, db)
    if receiver.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能给自己发送私信")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        type="private_message",
        title=req.title or "私信",
        content=req.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return _to_out(msg, sender_username=current_user.username)


# ════════════════════════════════════════
# 4. 标记已读
# ════════════════════════════════════════

@router.put("/{message_id}/read")
async def mark_read(
    message_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """标记单条消息为已读"""
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.receiver_id == current_user.id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="消息不存在")

    msg.is_read = 1
    await db.commit()
    return {"message": "已标记为已读"}


@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """全部标记为已读"""
    await db.execute(
        update(Message)
        .where(Message.receiver_id == current_user.id, Message.is_read == 0)
        .values(is_read=1)
    )
    await db.commit()
    return {"message": "已全部标记为已读"}


# ════════════════════════════════════════
# 5. 删除消息
# ════════════════════════════════════════

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """删除自己的消息"""
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.receiver_id == current_user.id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="消息不存在")

    await db.delete(msg)
    await db.commit()


# ════════════════════════════════════════
# 6. 系统通知广播（管理员）
# ════════════════════════════════════════

@router.post("/system", response_model=SystemNoticeOut, status_code=status.HTTP_201_CREATED)
async def send_system_notice(
    req: SystemNoticeCreate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("cms:manage")),
):
    """管理员发送全站系统通知（广播给所有正常用户）"""
    result = await db.execute(
        select(User.id).where(User.status == 1)
    )
    receiver_ids = [row[0] for row in result.all()]
    if not receiver_ids:
        raise HTTPException(status_code=400, detail="没有可接收通知的用户")

    for uid in receiver_ids:
        db.add(Message(
            sender_id=None,
            receiver_id=uid,
            type="system_notice",
            title=req.title,
            content=req.content,
        ))
    await db.commit()

    return SystemNoticeOut(
        id=0,
        title=req.title,
        content=req.content,
        created_at=datetime.now(),
        receiver_count=len(receiver_ids),
    )
