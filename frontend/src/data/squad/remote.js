/**
 * Squad 编制远程数据层
 * - 后端超管若启用了“数据库覆盖”，则各 Squad 页面优先使用覆盖数据
 * - 未启用 / 请求失败时回退到静态 factions.js
 * - 每次页面进入实时拉取，保证超管后台发布后立即可见
 */
import { FACTIONS, VEHICLE_CATEGORIES } from './factions'
import { getSquadPublic } from '../../api'

/** 拉取后端覆盖配置：{ factions, vehicleCategories } 或 null（回退静态） */
export async function loadSquadConfig() {
  try {
    const res = await getSquadPublic()
    if (res && res.enabled && Array.isArray(res.factions) && res.factions.length) {
      return {
        factions: res.factions,
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
