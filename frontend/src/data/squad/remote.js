/**
 * Squad 编制远程数据层
 * - 后端超管若启用了“数据库覆盖”，则各 Squad 页面优先使用覆盖数据
 * - 未启用 / 请求失败时回退到静态 factions.js
 * - 每次页面进入实时拉取，保证超管后台发布后立即可见
 */
import { FACTIONS } from './factions'
import { getSquadPublic } from '../../api'

export function loadSquadFactions() {
  return (async () => {
    try {
      const res = await getSquadPublic()
      if (res && res.enabled && Array.isArray(res.factions) && res.factions.length) {
        return res.factions
      }
      return null
    } catch (e) {
      console.warn('Squad 远程数据加载失败，使用静态数据:', e)
      return null
    }
  })()
}

/** 静态底稿（兜底） */
export function getDefaultSquadFactions() {
  return FACTIONS
}
