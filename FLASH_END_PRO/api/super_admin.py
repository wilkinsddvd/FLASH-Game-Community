"""
超级管理员系统 API
- 激活：已是系统管理员的用户，输入超管口令激活超管身份
- 超管专属：查看所有管理员信息 / 超管口令增删改查
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, insert, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.deps import get_current_user, require_super_admin, get_user_roles
from core.crypto import decrypt_email
from core.super_admin import (
    verify_super_admin_passphrase,
    list_super_passphrases,
    add_super_passphrase,
    update_super_passphrase,
    delete_super_passphrase,
)
from db.db import get_async_db
from model.user import User
from model.role import Role, user_roles
from model.super_admin_passphrase import SuperAdminPassphrase

router = APIRouter(tags=["超级管理员"])


def _mask_email(email: str | None) -> str | None:
    """邮箱脱敏：a***@domain.com"""
    if not email:
        return None
    try:
        plain = decrypt_email(email)
    except Exception:
        return None
    if "@" not in plain:
        return None
    local, domain = plain.split("@", 1)
    if len(local) <= 1:
        masked = local + "***"
    else:
        masked = local[0] + "***" + local[-1]
    return f"{masked}@{domain}"


async def _admin_info(user: User, db: AsyncSession) -> dict:
    result = await db.execute(
        select(Role.code).join(user_roles).where(user_roles.c.user_id == user.id)
    )
    codes = {r[0] for r in result.all()}
    role = "super_admin" if "super_admin" in codes else ("admin" if "admin" in codes else "user")
    return {
        "id": user.id,
        "uid": user.uid,
        "username": user.username,
        "nickname": user.nickname,
        "email": _mask_email(user.email),
        "role": role,
        "status": user.status,
        "banned_until": user.banned_until,
        "registration_method": user.registration_method,
        "created_at": user.created_at,
    }


# ════════════════════════════════════════
# 1. 激活超级管理员（需先为系统管理员 + 超管口令）
# ════════════════════════════════════════

@router.post("/api/auth/admin/super/activate")
async def activate_super_admin(
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """成为超级管理员：用户需已是系统管理员，输入超管口令验证"""
    passphrase = str(body.get("passphrase") or "").strip()
    if not passphrase:
        raise HTTPException(status_code=400, detail="请输入超级管理员口令")

    # 必须已是系统管理员
    codes = await get_user_roles(current_user, db)
    if "super_admin" in codes:
        return {"message": "您已经是超级管理员", "already": True}
    if "admin" not in codes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有系统管理员才能激活超级管理员身份",
        )

    # 校验超管口令
    ok = await verify_super_admin_passphrase(passphrase, db)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="超级管理员口令错误",
        )

    # 分配 super_admin 角色
    role_result = await db.execute(select(Role).where(Role.code == "super_admin"))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=500, detail="超级管理员角色不存在")

    exists = await db.execute(
        select(user_roles.c.user_id).where(
            user_roles.c.user_id == current_user.id,
            user_roles.c.role_id == role.id,
        )
    )
    if not exists.scalar_one_or_none():
        await db.execute(insert(user_roles).values(user_id=current_user.id, role_id=role.id))
        await db.commit()

    return {"message": "超级管理员激活成功", "already": False}


# ════════════════════════════════════════
# 2. 查看所有管理员信息（仅超管）
# ════════════════════════════════════════

@router.get("/api/admin/super/admins")
async def list_super_admins(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """查看所有管理员（含超级管理员）的信息"""
    result = await db.execute(
        select(User)
        .join(user_roles, user_roles.c.user_id == User.id)
        .join(Role, Role.id == user_roles.c.role_id)
        .where(Role.code.in_(["admin", "super_admin"]))
        .distinct()
        .order_by(User.id)
    )
    users = result.scalars().all()
    items = [await _admin_info(u, db) for u in users]
    return {"items": items, "total": len(items)}


# ════════════════════════════════════════
# 3. 超管口令管理（仅超管：查看/增加/修改/删除）
# ════════════════════════════════════════

@router.get("/api/admin/super/passphrases")
async def list_super_passphrase_api(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """查看超管口令列表（不暴露哈希）"""
    records = await list_super_passphrases(db)
    return {
        "items": [
            {
                "id": r.id,
                "remark": r.remark,
                "is_builtin": r.is_builtin,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in records
        ],
        "total": len(records),
    }


@router.post("/api/admin/super/passphrases", status_code=status.HTTP_201_CREATED)
async def create_super_passphrase_api(
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """新增超管口令"""
    passphrase = str(body.get("passphrase") or "")
    confirm = str(body.get("confirm_passphrase") or "")
    remark = str(body.get("remark") or "").strip()
    if len(passphrase) < 6:
        raise HTTPException(status_code=400, detail="口令至少 6 位")
    if passphrase != confirm:
        raise HTTPException(status_code=400, detail="两次输入的口令不一致")
    try:
        record = await add_super_passphrase(passphrase, remark, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return {
        "message": "超管口令新增成功",
        "data": {
            "id": record.id,
            "remark": record.remark,
            "is_builtin": record.is_builtin,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        },
    }


@router.put("/api/admin/super/passphrases/{passphrase_id}")
async def update_super_passphrase_api(
    passphrase_id: int,
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """修改超管口令（内容可改）"""
    passphrase = str(body.get("passphrase") or "")
    confirm = str(body.get("confirm_passphrase") or "")
    remark = body.get("remark")
    if len(passphrase) < 6:
        raise HTTPException(status_code=400, detail="口令至少 6 位")
    if passphrase != confirm:
        raise HTTPException(status_code=400, detail="两次输入的口令不一致")
    try:
        record = await update_super_passphrase(
            passphrase_id, passphrase,
            str(remark).strip() if remark is not None else None,
            db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "message": "超管口令修改成功",
        "data": {
            "id": record.id,
            "remark": record.remark,
            "is_builtin": record.is_builtin,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        },
    }


@router.delete("/api/admin/super/passphrases/{passphrase_id}")
async def delete_super_passphrase_api(
    passphrase_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """删除超管口令（初始口令不可删除，至少保留一个）"""
    try:
        await delete_super_passphrase(passphrase_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"message": "超管口令删除成功"}
