/**
 * RAAS 求解器自检 —— 用真实数据验证 lane 解析、双向（出生点定方向）与剪枝逻辑
 * 运行：node scripts/test-raas-solver.mjs
 */
import { RAAS_LAYERS, RAAS_MAPS } from '../frontend/src/data/squad/raas-data.js'
import {
  buildRoutes, solveRoutes, pointIndex,
  spawnIds, laneCount, nextIds, routeDepths,
} from '../frontend/src/utils/raas.js'

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
    if (!s0.base) bad(`${name}: 路线 ${r.lane}/${r.dir} 第 0 步不是出生点`)
    if (s0.ids.length !== 1) bad(`${name}: 路线 ${r.lane}/${r.dir} 出生点候选不是 1 个`)
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

  summary.push({ name, routes: rd.routes.length, lanes: laneCount(rd.routes), steps: rd.stepCount, points: totalPoints, alive: s1.alive })
}

/* ── 双向结构：同一条 lane 生成 正/反 两条，反向 = 正向严格倒序 ── */
console.log('\n=== 双向结构自检（出生点决定方向）===')
let biLayers = 0
for (const [name, layer] of Object.entries(RAAS_LAYERS)) {
  const { routes } = buildRoutes(layer, { bidirectional: true })
  const ids = [...spawnIds(routes)]
  const lanes = [...new Set(routes.map((r) => r.lane))]
  if (ids.length !== 2) bad(`${name}: 出生点候选不是 2 个（${ids.join(',')}）`)
  if (laneCount(routes) !== lanes.length) bad(`${name}: lane 去重异常`)

  const per = new Map()
  routes.forEach((r) => per.set(r.lane, (per.get(r.lane) || 0) + 1))
  for (const [ln, n] of per) if (n !== 2) bad(`${name}: lane ${ln} 方向数 ${n} != 2`)

  for (const ln of lanes) {
    const f = routes.find((r) => r.lane === ln && r.dir === 'fwd')
    const b = routes.find((r) => r.lane === ln && r.dir === 'rev')
    if (!f || !b) { bad(`${name}: lane ${ln} 缺正向或反向`); continue }
    const fc = f.steps.slice(1).map((s) => s.cluster)
    const bc = b.steps.slice(1).map((s) => s.cluster)
    if ([...fc].reverse().join('>') !== bc.join('>')) bad(`${name}: lane ${ln} 反向不是正向严格倒序`)
    if (b.steps[0].ids[0] === f.steps[0].ids[0]) bad(`${name}: lane ${ln} 正反向起点相同`)
    // 两个方向的候选点集合必须一致（只是顺序反）
    if (new Set(fc).size !== new Set(bc).size) bad(`${name}: lane ${ln} 反向候选集不同`)
  }

  // 选出生点 = 只保留「从它出发」的方向：存活路线数应 == lane 数
  const [A, B] = ids
  const sA = solveRoutes(routes, [{ ids: [A] }])
  const sB = solveRoutes(routes, [{ ids: [B] }])
  if (sA.alive !== lanes.length) bad(`${name}: 选出生点 A 后存活 ${sA.alive} != lane 数 ${lanes.length}`)
  if (sB.alive !== lanes.length) bad(`${name}: 选出生点 B 后存活 ${sB.alive} != lane 数 ${lanes.length}`)
  if (routes.length !== lanes.length * 2) bad(`${name}: 路线总数 != lane 数 × 2`)

  // 从 B 出发的第 1 点，必须落在「从 A 出发」那条路线的最后一步（即倒序的落点）
  const nA = new Set(nextIds(sA.survivors, routeDepths(sA.survivors, [A])))
  const nB = new Set(nextIds(sB.survivors, routeDepths(sB.survivors, [B])))
  const lastOfA = new Set()
  sA.survivors.forEach(({ route }) => {
    const st = route.steps[route.steps.length - 1]
    if (st) st.ids.forEach((i) => lastOfA.add(i))
  })
  for (const id of nB) if (!lastOfA.has(id)) bad(`${name}: 从 B 出发的第 1 点 ${id} 不在 A 方向的末格`)
  if ([...nA].every((id) => nB.has(id)) && nA.size === nB.size) bad(`${name}: 正反向第 1 点竟然相同`)

  // 倒序也要按序点：从 B 出发一路点到底，必须每步都有候选，且走完的步数落在各 lane 步数区间内
  const stepsAll = sB.survivors.map((s) => s.route.steps.length)
  const minStepsB = Math.min(...stepsAll)
  const maxStepsB = Math.max(...stepsAll)
  let conf = [B]
  let ok = true
  for (let i = 1; i < maxStepsB; i++) {
    const s = solveRoutes(routes, conf.map((id) => ({ ids: [id] })))
    if (s.impossible) { bad(`${name}: 倒序第 ${i} 点前就无路可走`); ok = false; break }
    const nxt = [...nextIds(s.survivors, routeDepths(s.survivors, conf))]
    if (!nxt.length) break
    conf.push(nxt[0])
  }
  if (ok && (conf.length < minStepsB || conf.length > maxStepsB)) {
    bad(`${name}: 倒序走完 ${conf.length} 步，超出 lane 步数区间 [${minStepsB},${maxStepsB}]`)
  }

  biLayers++
}
console.log(`  ${biLayers} 个图层：正/反双向、反向严格倒序、选出生点后仅剩一个方向、倒序可一路按序点完`)

console.log('\n图层                    路线  lane  步数  候选点  选出生点后存活')
for (const s of summary) {
  console.log(`${s.name.padEnd(24)} ${String(s.routes).padStart(3)}  ${String(s.lanes).padStart(3)}  ${String(s.steps).padStart(3)}  ${String(s.points).padStart(5)}  ${String(s.alive).padStart(6)}`)
}

// 抽样展示一个图层的双向结构
const demo = 'Mutaha_RAAS_v1'
const rd = buildRoutes(RAAS_LAYERS[demo])
const spawns = [...spawnIds(rd.routes)]
console.log(`\n=== ${demo} 双向结构（出生点：${spawns.join(' / ')}）===`)
for (const r of rd.routes) {
  console.log(` ${r.lane}(${r.dir}): ` + r.steps.map((s, i) => `${i}.${s.base ? '出生点' : s.cluster.replace(/-BP_CaptureZoneCluster$/, '')}(${s.ids.length})`).join(' → '))
}

console.log(fail ? `\n❌ 自检失败 ${fail} 项` : '\n✅ 全部自检通过')
process.exit(fail ? 1 : 0)
