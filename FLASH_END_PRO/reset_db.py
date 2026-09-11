"""
清空并重建数据库（为最后上云做准备）
----------------------------------------
- 删除全部表并以当前代码 schema 重建
- 重新写入种子数据：
    角色/权限/勋章
    基础认证题库（12 类 130 题）
    管理员口令「闪电的战术大队」（可用 3 次）
    超级管理员口令「天空那道闪电」（可用 3 次）

用法（在 FLASH_END_PRO 目录下执行）：
    python3 reset_db.py              # 默认仅允许操作本地库（DB_ENV=local）
    DB_ENV=cloud python3 reset_db.py --cloud-ack   # 明确确认后才允许清空云端库
"""
import asyncio
import importlib
import os
import pkgutil
import sys
from pathlib import Path

# 保证以后端目录为工作目录（.env 读取、相对导入）
os.chdir(Path(__file__).resolve().parent)


async def main():
    db_env = os.getenv("DB_ENV", "local").strip().lower()
    if db_env in ("cloud", "prod", "production", "remote") and "--cloud-ack" not in sys.argv:
        print("!! 检测到 DB_ENV=cloud：拒绝执行。如确认要清空云端库，请加 --cloud-ack 参数")
        sys.exit(1)

    import db.db as db_mod
    from db.db import Base, engine
    import model as model_pkg

    # 导入全部模型模块，确保 Base.metadata 完整（drop_all/create_all 才不会漏表）
    # 两轮导入：部分模型存在相互引用（如 model.tag 依赖 model.post），第二轮兜底
    remaining = [m.name for m in pkgutil.iter_modules(model_pkg.__path__)]
    for _round in range(2):
        pending = []
        for name in remaining:
            try:
                importlib.import_module(f"model.{name}")
            except Exception as exc:  # noqa: BLE001
                pending.append(name)
                if _round == 1:
                    print(f"[warn] 导入 model.{name} 失败: {exc}")
        remaining = pending
        if not remaining:
            break

    target = db_mod.DATABASE_URL.split("@")[-1]
    print("=" * 60)
    print("即将清空并重建数据库：")
    print("  模式:", db_env)
    print("  地址:", target)
    print("=" * 60)
    ans = input("确认无误请输入 YES 继续，否则取消：").strip()
    if ans != "YES":
        print("已取消，未做任何改动。")
        sys.exit(0)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("已删除全部旧表")
        await conn.run_sync(Base.metadata.create_all)
        print("已按当前代码 schema 重建全部表")

    from core.seed import (
        seed_database,
        seed_admin_passphrase,
        seed_super_admin_passphrase,
        seed_quiz_questions,
    )
    await seed_database()
    await seed_admin_passphrase()
    await seed_super_admin_passphrase()
    await seed_quiz_questions()

    # 校验口令状态
    from sqlalchemy import func, select
    from db.db import async_session
    from model.admin_passphrase import AdminPassphrase
    from model.super_admin_passphrase import SuperAdminPassphrase
    from model.quiz import QuizQuestion
    async with async_session() as s:
        admin_cnt = (await s.execute(select(func.count(AdminPassphrase.id)))).scalar()
        super_cnt = (await s.execute(select(func.count(SuperAdminPassphrase.id)))).scalar()
        admin_used = (await s.execute(select(func.sum(AdminPassphrase.use_count)))).scalar() or 0
        super_used = (await s.execute(select(func.sum(SuperAdminPassphrase.use_count)))).scalar() or 0
        quiz_cnt = (await s.execute(select(func.count(QuizQuestion.id)))).scalar() or 0
    print("-" * 60)
    print(f"管理员口令条数: {admin_cnt}（内置「闪电的战术大队」，已用 {admin_used}/3 次）")
    print(f"超管口令条数: {super_cnt}（内置「天空那道闪电」，已用 {super_used}/3 次）")
    print(f"基础认证题库: {quiz_cnt} 题（预期 130）")
    print("重建完成 ✅ 可正常启动后端（启动时会自动 seed 幂等补全）")


if __name__ == "__main__":
    asyncio.run(main())
