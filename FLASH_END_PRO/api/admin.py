from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.deps import get_current_user, require_permissions
from db.db import get_async_db
from model.user import User
from model.role import Role, Permission, user_roles, role_permissions
from schemas.rbac import (
    RoleCreate, RoleUpdate, RoleOut,
    PermissionCreate, PermissionOut,
    UserRoleAssign, RolePermissionAssign,
    UserListItem, UserStatusUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


# ════════════════════════════════════════
# 角色管理
# ════════════════════════════════════════

@router.get("/roles", response_model=List[RoleOut])
async def list_roles(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:read")),
):
    """获取角色列表"""
    result = await db.execute(select(Role).order_by(Role.id))
    return result.scalars().all()


@router.post("/roles", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
async def create_role(
    req: RoleCreate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:create")),
):
    """创建角色"""
    # 检查编码唯一性
    result = await db.execute(select(Role).where(Role.code == req.code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="角色编码已存在")

    role = Role(**req.model_dump())
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: int,
    req: RoleUpdate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:update")),
):
    """更新角色"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(role, key, value)
    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:delete")),
):
    """删除角色"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    await db.delete(role)
    await db.commit()


# ════════════════════════════════════════
# 权限管理
# ════════════════════════════════════════

@router.get("/permissions", response_model=List[PermissionOut])
async def list_permissions(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("permission:read")),
):
    """获取权限列表"""
    result = await db.execute(select(Permission).order_by(Permission.id))
    return result.scalars().all()


@router.post("/permissions", response_model=PermissionOut, status_code=201)
async def create_permission(
    req: PermissionCreate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("permission:create")),
):
    """创建权限"""
    data = req.model_dump()
    # 编码/操作标识留空时自动生成
    if not data.get("code"):
        data["code"] = f"perm_{uuid.uuid4().hex[:8]}"
    if not data.get("action"):
        data["action"] = "ALL:/api/admin/*"

    result = await db.execute(select(Permission).where(Permission.code == data["code"]))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="权限编码已存在")

    perm = Permission(**data)
    db.add(perm)
    await db.commit()
    await db.refresh(perm)
    return perm


@router.delete("/permissions/{perm_id}", status_code=204)
async def delete_permission(
    perm_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("permission:delete")),
):
    """删除权限"""
    result = await db.execute(select(Permission).where(Permission.id == perm_id))
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(status_code=404, detail="权限不存在")
    await db.delete(perm)
    await db.commit()


# ════════════════════════════════════════
# 角色-权限 关联
# ════════════════════════════════════════

@router.post("/roles/permissions")
async def assign_role_permissions(
    req: RolePermissionAssign,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("role:update")),
):
    """分配角色权限"""
    result = await db.execute(select(Role).where(Role.id == req.role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    result = await db.execute(
        select(Permission).where(Permission.id.in_(req.permission_ids))
    )
    permissions = result.scalars().all()

    # 清空原有权限并重新分配
    await db.execute(
        delete(role_permissions).where(role_permissions.c.role_id == req.role_id)
    )
    role.permissions = permissions
    await db.commit()

    return {"message": "权限分配成功"}


# ════════════════════════════════════════
# 用户管理
# ════════════════════════════════════════

@router.get("/users", response_model=List[UserListItem])
async def list_users(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("user:read")),
    search: str = "",
    page: int = 1,
    page_size: int = 20,
):
    """获取用户列表"""
    query = select(User).options(selectinload(User.roles))
    if search:
        query = query.where(User.username.like(f"%{search}%"))
    query = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    return [
        UserListItem(
            id=u.id,
            username=u.username,
            avatar=u.avatar,
            status=u.status,
            banned_until=u.banned_until,
            created_at=u.created_at,
            roles=[RoleOut.model_validate(r) for r in u.roles],
        )
        for u in users
    ]


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    req: UserStatusUpdate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("user:update")),
):
    """更新用户状态（启用/禁用）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.status = req.status
    await db.commit()
    return {"message": "状态更新成功"}


@router.put("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("user:update")),
):
    """封禁用户：自定义封禁时长（小时），封禁期内无法修改信息及进行身份验证操作；duration_hours=0 解封"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    try:
        duration_hours = int(body.get("duration_hours") or 0)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="duration_hours 必须是整数（小时）")

    if duration_hours < 0:
        raise HTTPException(status_code=400, detail="封禁时长不能为负数")

    from datetime import datetime, timedelta
    if duration_hours == 0:
        user.banned_until = None
        await db.commit()
        return {"message": "已解除封禁", "banned_until": None}

    banned_until = datetime.now() + timedelta(hours=duration_hours)
    user.banned_until = banned_until
    await db.commit()
    return {
        "message": f"已封禁至 {banned_until.strftime('%Y-%m-%d %H:%M')}",
        "banned_until": banned_until,
    }


# ════════════════════════════════════════
# 用户-角色 关联
# ════════════════════════════════════════

@router.post("/users/roles")
async def assign_user_roles(
    req: UserRoleAssign,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_permissions("user:update")),
):
    """分配用户角色"""
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    result = await db.execute(
        select(Role).where(Role.id.in_(req.role_ids))
    )
    roles = result.scalars().all()

    await db.execute(
        delete(user_roles).where(user_roles.c.user_id == req.user_id)
    )
    user.roles = roles
    await db.commit()

    return {"message": "角色分配成功"}
