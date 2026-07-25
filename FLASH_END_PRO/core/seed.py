"""
数据库初始种子数据

创建默认角色和权限，在应用首次启动时运行。
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import async_session
from model.role import Role, Permission, role_permissions


# 默认权限定义
DEFAULT_PERMISSIONS = [
    # 用户管理
    {"name": "读取用户", "code": "user:read", "action": "GET:/api/admin/users"},
    {"name": "创建用户", "code": "user:create", "action": "POST:/api/admin/users"},
    {"name": "更新用户", "code": "user:update", "action": "PUT:/api/admin/users/*"},
    {"name": "删除用户", "code": "user:delete", "action": "DELETE:/api/admin/users/*"},
    # 角色管理
    {"name": "读取角色", "code": "role:read", "action": "GET:/api/admin/roles"},
    {"name": "创建角色", "code": "role:create", "action": "POST:/api/admin/roles"},
    {"name": "更新角色", "code": "role:update", "action": "PUT:/api/admin/roles/*"},
    {"name": "删除角色", "code": "role:delete", "action": "DELETE:/api/admin/roles/*"},
    # 权限管理
    {"name": "读取权限", "code": "permission:read", "action": "GET:/api/admin/permissions"},
    {"name": "创建权限", "code": "permission:create", "action": "POST:/api/admin/permissions"},
    {"name": "删除权限", "code": "permission:delete", "action": "DELETE:/api/admin/permissions/*"},
    # 帖子管理
    {"name": "创建帖子", "code": "post:create", "action": "POST:/api/posts"},
    {"name": "读取帖子", "code": "post:read", "action": "GET:/api/posts/*"},
    {"name": "更新帖子", "code": "post:update", "action": "PUT:/api/posts/*"},
    {"name": "删除帖子", "code": "post:delete", "action": "DELETE:/api/posts/*"},
    {"name": "审核帖子", "code": "post:moderate", "action": "PATCH:/api/posts/*/status"},
    # 回复管理
    {"name": "创建回复", "code": "reply:create", "action": "POST:/api/posts/*/replies"},
    {"name": "删除回复", "code": "reply:delete", "action": "DELETE:/api/replies/*"},
    # 板块管理
    {"name": "读取板块", "code": "section:read", "action": "GET:/api/sections"},
    {"name": "管理板块", "code": "section:manage", "action": "POST|PUT|DELETE:/api/sections/*"},
    # CMS管理
    {"name": "读取CMS", "code": "cms:read", "action": "GET:/api/cms/*"},
    {"name": "管理CMS", "code": "cms:manage", "action": "POST|PUT|DELETE:/api/cms/*"},
]

# 默认角色定义
DEFAULT_ROLES = [
    {
        "name": "超级管理员",
        "code": "super_admin",
        "description": "系统级配置、用户管理、角色分配",
        "permissions": [p["code"] for p in DEFAULT_PERMISSIONS],  # 全部权限
    },
    {
        "name": "管理员",
        "code": "admin",
        "parent_code": "super_admin",
        "description": "内容管理，用户管理",
        "permissions": [
            "user:read", "user:update",
            "role:read",
            "permission:read",
            "post:read", "post:moderate",
            "reply:read",
            "section:read", "section:manage",
            "cms:read", "cms:manage",
        ],
    },
    {
        "name": "普通用户",
        "code": "user",
        "parent_code": "admin",
        "description": "发帖、回帖、编辑自己的内容、个人资料管理",
        "permissions": [
            "post:create", "post:read", "post:update",
            "reply:create",
            "section:read",
            "cms:read",
        ],
    },
    {
        "name": "游客",
        "code": "guest",
        "parent_code": "user",
        "description": "仅浏览，禁止发帖回帖",
        "permissions": [
            "post:read",
            "section:read",
            "cms:read",
        ],
    },
]


async def seed_database():
    """插入默认种子数据"""
    async with async_session() as db:
        # 检查是否已有数据
        result = await db.execute(select(Role).limit(1))
        if result.scalar_one_or_none():
            return  # 已有数据，跳过

        # 1. 创建权限
        perm_map = {}
        for p_data in DEFAULT_PERMISSIONS:
            perm = Permission(**p_data)
            db.add(perm)
            await db.flush()
            perm_map[perm.code] = perm

        # 2. 创建角色
        role_map = {}
        for r_data in DEFAULT_ROLES:
            role = Role(
                name=r_data["name"],
                code=r_data["code"],
                description=r_data["description"],
            )
            db.add(role)
            await db.flush()
            role_map[role.code] = role

        # 3. 设置角色继承
        for r_data in DEFAULT_ROLES:
            if r_data.get("parent_code"):
                role = role_map[r_data["code"]]
                parent = role_map[r_data["parent_code"]]
                role.parent_id = parent.id

        # 4. 分配权限
        for r_data in DEFAULT_ROLES:
            role = role_map[r_data["code"]]
            for perm_code in r_data["permissions"]:
                if perm_code in perm_map:
                    role.permissions.append(perm_map[perm_code])

        await db.commit()
        print(f"种子数据创建完成: {len(DEFAULT_ROLES)} 角色, {len(DEFAULT_PERMISSIONS)} 权限")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_database())
