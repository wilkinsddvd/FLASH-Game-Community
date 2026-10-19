/**
 * 火控计算器自检
 *
 * 用法：node scripts/test-fire-control.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getWeapon } from '../frontend/src/data/squad/weapons.js'
import {
  solveFiringSolution, decodeHeightmap, sampleHeight, milFromDeg,
} from '../frontend/src/utils/fire-control.js'
import { gridToWorld, worldToGrid } from '../frontend/src/utils/squad-grid.js'
import { RAAS_LAYERS } from '../frontend/src/data/squad/raas-data.js'
import { HEIGHTMAPS } from '../frontend/src/data/squad/heightmaps-meta.js'
import { CONTOURS } from '../frontend/src/data/squad/contours-meta.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

console.log('弹道基准（标准迫击炮，h=0）')
const mortar = getWeapon('mortar')
const vectors = [
  [300, 1475, 22.3],
  [600, 1342, 21.8],
  [900, 1185, 20.7],
  [1200, 925, 17.7],
]
for (const [d, mil, tof] of vectors) {
  const r = solveFiringSolution({
    weapon: mortar, src: { x: 0, y: 0 }, target: { x: d * 100, y: 0 }, manualHeight: 0,
  })
  const gotMil = Math.round(milFromDeg(r.primary.deg))
  check(Math.abs(gotMil - mil) <= 1, `${d}m → ${mil} mil`, `got ${gotMil}`)
  check(Math.abs(r.primary.tof - tof) <= 0.2, `${d}m TOF ≈ ${tof}s`, `got ${r.primary.tof.toFixed(1)}`)
}

console.log('\n高差 / 边界')
{
  const r = solveFiringSolution({
    weapon: mortar, src: { x: 0, y: 0 }, target: { x: 60000, y: 0 }, manualHeight: 20,
  })
  check(Math.abs(Math.round(milFromDeg(r.primary.deg)) - 1340) <= 1, '600m 高差 +20m → 1340 mil', String(Math.round(milFromDeg(r.primary.deg))))
}
{
  const r = solveFiringSolution({
    weapon: mortar, src: { x: 0, y: 0 }, target: { x: 130000, y: 0 }, manualHeight: 0,
  })
  check(!r.inRange && /最大射程/.test(r.reason), '1300m 超程提示', r.reason)
}
{
  const r = solveFiringSolution({
    weapon: mortar, src: { x: 0, y: 0 }, target: { x: 3000, y: 0 }, manualHeight: 0,
  })
  check(r.belowMin, '30m 低于最小射距', r.reason)
}

console.log('\n网格坐标')
const layer = RAAS_LAYERS['Mutaha_RAAS_v1']
{
  const g = gridToWorld(layer, 'D4-6-3')
  check(!!g && g.label === 'D4-6-3', 'D4-6-3 解析', g && g.label)
  const back = worldToGrid(layer, g.x, g.y)
  check(back && back.label === 'D4-6-3', 'D4-6-3 往返一致', back && back.label)
  const d2 = gridToWorld(layer, 'D4-6')
  check(!!d2 && d2.label === 'D4-6', 'D4-6 解析')
  const d1 = gridToWorld(layer, 'D4')
  check(!!d1 && d1.label === 'D4', 'D4 解析')
  check(gridToWorld(layer, 'ZZ9-1-1') === null, '非法网格返回 null')
}
{
  const b = {
    minX: Math.min(layer.corners[0][0], layer.corners[1][0]),
    maxX: Math.max(layer.corners[0][0], layer.corners[1][0]),
    minY: Math.min(layer.corners[0][1], layer.corners[1][1]),
    maxY: Math.max(layer.corners[0][1], layer.corners[1][1]),
  }
  let bad = 0
  for (let i = 0; i < 500; i++) {
    const x = b.minX + Math.random() * (b.maxX - b.minX)
    const y = b.minY + Math.random() * (b.maxY - b.minY)
    const g = worldToGrid(layer, x, y)
    const p = gridToWorld(layer, g.label)
    if (!p || Math.abs(p.x - x) > 1700 || Math.abs(p.y - y) > 1700) bad++
  }
  check(bad === 0, '500 次随机往返误差 ≤ 1 个 sub 格', `bad=${bad}`)
}

console.log('\n高程 / 等高线资源')
{
  const meta = HEIGHTMAPS.Mutaha
  check(!!meta, 'Mutaha 高程索引存在')
  const binPath = resolve(ROOT, `frontend/public/squad-assets/heightmaps/${meta.slug}.bin`)
  check(existsSync(binPath), '高程 .bin 存在')
  if (existsSync(binPath)) {
    const hm = decodeHeightmap(readFileSync(binPath).buffer.slice(0), meta)
    const b = layer.corners
    const x = (b[0][0] + b[1][0]) / 2
    const y = (b[0][1] + b[1][1]) / 2
    const h = sampleHeight(layer, hm, x, y)
    check(h !== null && h >= meta.min - 1 && h <= meta.max + 1, '中心点高程在范围内', h?.toFixed(1))
  }
  const svgPath = resolve(ROOT, `frontend/public/squad-assets/contours/${CONTOURS.Mutaha.slug}.svg`)
  check(existsSync(svgPath), 'Mutaha 等高线 SVG 存在')
  if (existsSync(svgPath)) {
    const svg = readFileSync(svgPath, 'utf8')
    check((svg.match(/<path/g) || []).length > 10, '等高线路径数量正常', String((svg.match(/<path/g) || []).length))
  }
  const missing = Object.keys(RAAS_LAYERS)
    .map((k) => RAAS_LAYERS[k].map)
    .filter((map, i, arr) => arr.indexOf(map) === i)
    .filter((map) => !HEIGHTMAPS[map] || !CONTOURS[map])
  check(missing.length === 0, '所有 RAAS 地图都有高程 + 等高线', missing.join(','))
}

console.log(failed ? `\n❌ ${failed} 项失败` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
