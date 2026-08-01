"""
数据库初始种子数据
"""

from sqlalchemy import select, insert

from db.db import async_session
from model.role import Role, Permission, role_permissions
from model.admin_passphrase import AdminPassphrase
from core.admin_auth import hash_passphrase


PERMISSIONS_DATA = [
    {"name": "读取用户", "code": "user:read", "action": "GET:/api/admin/users"},
    {"name": "创建用户", "code": "user:create", "action": "POST:/api/admin/users"},
    {"name": "更新用户", "code": "user:update", "action": "PUT:/api/admin/users/*"},
    {"name": "删除用户", "code": "user:delete", "action": "DELETE:/api/admin/users/*"},
    {"name": "读取角色", "code": "role:read", "action": "GET:/api/admin/roles"},
    {"name": "创建角色", "code": "role:create", "action": "POST:/api/admin/roles"},
    {"name": "更新角色", "code": "role:update", "action": "PUT:/api/admin/roles/*"},
    {"name": "删除角色", "code": "role:delete", "action": "DELETE:/api/admin/roles/*"},
    {"name": "读取权限", "code": "permission:read", "action": "GET:/api/admin/permissions"},
    {"name": "创建权限", "code": "permission:create", "action": "POST:/api/admin/permissions"},
    {"name": "删除权限", "code": "permission:delete", "action": "DELETE:/api/admin/permissions/*"},
    {"name": "创建帖子", "code": "post:create", "action": "POST:/api/posts"},
    {"name": "读取帖子", "code": "post:read", "action": "GET:/api/posts/*"},
    {"name": "更新帖子", "code": "post:update", "action": "PUT:/api/posts/*"},
    {"name": "删除帖子", "code": "post:delete", "action": "DELETE:/api/posts/*"},
    {"name": "审核帖子", "code": "post:moderate", "action": "PATCH:/api/posts/*/status"},
    {"name": "创建回复", "code": "reply:create", "action": "POST:/api/posts/*/replies"},
    {"name": "删除回复", "code": "reply:delete", "action": "DELETE:/api/replies/*"},
    {"name": "读取板块", "code": "section:read", "action": "GET:/api/sections"},
    {"name": "管理板块", "code": "section:manage", "action": "POST|PUT|DELETE:/api/sections/*"},
    {"name": "读取CMS", "code": "cms:read", "action": "GET:/api/cms/*"},
    {"name": "管理CMS", "code": "cms:manage", "action": "POST|PUT|DELETE:/api/cms/*"},
]

ROLES_DATA = [
    {"name": "超级管理员", "code": "super_admin", "description": "系统级配置、用户管理、角色分配", "parent_code": None},
    {"name": "管理员", "code": "admin", "description": "内容管理，用户管理", "parent_code": "super_admin"},
    {"name": "普通用户", "code": "user", "description": "发帖、回帖、编辑自己的内容、个人资料管理", "parent_code": "admin"},
    {"name": "游客", "code": "guest", "description": "仅浏览，禁止发帖回帖", "parent_code": "user"},
]

# 角色对应的权限编码
ROLE_PERMS = {
    "super_admin": [p["code"] for p in PERMISSIONS_DATA],
    "admin": ["user:read", "user:update", "role:read", "permission:read",
              "post:read", "post:moderate",
              "section:read", "section:manage",
              "cms:read", "cms:manage"],
    "user": ["post:create", "post:read", "post:update",
             "reply:create", "section:read", "cms:read"],
    "guest": ["post:read", "section:read", "cms:read"],
}

DEFAULT_ADMIN_PASSPHRASE = "闪电的战术大队"


async def seed_database():
    async with async_session() as db:
        result = await db.execute(select(Role).limit(1))
        if result.scalar_one_or_none():
            return

        # 1. 创建权限
        perm_map = {}
        for p_data in PERMISSIONS_DATA:
            perm = Permission(**p_data)
            db.add(perm)
            await db.flush()
            perm_map[perm.code] = perm.id

        # 2. 创建角色（先创建，暂不设 parent_id）
        role_map = {}
        for r_data in ROLES_DATA:
            role = Role(
                name=r_data["name"],
                code=r_data["code"],
                description=r_data["description"],
            )
            db.add(role)
            await db.flush()
            role_map[role.code] = role.id

        # 3. 设置角色继承（用原生 SQL 更新 parent_id）
        for r_data in ROLES_DATA:
            if r_data["parent_code"]:
                child_id = role_map[r_data["code"]]
                parent_id = role_map[r_data["parent_code"]]
                await db.execute(
                    Role.__table__.update()
                    .where(Role.__table__.c.id == child_id)
                    .values(parent_id=parent_id)
                )

        # 4. 插入 role_permissions 关联
        for role_code, perm_codes in ROLE_PERMS.items():
            role_id = role_map[role_code]
            for perm_code in perm_codes:
                if perm_code in perm_map:
                    stmt = insert(role_permissions).values(
                        role_id=role_id,
                        permission_id=perm_map[perm_code],
                    )
                    await db.execute(stmt)

        await db.commit()
        print(f"种子数据创建完成: {len(ROLES_DATA)} 角色, {len(PERMISSIONS_DATA)} 权限")


async def seed_admin_passphrase():
    """初始化默认管理员口令（仅首次启动时写入）"""
    async with async_session() as db:
        result = await db.execute(
            select(AdminPassphrase).limit(1)
        )
        if result.scalar_one_or_none():
            return  # 已存在，跳过

        record = AdminPassphrase(
            passphrase_hash=hash_passphrase(DEFAULT_ADMIN_PASSPHRASE),
            use_count=0,
            is_builtin=True,  # 初始口令由代码写入，不可删除
        )
        db.add(record)
        await db.commit()
        print("初始管理员口令已设置")
