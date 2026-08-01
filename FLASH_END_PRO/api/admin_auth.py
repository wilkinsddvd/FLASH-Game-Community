"""
管理员口令注册 & 口令管理 API
"""
import random
import re

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import hash_password, create_access_token, create_refresh_token
from core.crypto import encrypt_email, hash_email
from core.redis import redis_client
from core.email import send_verify_code
from core.uid import generate_uid
from core.admin_auth import (
    verify_admin_passphrase,
    hash_passphrase,
    check_brute_force,
    record_failed_attempt,
    reset_attempts,
    verify_passphrase_hash,
    list_passphrases,
    add_passphrase,
    delete_passphrase,
)
from db.db import get_async_db
from model.user import User
from model.role import Role, user_roles
from model.admin_passphrase import AdminPassphrase
from schemas.auth import TokenResponse, EmailSendCodeRequest, EmailSendCodeResponse
from schemas.admin_auth import (
    AdminRegisterRequest,
    AdminEmailRegisterRequest,
    PassphraseCreateRequest,
    PassphraseOut,
    PassphraseListResponse,
)
from api.deps import get_current_user, require_permissions

router = APIRouter(prefix="/api/auth/admin", tags=["管理员注册"])

VERIFY_PREFIX = "verify:email:"
RATE_PREFIX = "rate:email:"


def _get_client_ip(request: Request) -> str:
    """获取客户端 IP"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _assign_admin_role(user_id: int, db: AsyncSession):
    """给用户分配 admin 角色"""
    result = await db.execute(select(Role).where(Role.code == "admin"))
    admin_role = result.scalar_one_or_none()
    if admin_role:
        stmt = insert(user_roles).values(user_id=user_id, role_id=admin_role.id)
        await db.execute(stmt)


async def _generate_username(email: str, db: AsyncSession) -> str:
    """根据邮箱前缀生成唯一用户名"""
    prefix = email.split("@")[0]
    prefix = re.sub(r"[^a-zA-Z0-9_]", "_", prefix)[:16]
    result = await db.execute(select(User).where(User.username == prefix))
    if result.scalar_one_or_none() is None:
        return prefix
    for _ in range(10):
        name = f"{prefix}_{random.randint(100, 999)}"
        result = await db.execute(select(User).where(User.username == name))
        if result.scalar_one_or_none() is None:
            return name
    raise HTTPException(status_code=500, detail="用户名生成失败")


# ════════════════════════════════════════
# 1. 用户名+口令 管理员注册
# ════════════════════════════════════════

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def admin_register(
    req: AdminRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """管理员注册（用户名+口令）"""
    client_ip = _get_client_ip(request)

    # 暴力破解检查
    if await check_brute_force(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"尝试次数过多，请 {settings.brute_force_lockout_minutes} 分钟后再试",
        )

    # 口令验证
    passphrase_ok = await verify_admin_passphrase(req.passphrase, db)
    if not passphrase_ok:
        remaining = await record_failed_attempt(client_ip)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"口令错误次数过多，已锁定 {settings.brute_force_lockout_minutes} 分钟",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"管理员口令错误，还剩 {remaining} 次尝试机会",
        )

    # 用户名查重
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    # 创建用户
    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        registration_method="normal",
        uid=await generate_uid(db),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 分配 admin 角色
    await _assign_admin_role(user.id, db)
    await db.commit()

    # 清除尝试记录
    await reset_attempts(client_ip)

    # 签发令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ════════════════════════════════════════
# 2. 发送邮箱验证码（管理员注册用）
# ════════════════════════════════════════

@router.post("/send-code", response_model=EmailSendCodeResponse)
async def admin_send_code(req: EmailSendCodeRequest):
    """发送邮箱验证码（管理员注册）"""
    email = req.email
    r = await redis_client.connect()

    rate_key = f"{RATE_PREFIX}{email}"
    if await r.exists(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="发送过于频繁，请稍后再试",
        )

    code = f"{random.randint(0, 999999):06d}"
    verify_key = f"{VERIFY_PREFIX}{email}"
    await r.set(verify_key, code, ex=300)
    await r.set(rate_key, "1", ex=60)

    try:
        send_verify_code(email, code, purpose="register")
    except ValueError as e:
        await r.delete(verify_key, rate_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        await r.delete(verify_key, rate_key)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="邮件发送失败，请稍后再试",
        )

    return EmailSendCodeResponse()


# ════════════════════════════════════════
# 3. 邮箱+口令 管理员注册
# ════════════════════════════════════════

@router.post("/email/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def admin_email_register(
    req: AdminEmailRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """管理员注册（邮箱+口令）"""
    client_ip = _get_client_ip(request)
    email = req.email

    # 暴力破解检查
    if await check_brute_force(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"尝试次数过多，请 {settings.brute_force_lockout_minutes} 分钟后再试",
        )

    # 口令验证
    passphrase_ok = await verify_admin_passphrase(req.passphrase, db)
    if not passphrase_ok:
        remaining = await record_failed_attempt(client_ip)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"口令错误次数过多，已锁定 {settings.brute_force_lockout_minutes} 分钟",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"管理员口令错误，还剩 {remaining} 次尝试机会",
        )

    # 校验邮箱验证码
    r = await redis_client.connect()
    verify_key = f"{VERIFY_PREFIX}{email}"
    stored_code = await r.get(verify_key)
    if stored_code is None or stored_code != req.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期",
        )
    await r.delete(verify_key)

    # 邮箱查重
    eh = hash_email(email)
    result = await db.execute(select(User).where(User.email_hash == eh))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="该邮箱已被注册")

    # 创建用户
    encrypted = encrypt_email(email)
    username = await _generate_username(email, db)

    user = User(
        username=username,
        password_hash=hash_password(req.password),
        email=encrypted,
        email_hash=eh,
        registration_method="email",
        uid=await generate_uid(db),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 分配 admin 角色
    await _assign_admin_role(user.id, db)
    await db.commit()

    # 清除尝试记录
    await reset_attempts(client_ip)

    # 签发令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ════════════════════════════════════════
# 4. 口令池管理（需要 admin 权限）
#    规则：可增加、可删除、不可修改内容；每个口令最多使用 5 次
# ════════════════════════════════════════

@router.get("/passphrase", response_model=PassphraseListResponse)
async def list_passphrase(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:read")),
):
    """获取口令池列表（含每个口令的使用次数）"""
    records = await list_passphrases(db)
    items = [
        PassphraseOut(
            id=r.id,
            use_count=r.use_count,
            is_builtin=r.is_builtin,
            max_uses=settings.passphrase_max_uses,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in records
    ]
    return PassphraseListResponse(
        items=items,
        total=len(items),
        max_uses=settings.passphrase_max_uses,
    )


@router.post("/passphrase", status_code=status.HTTP_201_CREATED)
async def create_passphrase(
    req: PassphraseCreateRequest,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:update")),
):
    """新增管理员口令（口令只增不删改，内容不可更改）"""
    try:
        record = await add_passphrase(req.passphrase, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return {
        "message": "口令新增成功",
        "data": PassphraseOut(
            id=record.id,
            use_count=record.use_count,
            is_builtin=record.is_builtin,
            max_uses=settings.passphrase_max_uses,
            created_at=record.created_at,
            updated_at=record.updated_at,
        ),
    }


@router.delete("/passphrase/{passphrase_id}")
async def remove_passphrase(
    passphrase_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:update")),
):
    """删除管理员口令（初始口令不可删除，至少保留一个口令）"""
    try:
        await delete_passphrase(passphrase_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"message": "口令删除成功"}
