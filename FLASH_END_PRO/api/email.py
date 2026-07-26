"""
邮箱注册/登录/密码找回 API 路由
"""
import random
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password, verify_password, create_access_token, create_refresh_token
from core.crypto import encrypt_email, decrypt_email, hash_email
from core.redis import redis_client
from core.email import send_verify_code
from db.db import get_async_db
from model.user import User
from schemas.auth import (
    EmailSendCodeRequest, EmailSendCodeResponse,
    EmailRegisterRequest,
    EmailLoginRequest,
    EmailResetRequest, EmailResetConfirmRequest,
    TokenResponse, UserInfo,
)

router = APIRouter(prefix="/api/auth/email", tags=["邮箱认证"])

# ── Redis Key 前缀 ──
VERIFY_PREFIX = "verify:email:"
RATE_PREFIX = "rate:email:"


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


# ── 1. 发送验证码 ──

@router.post("/send-code", response_model=EmailSendCodeResponse)
async def send_code(req: EmailSendCodeRequest):
    """发送邮箱验证码（注册或找回密码共用）"""
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
            detail="邮件发送失败，请检查您的网络状况，请稍后再试",
        )

    return EmailSendCodeResponse()


# ── 2. 邮箱注册 ──

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def email_register(req: EmailRegisterRequest, db: AsyncSession = Depends(get_async_db)):
    """邮箱注册"""
    email = req.email
    r = await redis_client.connect()

    # 校验验证码
    verify_key = f"{VERIFY_PREFIX}{email}"
    stored_code = await r.get(verify_key)
    if stored_code is None or stored_code != req.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期",
        )
    await r.delete(verify_key)

    # 用哈希查重（确定性，可索引）
    eh = hash_email(email)
    result = await db.execute(select(User).where(User.email_hash == eh))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该邮箱已被注册",
        )

    encrypted = encrypt_email(email)
    username = await _generate_username(email, db)

    user = User(
        username=username,
        password_hash=hash_password(req.password),
        email=encrypted,
        email_hash=eh,
        registration_method="email",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ── 3. 邮箱登录 ──

@router.post("/login", response_model=TokenResponse)
async def email_login(req: EmailLoginRequest, db: AsyncSession = Depends(get_async_db)):
    """邮箱登录"""
    eh = hash_email(req.email)

    result = await db.execute(
        select(User).where(User.email_hash == eh, User.registration_method == "email")
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    if user.status == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ── 4. 密码找回-发送验证码 ──

@router.post("/reset-request", response_model=EmailSendCodeResponse)
async def reset_request(req: EmailResetRequest, db: AsyncSession = Depends(get_async_db)):
    """发送密码重置验证码"""
    eh = hash_email(req.email)

    # 查邮箱是否存在（不暴露，统一返回成功）
    result = await db.execute(
        select(User).where(User.email_hash == eh, User.registration_method == "email")
    )
    if result.scalar_one_or_none() is None:
        return EmailSendCodeResponse()

    r = await redis_client.connect()
    rate_key = f"{RATE_PREFIX}{req.email}"
    if await r.exists(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="发送过于频繁，请稍后再试",
        )

    code = f"{random.randint(0, 999999):06d}"
    verify_key = f"{VERIFY_PREFIX}{req.email}"
    await r.set(verify_key, code, ex=300)
    await r.set(rate_key, "1", ex=60)

    try:
        send_verify_code(req.email, code, purpose="reset")
    except Exception:
        await r.delete(verify_key, rate_key)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="邮件发送失败，请稍后再试",
        )

    return EmailSendCodeResponse()


# ── 5. 密码找回-设置新密码 ──

@router.post("/reset", response_model=TokenResponse)
async def reset_password(req: EmailResetConfirmRequest, db: AsyncSession = Depends(get_async_db)):
    """验证码校验后设置新密码"""
    email = req.email
    r = await redis_client.connect()

    verify_key = f"{VERIFY_PREFIX}{email}"
    stored_code = await r.get(verify_key)
    if stored_code is None or stored_code != req.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期",
        )
    await r.delete(verify_key)

    eh = hash_email(email)
    result = await db.execute(
        select(User).where(User.email_hash == eh, User.registration_method == "email")
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    user.password_hash = hash_password(req.new_password)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
