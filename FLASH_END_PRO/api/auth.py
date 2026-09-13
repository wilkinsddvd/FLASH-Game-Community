from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.captcha import create_captcha, verify_captcha
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from core.uid import generate_uid
from db.db import get_async_db
from model.user import User
from model.role import Role, user_roles
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserInfo
from api.deps import get_current_user, require_permissions, check_user_banned

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.get("/captcha")
async def get_captcha():
    """获取图形验证码（用户名注册 / 用户名登录用）"""
    return await create_captcha()


@router.post("/register", response_model=UserInfo, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """用户注册（需图形验证码）"""
    # 先校验图形验证码（放在查重之前，避免被用来探测用户名是否存在）
    if not await verify_captcha(req.captcha_id, req.captcha_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期，请点击图片刷新后重试",
        )

    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名已存在",
        )

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        uid=await generate_uid(db),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserInfo.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_async_db)):
    """用户名登录（需图形验证码）"""
    # 先校验图形验证码（放在查库之前，避免被用来探测用户名是否存在/暴力猜密码）
    if not await verify_captcha(req.captcha_id, req.captcha_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期，请点击图片刷新后重试",
        )

    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    if user.status == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    # 封禁检查
    check_user_banned(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_async_db)):
    """刷新Token"""
    payload = decode_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or user.status == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
        )

    # 封禁检查
    check_user_banned(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserInfo)
async def get_me(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户信息（含角色）"""
    info = UserInfo.model_validate(current_user)
    # 计算角色（super_admin > admin > user）
    result = await db.execute(
        select(Role.code).join(user_roles).where(user_roles.c.user_id == current_user.id)
    )
    codes = {row[0] for row in result.all()}
    if "super_admin" in codes:
        info.role = "super_admin"
    elif "admin" in codes:
        info.role = "admin"
    elif codes:
        info.role = "user"
    else:
        info.role = "guest"
    return info
