from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.security import decode_token
from db.db import get_async_db
from model.user import User
from model.role import Role, Permission, user_roles, role_permissions

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db),
) -> User:
    """获取当前登录用户"""
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌载荷",
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or user.status == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_async_db),
) -> User | None:
    """可选获取当前用户（未登录时返回None）"""
    if credentials is None:
        return None

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    return user if user and user.status == 1 else None


async def get_user_permissions(user: User, db: AsyncSession) -> List[str]:
    """获取用户所有权限编码（含角色继承）"""
    # 加载用户角色及权限
    result = await db.execute(
        select(Role)
        .join(user_roles)
        .where(user_roles.c.user_id == user.id)
        .options(selectinload(Role.permissions))
    )
    roles = result.scalars().all()

    # 收集角色及其父角色的权限
    permission_codes = set()
    role_ids = {r.id for r in roles}
    processed = set()

    def collect_permissions(role_id_set):
        if not role_id_set:
            return
        r = db.execute(
            select(Role).where(Role.id.in_(role_id_set))
        ).scalars().all()
        for role in r:
            if role.id in processed:
                continue
            processed.add(role.id)
            for perm in role.permissions:
                permission_codes.add(perm.code)
            if role.parent_id:
                collect_permissions({role.parent_id})

    # 异步递归收集
    pending = set(role_ids)
    while pending:
        r_result = await db.execute(
            select(Role).where(Role.id.in_(pending))
        )
        roles_batch = r_result.scalars().all()
        next_pending = set()
        for role in roles_batch:
            if role.id in processed:
                continue
            processed.add(role.id)
            for perm in role.permissions:
                permission_codes.add(perm.code)
            if role.parent_id and role.parent_id not in processed:
                next_pending.add(role.parent_id)
        pending = next_pending

    return list(permission_codes)


def require_permissions(*required_codes: str):
    """权限校验装饰器"""
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_async_db),
    ) -> User:
        user_perms = await get_user_permissions(current_user, db)
        for code in required_codes:
            if code not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足: 需要 {code}",
                )
        return current_user
    return permission_checker
