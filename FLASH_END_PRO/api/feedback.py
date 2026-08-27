"""
问题反馈 API
- 公开：提交反馈（需登录）
- 管理端：查看 / 处理反馈
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from db.db import get_async_db
from model.user import User
from model.feedback import Feedback
from schemas.feedback import FeedbackCreate, FeedbackReply, FeedbackOut

router = APIRouter(tags=["问题反馈"])

CATEGORY_LABELS = {
    "roster_error": "编制错误",
    "suggestion": "网站改进建议",
}


async def _to_out(fb: Feedback, db: AsyncSession) -> FeedbackOut:
    out = FeedbackOut.model_validate(fb)
    user = (await db.execute(select(User).where(User.id == fb.user_id))).scalar_one_or_none()
    out.user_name = user.username if user else f"用户{fb.user_id}"
    return out


@router.post("/api/feedback", response_model=FeedbackOut, status_code=201)
async def create_feedback(
    req: FeedbackCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """提交问题反馈（需登录）"""
    fb = Feedback(
        user_id=current_user.id,
        category=req.category,
        content=req.content,
        contact=req.contact,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return await _to_out(fb, db)


@router.get("/api/feedback/mine", response_model=List[FeedbackOut])
async def my_feedbacks(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """我提交的反馈（需登录）"""
    result = await db.execute(
        select(Feedback).where(Feedback.user_id == current_user.id).order_by(Feedback.id.desc()).limit(50)
    )
    return [await _to_out(fb, db) for fb in result.scalars().all()]


# ── 管理端 ──

@router.get("/api/admin/feedback", response_model=List[FeedbackOut])
async def admin_list_feedbacks(
    status_filter: Optional[int] = Query(None, ge=0, le=2),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """查看全部反馈（管理后台）"""
    query = select(Feedback).order_by(Feedback.id.desc())
    if status_filter is not None:
        query = query.where(Feedback.status == status_filter)
    result = await db.execute(query)
    return [await _to_out(fb, db) for fb in result.scalars().all()]


@router.put("/api/admin/feedback/{fid}", response_model=FeedbackOut)
async def admin_reply_feedback(
    fid: int,
    req: FeedbackReply,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """处理反馈：回复 / 更新状态"""
    result = await db.execute(select(Feedback).where(Feedback.id == fid))
    fb = result.scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="反馈不存在")
    if req.admin_reply is not None:
        fb.admin_reply = req.admin_reply
    if req.status is not None:
        fb.status = req.status
    await db.commit()
    await db.refresh(fb)
    return await _to_out(fb, db)
