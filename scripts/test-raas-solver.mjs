/**
 * RAAS 求解器自检 —— 用真实数据验证 lane 解析与剪枝逻辑
 * 运行：node scripts/test-raas-solver.mjs
 */
import { RAAS_LAYERS, RAAS_MAPS } from '../frontend/src/data/squad/raas-data.js'
import { buildRoutes, solveRoutes, pointIndex } from '../frontend/src/utils/raas.js'

let fail = 0
const bad = (msg) => { console.log('  ❌ ' + msg); fail++ }

console.log(`地图 ${RAAS_MAPS.length} 张 / 图层 ${Object.keys(RAAS_LAYERS).length} 个\n`)

const summary = []
for (const [name, layer] of Object.entries(RAAS_LAYERS)) {
  const rd = buildRoutes(layer)
  const pts = pointIndex(layer)
  const totalPoints = pts.size

  if (!rd.routes.length) { bad(`${name}: 解析出 0 条路线`); continue }
  if (rd.truncated) console.log(`  ⚠️  ${name}: 路线枚举被截断`)

  // 每条路线的 cluster 不应重复
  for (const r of rd.routes) {
    const cs = r.steps.map((s) => s.cluster)
    if (new Set(cs).size !== cs.length) bad(`${name}: 路线 ${r.lane} 有重复 cluster`)
  }

  // 无约束求解：概率权重按存活路线均分（1/S），故全部点位概率之和 == 各路线步数均值
  const s0 = solveRoutes(rd.routes, [])
  let sum = 0
  for (const v of s0.byId.values()) sum += v.probability
  const totalSteps = rd.routes.reduce((n, r) => n + r.steps.length, 0)
  const expect = totalSteps / rd.routes.length
  if (Math.abs(sum - expect) > 0.01) bad(`${name}: 概率和 ${sum.toFixed(3)} != 期望 ${expect.toFixed(3)}`)

  // 第 0 步必须是出生点（单 id）
  for (const r of rd.routes) {
    const s0 = r.steps[0]
    if (!s0.base) bad(`${name}: 路线 ${r.lane} 第 0 步不是出生点`)
    if (s0.ids.length !== 1) bad(`${name}: 路线 ${r.lane} 出生点候选不是 1 个`)
  }

  // 确认出生点 + 第一步的点后：仍应有路可走，且后一个锁定在第 1 步（1 基 = 2）
  const baseId = rd.routes[0].steps[0].ids[0]
  const firstFlagStep = rd.routes[0].steps.find((s) => !s.base)
  const firstFlag = firstFlagStep && firstFlagStep.ids[0]
  const s1 = solveRoutes(rd.routes, [{ ids: [baseId] }])
  if (s1.alive > rd.routes.length) bad(`${name}: 确认出生点后路线数变多了`)
  if (s1.alive < 1) bad(`${name}: 确认 ${baseId} 后无路可走`)
  const s2 = firstFlag ? solveRoutes(rd.routes, [{ ids: [baseId] }, { ids: [firstFlag] }]) : null
  if (s2 && s2.alive < 1) bad(`${name}: 确认出生点+第一步（${firstFlag}）后无路可走`)
  const e = s2 && s2.byId.get(firstFlag)
  if (e && !e.steps.has(2)) bad(`${name}: ${firstFlag} 锁定后不在第 1 步（1 基=2）`)

  summary.push({ name, routes: rd.routes.length, steps: rd.stepCount, points: totalPoints, alive: s1.alive })
}

console.log('\n图层                    路线  步数  候选点  确认1点后存活')
for (const s of summary) {
  console.log(`${s.name.padEnd(24)} ${String(s.routes).padStart(3)}  ${String(s.steps).padStart(3)}  ${String(s.points).padStart(5)}  ${String(s.alive).padStart(6)}`)
}

// 抽样展示一个图层的路线结构
const demo = 'Mutaha_RAAS_v1'
const rd = buildRoutes(RAAS_LAYERS[demo])
console.log(`\n=== ${demo} 路线结构 ===`)
for (const r of rd.routes) {
  console.log(` ${r.lane}: ` + r.steps.map((s, i) => `${i}.${s.base ? '出生点' : s.cluster.replace(/-BP_CaptureZoneCluster$/, '')}(${s.ids.length})`).join(' → '))
}

console.log(fail ? `\n❌ 自检失败 ${fail} 项` : '\n✅ 全部自检通过')
process.exit(fail ? 1 : 0)
