"""
数据库初始种子数据
"""

from sqlalchemy import select, insert

from db.db import async_session
from model.role import Role, Permission, role_permissions
from model.admin_passphrase import AdminPassphrase
from model.badge import Badge
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

# 勋章定义
BADGES_DATA = [
    {"code": "quiz_90", "name": "战术精英", "icon": "🏅", "description": "基础认证答题达到 90 分以上", "sort_order": 1},
    # 每个认证分类的专属勋章
    {"code": "quiz_rifleman", "name": "步枪兵", "icon": "🔫", "description": "完成步枪兵基础认证（≥90分）", "sort_order": 10},
    {"code": "quiz_medic", "name": "战地天使", "icon": "⛑️", "description": "完成医疗兵基础认证（≥90分）", "sort_order": 11},
    {"code": "quiz_autorifleman", "name": "班用机枪手", "icon": "🔥", "description": "完成班用机枪手基础认证（≥90分）", "sort_order": 12},
    {"code": "quiz_machinegunner", "name": "火力压制者", "icon": "💥", "description": "完成通用机枪手基础认证（≥90分）", "sort_order": 13},
    {"code": "quiz_grenadier", "name": "榴弹射手", "icon": "💣", "description": "完成榴弹射手基础认证（≥90分）", "sort_order": 14},
    {"code": "quiz_marksman", "name": "神枪手", "icon": "🎯", "description": "完成特种射手基础认证（≥90分）", "sort_order": 15},
    {"code": "quiz_lat", "name": "破甲先锋", "icon": "🚀", "description": "完成轻型反坦克手基础认证（≥90分）", "sort_order": 16},
    {"code": "quiz_hat", "name": "装甲克星", "icon": "🛡️", "description": "完成重型反坦克手基础认证（≥90分）", "sort_order": 17},
    {"code": "quiz_crewman", "name": "钢铁驾驭者", "icon": "🛞", "description": "完成载具组员基础认证（≥90分）", "sort_order": 18},
    {"code": "quiz_pilot", "name": "蓝天雄鹰", "icon": "🚁", "description": "完成飞行员基础认证（≥90分）", "sort_order": 19},
    {"code": "quiz_squadleader", "name": "小队之魂", "icon": "📡", "description": "完成小队领导基础认证（≥90分）", "sort_order": 20},
    {"code": "quiz_commander", "name": "战地指挥官", "icon": "🎖️", "description": "完成指挥官基础认证（≥90分）", "sort_order": 21},
]

# 认证分类 → 勋章代码映射
QUIZ_BADGE_MAP = {b["code"]: b for b in BADGES_DATA if b["code"].startswith("quiz_") and b["code"] != "quiz_90"}

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
DEFAULT_SUPER_ADMIN_PASSPHRASE = "天空那道闪电"  # 超级管理员口令（仅超管可修改/增加/删除/查看）


async def seed_database():
    async with async_session() as db:
        # 0. 创建勋章定义（幂等，独立于角色种子）
        badge_result = await db.execute(select(Badge).limit(1))
        if not badge_result.scalar_one_or_none():
            for b_data in BADGES_DATA:
                db.add(Badge(**b_data))
            await db.commit()
            print(f"勋章定义创建完成: {len(BADGES_DATA)} 个")

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


async def seed_super_admin_passphrase():
    """初始化默认超级管理员口令（仅首次启动时写入）：天空那道闪电"""
    from model.super_admin_passphrase import SuperAdminPassphrase

    async with async_session() as db:
        result = await db.execute(
            select(SuperAdminPassphrase).limit(1)
        )
        if result.scalar_one_or_none():
            return  # 已存在，跳过

        record = SuperAdminPassphrase(
            passphrase_hash=hash_passphrase(DEFAULT_SUPER_ADMIN_PASSPHRASE),
            remark="主口令",
            is_builtin=True,  # 初始口令由代码写入，不可删除
        )
        db.add(record)
        await db.commit()
        print("初始超级管理员口令已设置")
