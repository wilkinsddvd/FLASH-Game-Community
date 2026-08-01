from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── 角色 ───

class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)
    code: str = Field(..., min_length=1, max_length=32, pattern=r"^[a-z_]+$")
    parent_id: Optional[int] = None
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=32)
    description: Optional[str] = None


class RoleOut(BaseModel):
    id: int
    name: str
    code: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 权限 ───

class PermissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    code: Optional[str] = Field(None, max_length=64, pattern=r"^[a-z_:]+$", description="留空自动生成")
    action: Optional[str] = Field(None, max_length=128, description="留空自动生成")
    description: Optional[str] = None


class PermissionOut(BaseModel):
    id: int
    name: str
    code: str
    action: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 用户角色分配 ───

class UserRoleAssign(BaseModel):
    user_id: int
    role_ids: List[int]


class RolePermissionAssign(BaseModel):
    role_id: int
    permission_ids: List[int]


# ─── 用户管理 ───

class UserListItem(BaseModel):
    id: int
    username: str
    avatar: Optional[str] = None
    status: int
    created_at: datetime
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    status: int = Field(..., ge=0, le=1)
