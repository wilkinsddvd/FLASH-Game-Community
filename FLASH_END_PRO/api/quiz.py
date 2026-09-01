"""
基础认证答题系统 API
- 公开：获取QA文档列表 / 认证分类列表 / 分类题目列表（不含答案）/ 提交答案
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
    QuizCategoryOut,
    QuizSubmit, QuizRecordOut, QuizSubmitResult,
    QuizRecordDetail, QuizAnswerDetail,
)

router = APIRouter(tags=["基础认证"])

PASS_SCORE = 90  # 达标分数线
QUIZ_BADGE_CODE = "quiz_90"  # 达标勋章代码

# 认证分类定义
QUIZ_CATEGORIES = [
    {"code": "rifleman", "name": "步枪兵基础认证", "description": "步枪手基础武器操作与战斗常识"},
    {"code": "medic", "name": "医疗兵基础认证", "description": "战场急救、治疗与救死扶伤"},
    {"code": "autorifleman", "name": "班用机枪手基础认证", "description": "班用轻机枪（自动步枪手）火力支援"},
    {"code": "machinegunner", "name": "通用机枪手基础认证", "description": "通用机枪架设与压制射击"},
    {"code": "grenadier", "name": "榴弹射手基础认证", "description": "榴弹发射器与高爆/烟雾弹药运用"},
    {"code": "marksman", "name": "特种射手基础认证", "description": "精确射手步枪与远距离观测"},
    {"code": "lat", "name": "轻型反坦克手基础认证", "description": "轻型反坦克武器（一次性火箭筒）"},
    {"code": "hat", "name": "重型反坦克手基础认证", "description": "重型反坦克导弹（有线/制导）"},
    {"code": "crewman", "name": "载具组员基础认证", "description": "装甲载具驾驶、乘员协作与维修"},
    {"code": "pilot", "name": "飞行员基础认证", "description": "直升机驾驶、起降与机降配合"},
    {"code": "squadleader", "name": "小队领导基础认证", "description": "小队长职责、集结点与指挥"},
    {"code": "commander", "name": "指挥官基础认证", "description": "指挥官技能、侦察与全局指挥（20题）"},
]

# 认证分类 → 专属勋章代码（每个认证各自特定的勋章）
CATEGORY_BADGE_MAP = {
    "rifleman": "quiz_rifleman",
    "medic": "quiz_medic",
    "autorifleman": "quiz_autorifleman",
    "machinegunner": "quiz_machinegunner",
    "grenadier": "quiz_grenadier",
    "marksman": "quiz_marksman",
    "lat": "quiz_lat",
    "hat": "quiz_hat",
    "crewman": "quiz_crewman",
    "pilot": "quiz_pilot",
    "squadleader": "quiz_squadleader",
    "commander": "quiz_commander",
}


async def _grant_badge(
    db: AsyncSession,
    user_id: int,
    badge_code: str,
    source: str,
):
    """颁发勋章（已拥有则不重复颁发），返回新颁发的勋章信息或 None"""
    badge_result = await db.execute(select(Badge).where(Badge.code == badge_code))
    badge = badge_result.scalar_one_or_none()
    if not badge:
        return None
    exists = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id,
        )
    )
    if exists.scalar_one_or_none():
        return None
    ub = UserBadge(user_id=user_id, badge_id=badge.id, source=source)
    db.add(ub)
    await db.commit()
    return {
        "id": badge.id,
        "code": badge.code,
        "name": badge.name,
        "icon": badge.icon,
        "description": badge.description,
    }


# ════════════════════════════════════════
# 认证分类 - 公开
# ════════════════════════════════════════

@router.get("/api/quiz/categories", response_model=List[QuizCategoryOut])
async def list_quiz_categories(db: AsyncSession = Depends(get_async_db)):
    """获取所有认证分类及题目数（公开）"""
    result = await db.execute(
        select(QuizQuestion.category, func.count(QuizQuestion.id))
        .where(QuizQuestion.status == 1)
        .group_by(QuizQuestion.category)
    )
    counts = {cat: cnt for cat, cnt in result.all()}
    out = []
    for c in QUIZ_CATEGORIES:
        out.append(QuizCategoryOut(
            code=c["code"],
            name=c["name"],
            description=c["description"],
            question_count=counts.get(c["code"], 0),
        ))
    return out


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
async def list_quiz_questions(
    category: str = "rifleman",
    db: AsyncSession = Depends(get_async_db),
):
    """获取指定认证分类的启用题目（不含正确答案，公开）"""
    result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.status == 1, QuizQuestion.category == category)
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
    """提交指定认证的答题并评分，>=90分自动颁发勋章"""
    result = await db.execute(
        select(QuizQuestion).where(
            QuizQuestion.status == 1,
            QuizQuestion.category == req.category,
        )
    )
    questions = result.scalars().all()
    if not questions:
        raise HTTPException(status_code=400, detail="该认证暂无题目")

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
        category=req.category,
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
        # 1. 颁发该认证分类的专属勋章（每个认证各自特定）
        cat_badge_code = CATEGORY_BADGE_MAP.get(req.category)
        if cat_badge_code:
            cat_badge = await _grant_badge(
                db, current_user.id, cat_badge_code,
                f"{req.category}认证达标",
            )
            if cat_badge:
                badge_earned = cat_badge
        # 2. 通用战术精英勋章（quiz_90，已拥有不重复）
        quiz90 = await _grant_badge(
            db, current_user.id, QUIZ_BADGE_CODE,
            f"基础认证90分({req.category})",
        )
        if quiz90 and badge_earned is None:
            badge_earned = quiz90

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
# 答题记录详情（需登录，仅本人可见）
# ════════════════════════════════════════

@router.get("/api/quiz/records/{record_id}", response_model=QuizRecordDetail)
async def quiz_record_detail(
    record_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """答题情况详情：全部题目 + 我的答案 + 正确答案（仅本人）"""
    result = await db.execute(select(QuizRecord).where(QuizRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="答题记录不存在")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看他人答题记录")

    q_result = await db.execute(
        select(QuizQuestion).where(
            QuizQuestion.category == record.category,
        )
    )
    questions = q_result.scalars().all()

    try:
        answers_map = json.loads(record.answers or "{}")
    except Exception:
        answers_map = {}

    answers = []
    for q in questions:
        user_ans = str(answers_map.get(str(q.id), "")).strip().upper()
        correct = q.correct_answer.upper()
        answers.append(QuizAnswerDetail(
            question_id=q.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            score=q.score,
            user_answer=user_ans,
            correct_answer=correct,
            is_correct=user_ans == correct,
        ))

    # 勋章信息
    badge_info = None
    if record.passed == 1:
        badge_code = CATEGORY_BADGE_MAP.get(record.category) or QUIZ_BADGE_CODE
        b_result = await db.execute(select(Badge).where(Badge.code == badge_code))
        badge = b_result.scalar_one_or_none()
        if badge:
            badge_info = {
                "id": badge.id,
                "code": badge.code,
                "name": badge.name,
                "icon": badge.icon,
                "description": badge.description,
            }

    return QuizRecordDetail(
        id=record.id,
        category=record.category,
        score=record.score,
        total=record.total,
        passed=record.passed,
        created_at=record.created_at,
        answers=answers,
        badge=badge_info,
    )


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
    category: str = "",
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    query = select(QuizQuestion)
    if category:
        query = query.where(QuizQuestion.category == category)
    result = await db.execute(query.order_by(QuizQuestion.category, QuizQuestion.sort_order, QuizQuestion.id))
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
