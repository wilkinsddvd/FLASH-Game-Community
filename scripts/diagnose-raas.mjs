/**
 * 诊断脚本：点位密度 + 「确认后是否还有后续点位」
 * 运行：node scripts/diagnose-raas.mjs
 */
import { RAAS_LAYERS } from '../frontend/src/data/squad/raas-data.js'
import { buildRoutes, solveRoutes, pointIndex, projectPoint } from '../frontend/src/utils/raas.js'

// ── 1) 点位密度：归一化最近邻距离（乘以展示尺寸即为屏幕像素） ──
console.log('=== 点位密度（屏幕上最短相邻距离，按 900px 显示估算）===')
const density = []
for (const [name, layer] of Object.entries(RAAS_LAYERS)) {
  const pts = [...pointIndex(layer).values()]
  const uv = pts.map((p) => { const { u, v } = projectPoint(layer, p.x, p.y); return { u, v, n: p.n } })
  let min = Infinity, pair = null
  for (let i = 0; i < uv.length; i++) {
    for (let j = i + 1; j < uv.length; j++) {
      const d = Math.hypot(uv[i].u - uv[j].u, uv[i].v - uv[j].v) * 900
      if (d < min) { min = d; pair = [uv[i].n, uv[j].n] }
    }
  }
  density.push({ name, n: pts.length, min, pair })
}
density.sort((a, b) => a.min - b.min)
for (const d of density.slice(0, 10)) {
  console.log(`  ${d.name.padEnd(24)} ${String(d.n).padStart(3)}点  最短 ${d.min.toFixed(1)}px  ${d.pair[0]} / ${d.pair[1]}`)
}

// ── 2) 确认某点后，后面还有没有点位 ──
console.log('\n=== 「确认后无后续点位」统计 ===')
let totalPts = 0, deadEnds = 0, ambiguous = 0
const deadList = []
for (const [name, layer] of Object.entries(RAAS_LAYERS)) {
  const rd = buildRoutes(layer)
  if (!rd.routes.length) continue
  const ids = [...new Set(rd.routes.flatMap((r) => r.steps.flatMap((s) => s.ids)))]
  for (const id of ids) {
    totalPts++
    const solved = solveRoutes(rd.routes, [{ ids: [id] }])
    if (solved.alive > 1) ambiguous++
    let maxDepth = 0
    solved.survivors.forEach(({ route }) => {
      let d = -1
      route.steps.forEach((s, i) => { if (s.ids.includes(id)) d = Math.max(d, i) })
      route.steps.forEach((s, i) => { if (i > d) maxDepth = Math.max(maxDepth, i) })
    })
    if (maxDepth === 0) { deadEnds++; deadList.push(`${name} → ${id}`) }
  }
}
console.log(`  点位总数 ${totalPts}`)
console.log(`  确认后「后面什么都没有」的点位（末步点）: ${deadEnds}  (${(deadEnds / totalPts * 100).toFixed(1)}%)`)
console.log(`  确认后仍有多条路线成立（不唯一）的点位: ${ambiguous}  (${(ambiguous / totalPts * 100).toFixed(1)}%)`)
console.log('  末步点样例:')
deadList.slice(0, 12).forEach((s) => console.log('    ' + s))

// ── 3) 单一路线图层（点谁都只能得到同一条线） ──
const single = Object.entries(RAAS_LAYERS).filter(([, l]) => buildRoutes(l).routes.length === 1).map(([n]) => n)
console.log(`\n=== 只有 1 条路线的图层（${single.length} 个）===`)
console.log('  ' + single.join(', '))
