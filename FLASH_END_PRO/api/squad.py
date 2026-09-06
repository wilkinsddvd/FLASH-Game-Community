"""
Squad 编制管理 API
- 公开：前端 Squad 页面读取“数据库覆盖版本”（enabled=1 时生效）
- 超管：读取/保存覆盖数据（阵营信息、载具图片/信息/票数/数量/复活时间）
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_super_admin
from db.db import get_async_db
from model.squad import SquadConfig

router = APIRouter(tags=["Squad编制"])

ROW_ID = 1


def _parse(row: SquadConfig | None) -> dict:
    """数据库行 -> 对外结构"""
    factions = None
    if row and row.data:
        try:
            parsed = json.loads(row.data)
            if isinstance(parsed, list) and parsed:
                factions = parsed
        except Exception:
            factions = None
    return {
        "enabled": bool(row and row.enabled == 1 and factions),
        "updated_at": row.updated_at.isoformat() if row and row.updated_at else None,
        "factions": factions,
        "total_factions": len(factions) if factions else 0,
    }


async def _get_row(db: AsyncSession) -> SquadConfig:
    result = await db.execute(select(SquadConfig).where(SquadConfig.id == ROW_ID))
    row = result.scalar_one_or_none()
    if row is None:
        row = SquadConfig(id=ROW_ID, enabled=0, data=None)
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


# ═══════════ 公开读取（前端 Squad 页面用） ═══════════

@router.get("/api/squad/public")
async def get_public_squad(db: AsyncSession = Depends(get_async_db)):
    """前端读取覆盖数据；未启用/无数据时返回 factions=null（前端回退静态）"""
    row = await _get_row(db)
    return _parse(row)


# ═══════════ 超管管理 ═══════════

@router.get("/api/admin/super/squad")
async def get_admin_squad(
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """超管读取当前覆盖配置"""
    row = await _get_row(db)
    info = _parse(row)
    info["enabled_flag"] = bool(row.enabled == 1)
    return info


@router.put("/api/admin/super/squad")
async def save_admin_squad(
    body: dict,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """
    超管保存覆盖配置
    body: { "enabled": bool, "factions": [ ...与 factions.js FACTIONS 结构一致... ] }
    """
    factions = body.get("factions")
    enabled = bool(body.get("enabled", False))
    if factions is None:
        raise HTTPException(status_code=400, detail="缺少 factions 数据")
    if not isinstance(factions, list):
        raise HTTPException(status_code=400, detail="factions 必须是数组")
    if enabled and not factions:
        raise HTTPException(status_code=400, detail="启用覆盖数据时 factions 不能为空")

    row = await _get_row(db)
    row.data = json.dumps(factions, ensure_ascii=False)
    row.enabled = 1 if enabled else 0
    await db.commit()
    await db.refresh(row)
    return {**{"message": "Squad 编制数据已保存"}, **_parse(row), "enabled_flag": bool(row.enabled == 1)}
