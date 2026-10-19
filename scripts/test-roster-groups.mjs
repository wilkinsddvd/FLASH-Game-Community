/**
 * 编制页「15 类载具分组」数据自检
 *
 * 用法：node scripts/test-roster-groups.mjs
 * 断言：
 *  - 每个编制的分组载具数之和 == 原始载具条目数
 *  - 分组内票数/数量与原始条目逐条一致
 *  - 15 类分类覆盖情况统计（未分类数量）
 */
import { FACTIONS } from '../frontend/src/data/squad/factions.js'
import { classifyVehicle, VEHICLE_CLASS_ORDER } from '../frontend/src/data/squad/vehicle-class.js'

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

let rosters = 0
let vehicles = 0
let unclassified = 0
const classCount = new Map()

for (const f of FACTIONS) {
  for (const r of f.rosters || []) {
    rosters++
    const groups = new Map()
    for (const v of r.vehicles || []) {
      vehicles++
      const cls = classifyVehicle(v.name, f.code, v.type, v.category) || '__none__'
      classCount.set(cls, (classCount.get(cls) || 0) + 1)
      if (cls === '__none__') unclassified++
      if (!groups.has(cls)) groups.set(cls, [])
      groups.get(cls).push(v)
    }
    const groupedCount = [...groups.values()].reduce((s, arr) => s + arr.length, 0)
    if (groupedCount !== (r.vehicles || []).length) {
      check(false, `${f.code}/${r.key} 分组数量对账`, `${groupedCount} != ${r.vehicles.length}`)
    }
    // 每条原始数据必须能在分组里原样找到（name/count/tickets）
    const flat = [...groups.values()].flat()
    const same = (r.vehicles || []).every((v) =>
      flat.some((x) => x.name === v.name && x.count === v.count && x.tickets === v.tickets)
    )
    if (!same) check(false, `${f.code}/${r.key} 分组条目原值保留`)
  }
}

check(rosters === 80, '编制数 = 80', String(rosters))
check(vehicles > 0, '载具条目已遍历', String(vehicles))
check([...classCount.keys()].every((k) => k === '__none__' || VEHICLE_CLASS_ORDER.includes(k)), '所有分类都在 15 类词表内')
console.log(`\n分类分布（共 ${vehicles} 条）：`)
for (const cls of [...VEHICLE_CLASS_ORDER, '__none__']) {
  const n = classCount.get(cls) || 0
  if (n) console.log(`  ${cls === '__none__' ? '未分类' : cls}: ${n}`)
}
console.log(`\n未分类 ${unclassified} 条`)

console.log(failed ? `\n❌ ${failed} 项失败` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
