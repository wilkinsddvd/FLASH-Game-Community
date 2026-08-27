"""
基础认证答题系统 API
- 公开：获取QA文档列表 / 题目列表（不含答案）/ 提交答案
- 管理端：文档 CRUD / 题目 CRUD
"""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from db.db import get_async_db
from model.user import User
from model.quiz import QuizDoc, QuizQuestion, QuizRecord
from model.badge import Badge, UserBadge
from schemas.quiz import (
    QuizDocCreate, QuizDocUpdate, QuizDocOut,
    QuizQuestionCreate, QuizQuestionUpdate,
    QuizQuestionOut, QuizQuestionAdminOut,
    QuizSubmit, QuizRecordOut, QuizSubmitResult,
)

router = APIRouter(tags=["基础认证"])

PASS_SCORE = 90  # 达标分数线
QUIZ_BADGE_CODE = "quiz_90"  # 达标勋章代码


# ════════════════════════════════════════
# QA 文档 - 公开
# ════════════════════════════════════════

@router.get("/api/quiz/docs", response_model=List[QuizDocOut])
async def list_quiz_docs(db: AsyncSession = Depends(get_async_db)):
    """获取启用中的QA文档列表（公开）"""
    result = await db.execute(
        select(QuizDoc).where(QuizDoc.status == 1).order_by(QuizDoc.sort_order, QuizDoc.id)
    )
    return result.scalars().all()


# ════════════════════════════════════════
# 题目 - 公开（不含答案）
# ════════════════════════════════════════

@router.get("/api/quiz/questions", response_model=List[QuizQuestionOut])
async def list_quiz_questions(db: AsyncSession = Depends(get_async_db)):
    """获取启用中的题目（不含正确答案，公开）"""
    result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.status == 1)
        .order_by(QuizQuestion.sort_order, QuizQuestion.id)
    )
    return result.scalars().all()


# ════════════════════════════════════════
# 提交答案（需登录）
# ════════════════════════════════════════

@router.post("/api/quiz/submit", response_model=QuizSubmitResult)
async def submit_quiz(
    req: QuizSubmit,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """提交答题并评分，>=90分自动颁发勋章"""
    result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.status == 1)
    )
    questions = result.scalars().all()
    if not questions:
        raise HTTPException(status_code=400, detail="暂无题目")

    total = sum(q.score for q in questions)
    correct_count = 0
    score = 0
    normalized = {}
    for q in questions:
        ans = str(req.answers.get(str(q.id), "")).strip().upper()
        normalized[str(q.id)] = ans
        if ans == q.correct_answer.upper():
            correct_count += 1
            score += q.score

    passed = 1 if (total > 0 and score / total * 100 >= PASS_SCORE) else 0

    record = QuizRecord(
        user_id=current_user.id,
        score=score,
        total=total,
        answers=json.dumps(normalized, ensure_ascii=False),
        passed=passed,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # 达标 → 自动颁发勋章
    badge_earned = None
    if passed == 1:
        badge_result = await db.execute(
            select(Badge).where(Badge.code == QUIZ_BADGE_CODE)
        )
        badge = badge_result.scalar_one_or_none()
        if badge:
            exists = await db.execute(
                select(UserBadge).where(
                    UserBadge.user_id == current_user.id,
                    UserBadge.badge_id == badge.id,
                )
            )
            if not exists.scalar_one_or_none():
                ub = UserBadge(user_id=current_user.id, badge_id=badge.id, source="基础认证90分")
                db.add(ub)
                await db.commit()
                badge_earned = {
                    "id": badge.id,
                    "code": badge.code,
                    "name": badge.name,
                    "icon": badge.icon,
                    "description": badge.description,
                }

    percent = round(score / total * 100, 1) if total else 0
    return QuizSubmitResult(
        score=score,
        total=total,
        passed=percent >= PASS_SCORE,
        correct_count=correct_count,
        question_count=len(questions),
        record=record,
        badge_earned=badge_earned,
    )


# ════════════════════════════════════════
# 我的答题记录（需登录）
# ════════════════════════════════════════

@router.get("/api/quiz/my-records", response_model=List[QuizRecordOut])
async def my_quiz_records(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """我的答题记录（最近20条）"""
    result = await db.execute(
        select(QuizRecord)
        .where(QuizRecord.user_id == current_user.id)
        .order_by(QuizRecord.id.desc())
        .limit(20)
    )
    return result.scalars().all()


# ════════════════════════════════════════
# 管理端：QA 文档 CRUD
# ════════════════════════════════════════

@router.get("/api/admin/quiz/docs", response_model=List[QuizDocOut])
async def admin_list_docs(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizDoc).order_by(QuizDoc.sort_order, QuizDoc.id))
    return result.scalars().all()


@router.post("/api/admin/quiz/docs", response_model=QuizDocOut, status_code=201)
async def admin_create_doc(
    req: QuizDocCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    doc = QuizDoc(**req.model_dump())
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.put("/api/admin/quiz/docs/{doc_id}", response_model=QuizDocOut)
async def admin_update_doc(
    doc_id: int,
    req: QuizDocUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizDoc).where(QuizDoc.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/api/admin/quiz/docs/{doc_id}", status_code=204)
async def admin_delete_doc(
    doc_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizDoc).where(QuizDoc.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    await db.delete(doc)
    await db.commit()


@router.post("/api/admin/quiz/docs/upload", response_model=dict)
async def admin_upload_doc_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """上传QA文档文件（.md/.txt），返回内容文本"""
    content = (await file.read()).decode("utf-8", errors="ignore")
    if not content.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")
    return {"filename": file.filename, "content": content[:100000]}


# ════════════════════════════════════════
# 管理端：题目 CRUD
# ════════════════════════════════════════

@router.get("/api/admin/quiz/questions", response_model=List[QuizQuestionAdminOut])
async def admin_list_questions(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizQuestion).order_by(QuizQuestion.sort_order, QuizQuestion.id))
    return result.scalars().all()


@router.post("/api/admin/quiz/questions", response_model=QuizQuestionAdminOut, status_code=201)
async def admin_create_question(
    req: QuizQuestionCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    q = QuizQuestion(**req.model_dump())
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return q


@router.put("/api/admin/quiz/questions/{qid}", response_model=QuizQuestionAdminOut)
async def admin_update_question(
    qid: int,
    req: QuizQuestionUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id == qid))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(q, key, value)
    await db.commit()
    await db.refresh(q)
    return q


@router.delete("/api/admin/quiz/questions/{qid}", status_code=204)
async def admin_delete_question(
    qid: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id == qid))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    await db.delete(q)
    await db.commit()


@router.get("/api/admin/quiz/stats", response_model=dict)
async def admin_quiz_stats(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """答题统计：总人次 / 达标人次 / 平均分"""
    total = (await db.execute(select(func.count(QuizRecord.id)))).scalar() or 0
    passed = (await db.execute(
        select(func.count(QuizRecord.id)).where(QuizRecord.passed == 1)
    )).scalar() or 0
    avg = (await db.execute(select(func.avg(QuizRecord.score)))).scalar() or 0
    return {"total_attempts": total, "passed_attempts": passed, "avg_score": round(avg, 1)}
