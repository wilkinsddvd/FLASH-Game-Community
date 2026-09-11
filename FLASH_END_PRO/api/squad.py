"""
Squad 编制管理 API
- 公开：前端 Squad 页面读取“数据库覆盖版本”（enabled=1 时生效）
- 超管：读取/保存覆盖数据
    · 阵营信息（名称/旗帜/主题色/阵营简介）
    · 载具（图片/信息/分类/票数/数量/复活时间）
    · 编制特性（tactics：定位/优势/劣势）
    · 指挥官技能（commander_abilities）
    · 载具分类元数据（vehicle_categories：筛选用的分类名/图标）
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


def _load_payload(row: SquadConfig | None) -> tuple[list | None, dict | None]:
    """数据库行 -> (factions, vehicle_categories)；兼容仅存 factions 数组的旧格式"""
    if not row or not row.data:
        return None, None
    try:
        parsed = json.loads(row.data)
    except Exception:
        return None, None
    if isinstance(parsed, list):
        return (parsed if parsed else None), None
    if isinstance(parsed, dict):
        factions = parsed.get("factions")
        categories = parsed.get("vehicle_categories")
        if not isinstance(factions, list) or not factions:
            factions = None
        if not isinstance(categories, dict) or not categories:
            categories = None
        return factions, categories
    return None, None


def _parse(row: SquadConfig | None) -> dict:
    """数据库行 -> 对外结构"""
    factions, categories = _load_payload(row)
    return {
        "enabled": bool(row and row.enabled == 1 and factions),
        "updated_at": row.updated_at.isoformat() if row and row.updated_at else None,
        "factions": factions,
        "vehicle_categories": categories,
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
    body: {
      "enabled": bool,
      "factions": [ ...与 factions.js FACTIONS 结构一致... ],
      "vehicle_categories": { "tank": {"label": "坦克", "icon": "🛡️"}, ... }  # 可选
    }
    """
    factions = body.get("factions")
    categories = body.get("vehicle_categories")
    enabled = bool(body.get("enabled", False))
    if factions is None:
        raise HTTPException(status_code=400, detail="缺少 factions 数据")
    if not isinstance(factions, list):
        raise HTTPException(status_code=400, detail="factions 必须是数组")
    if categories is not None and not isinstance(categories, dict):
        raise HTTPException(status_code=400, detail="vehicle_categories 必须是对象")
    if enabled and not factions:
        raise HTTPException(status_code=400, detail="启用覆盖数据时 factions 不能为空")

    payload = {"factions": factions}
    if categories:
        payload["vehicle_categories"] = categories

    row = await _get_row(db)
    row.data = json.dumps(payload, ensure_ascii=False)
    row.enabled = 1 if enabled else 0
    await db.commit()
    await db.refresh(row)
    return {**{"message": "Squad 编制数据已保存"}, **_parse(row), "enabled_flag": bool(row.enabled == 1)}
