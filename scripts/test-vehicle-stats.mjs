/**
 * 载具聚合统计自检（数据侧，无浏览器）
 *
 * 用法：node scripts/test-vehicle-stats.mjs
 * 断言：条目数 == 逐编制累加 / 去重口径 / 类别字典齐全 / 汇总对账（总台数、阵营数）
 *       + 抽样人工可核（M1A1 / 橡皮艇 补给型 / 全阵营都有的类别）
 */
import { FACTIONS, VEHICLE_CATEGORIES } from '../frontend/src/data/squad/factions.js'
import { buildVehicleStats } from '../frontend/src/data/squad/vehicle-stats.js'

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

// 手工口径（直接遍历静态数据）
let rawEntries = 0, rawUnits = 0, rawRosters = 0
const rawNames = new Set()
const rawByFaction = new Map()
for (const f of FACTIONS) {
  let fe = 0
  for (const r of f.rosters || []) {
    rawRosters++
    for (const v of r.vehicles || []) {
      rawEntries++; fe++
      rawUnits += v.count || 0
      rawNames.add(String(v.name).trim())
    }
  }
  rawByFaction.set(f.code, fe)
}

const st = buildVehicleStats(FACTIONS, VEHICLE_CATEGORIES)
const t = st.totals

console.log('\n── 总览 ──')
console.log(`阵营 ${t.factions} · 编制 ${t.rosters} · 载具条目 ${t.entries} · 去重名称 ${t.uniqueVehicles} · 总台数 ${t.totalUnits}`)
console.log('类别：', st.categories.map((c) => `${c.icon}${c.label} ${c.unique}型/${c.entries}条/${c.totalUnits}台`).join(' | '))

console.log('\n── 断言 ──')
check(t.factions === FACTIONS.length, '阵营数与数据一致', `${t.factions}/${FACTIONS.length}`)
check(t.rosters === rawRosters, '编制数与数据一致', `${t.rosters}/${rawRosters}`)
check(t.entries === rawEntries, '载具条目数与逐编制累加一致', `${t.entries}/${rawEntries}`)
check(t.uniqueVehicles === rawNames.size, '去重口径（名称原样）一致', `${t.uniqueVehicles}/${rawNames.size}`)
check(t.totalUnits === rawUnits, '总台数对账一致', `${t.totalUnits}/${rawUnits}`)

const sumEntry = st.byVehicle.reduce((s, v) => s + v.entryCount, 0)
check(sumEntry === rawEntries, 'byVehicle 条目累加 = 总条目', `${sumEntry}/${rawEntries}`)
const sumUnits = st.byVehicle.reduce((s, v) => s + v.totalUnits, 0)
check(sumUnits === rawUnits, 'byVehicle 台数累加 = 总台数', `${sumUnits}/${rawUnits}`)

// 阵营视角对账
let facEntries = 0, facUnits = 0, facRoster = 0
for (const f of st.byFaction) {
  facEntries += f.entryCount; facUnits += f.totalUnits; facRoster += f.rosterCount
  const catUnits = f.categories.reduce((s, c) => s + c.units, 0)
  if (catUnits !== f.totalUnits) check(false, `${f.code} 类别台数与阵营总台数不符`, `${catUnits}/${f.totalUnits}`)
  const catUnique = f.categories.reduce((s, c) => s + c.items.length, 0)
  if (catUnique !== f.uniqueCount) check(false, `${f.code} 类别型号数与阵营型号数不符`, `${catUnique}/${f.uniqueCount}`)
}
check(facEntries === rawEntries, '阵营维度条目累加 = 总条目', `${facEntries}/${rawEntries}`)
check(facUnits === rawUnits, '阵营维度台数累加 = 总台数', `${facUnits}/${rawUnits}`)
check(facRoster === rawRosters, '阵营维度编制累加 = 总编制', `${facRoster}/${rawRosters}`)

// 类别字典：数据里出现的每个 category 都能在字典里查到 label/icon（页面才不会显示 🚗 兜底）
const unknown = [...new Set(st.byVehicle.map((v) => v.category))].filter((c) => !VEHICLE_CATEGORIES[c] || c === 'all')
check(unknown.length === 0, '所有 category 都在 VEHICLE_CATEGORIES 里', unknown.join(',') || '—')

// 字段完整性：票数/数量不该缺；复活时间允许缺（数据里本来就有 335 条没有）
const noTickets = st.byVehicle.filter((v) => v.tickets === null)
const noCount = st.byVehicle.filter((v) => v.count === null)
const noRespawn = st.byVehicle.filter((v) => v.respawn_time === null)
check(noTickets.length === 0, '每型载具都有票数', `缺 ${noTickets.length}`)
check(noCount.length === 0, '每型载具都有数量', `缺 ${noCount.length}`)
console.log(`  ℹ️ 复活时间缺失（按「—」展示）：${noRespawn.length} 型 / ${st.byVehicle.filter((v) => v.respawnVariants.length === 0).length} 型完全无值`)
console.log(`  ℹ️ 票数/复活/数量在同名载具间不一致：${t.mixedVehicles} 型（页面标「不一致」）`)

// 抽样（人工可核）
const pick = (n) => st.byVehicle.find((v) => v.name === n)
console.log('\n── 抽样 ──')
for (const n of ['M1A1', '橡皮艇 补给型', 'UH-60M', '四轮摩托车']) {
  const v = pick(n)
  if (!v) { check(false, `抽样：找不到「${n}」`); continue }
  console.log(`  ${v.catIcon}${v.name} | 类别 ${v.catLabel} | 票数 ${v.tickets}${v.ticketsMixed ? '(不一致 ' + v.ticketsVariants.join('/') + ')' : ''} | 复活 ${v.respawn_time ?? '—'} | 数量 ${v.count}${v.countMixed ? '(不一致 ' + v.countVariants.join('/') + ')' : ''} | 出现 ${v.factionCount} 阵营 / ${v.rosterCount} 编制 / 共 ${v.totalUnits} 台`)
}
const dinghy = pick('橡皮艇 补给型')
check(!!dinghy && dinghy.rosterCount === rawRosters, '「橡皮艇 补给型」出现在全部编制里', dinghy ? `${dinghy.rosterCount}/${rawRosters}` : '缺失')

console.log(`\n${failed === 0 ? '✅ 全部通过' : '❌ 失败 ' + failed + ' 项'}`)
process.exit(failed === 0 ? 0 : 1)
