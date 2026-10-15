/**
 * Squad 编制远程数据层
 * - 后端超管若启用了“数据库覆盖”，则各 Squad 页面优先使用覆盖数据
 * - 未启用 / 请求失败时回退到静态 factions.js
 * - 每次页面进入实时拉取，保证超管后台发布后立即可见
 */
import { FACTIONS, VEHICLE_CATEGORIES } from './factions'
import { getSquadPublic } from '../../api'

/**
 * 静态底稿兜底：后端覆盖数据里**缺失**（不是空数组）的新字段，用静态底稿补上。
 * 只补 traits / deployables，其余字段一律以后台为准。
 * 这样新字段上线后不会出现「后台还没发布 → 全站都显示无特色」的空窗期。
 */
function fillMissingFields(factions) {
  const st = new Map()
  FACTIONS.forEach((f) => (f.rosters || []).forEach((r) => st.set(f.code + '|' + r.key, r)))
  factions.forEach((f) => (f.rosters || []).forEach((r) => {
    const s = st.get(f.code + '|' + r.key)
    if (!s) return
    if (!Array.isArray(r.traits) && Array.isArray(s.traits)) r.traits = s.traits
    if (!Array.isArray(r.deployables) && Array.isArray(s.deployables)) r.deployables = s.deployables
  }))
  return factions
}

/** 拉取后端覆盖配置：{ factions, vehicleCategories } 或 null（回退静态） */
export async function loadSquadConfig() {
  try {
    const res = await getSquadPublic()
    if (res && res.enabled && Array.isArray(res.factions) && res.factions.length) {
      return {
        factions: fillMissingFields(res.factions),
        vehicleCategories: (res.vehicle_categories && Object.keys(res.vehicle_categories).length)
          ? res.vehicle_categories
          : null,
      }
    }
    return null
  } catch (e) {
    console.warn('Squad 远程数据加载失败，使用静态数据:', e)
    return null
  }
}

/** 仅需阵营数据时的便捷方法（首页 / 列表页） */
export async function loadSquadFactions() {
  const cfg = await loadSquadConfig()
  return cfg ? cfg.factions : null
}

/** 静态底稿（兜底） */
export function getDefaultSquadFactions() {
  return FACTIONS
}

/** 静态载具分类（兜底） */
export function getDefaultVehicleCategories() {
  return VEHICLE_CATEGORIES
}
