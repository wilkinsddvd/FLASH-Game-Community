/**
 * 载具武器/弹药数据（P2 由 Squad Wiki 数据生成）
 * 现阶段为空，页面显示“武器/弹药数据补充中”。
 */
export const VEHICLE_SPECS = {}

export function getVehicleSpec(name) {
  return VEHICLE_SPECS[String(name || '').trim()] || null
}
