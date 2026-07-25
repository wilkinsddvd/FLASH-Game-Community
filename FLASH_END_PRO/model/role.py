from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from db.db import Base


# 用户-角色 关联表
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    comment="用户角色关联表"
)

# 角色-权限 关联表
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    comment="角色权限关联表"
)


class Role(Base):
    """角色表 - RBAC2 支持角色继承"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(32), nullable=False, comment="角色名称")
    code = Column(String(32), unique=True, nullable=False, index=True, comment="角色编码")
    parent_id = Column(Integer, ForeignKey("roles.id"), nullable=True, comment="父角色ID（角色继承）")
    description = Column(String(255), nullable=True, comment="角色描述")
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    # 关系
    parent = relationship("Role", remote_side=[id], backref="children")
    users = relationship("User", secondary=user_roles, backref="roles")
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")


class Permission(Base):
    """权限表"""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False, comment="权限名称")
    code = Column(String(64), unique=True, nullable=False, index=True, comment="权限编码")
    action = Column(String(128), nullable=False, comment="权限动作标识")
    description = Column(String(255), nullable=True, comment="权限描述")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
