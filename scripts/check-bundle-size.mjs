/**
 * 生产构建体积门禁
 *
 * 用法：node scripts/check-bundle-size.mjs
 * 前置：cd frontend && npm run build
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'frontend/dist')
const ASSETS = resolve(DIST, 'assets')

const MAX_INITIAL_JS = 380 // KB gzip（当前 356，目标 300）
const MAX_INITIAL_CSS = 60
const MAX_ROUTE_CHUNK = 160

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8')
const initial = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1])
const files = readdirSync(ASSETS).filter((f) => /\.(js|css)$/.test(f))

function gzKb(path) {
  return gzipSync(readFileSync(path)).length / 1024
}

let initialJs = 0
let initialCss = 0
const rows = []
for (const f of files) {
  const p = resolve(ASSETS, f)
  const raw = statSync(p).size / 1024
  const gz = gzKb(p)
  const isInitial = initial.some((u) => u.endsWith('/assets/' + f))
  if (isInitial && f.endsWith('.js')) initialJs += gz
  if (isInitial && f.endsWith('.css')) initialCss += gz
  rows.push({ f, raw, gz, initial: isInitial })
}

rows.sort((a, b) => b.gz - a.gz)
console.log('Top assets (gzip KB):')
for (const r of rows.slice(0, 10)) {
  console.log(`  ${r.initial ? '★' : ' '} ${r.gz.toFixed(1).padStart(7)}  ${r.f}  (${r.raw.toFixed(0)} KB raw)`)
}
console.log(`\n首屏 JS  ${initialJs.toFixed(1)} KB gzip / 预算 ${MAX_INITIAL_JS} KB`)
console.log(`首屏 CSS ${initialCss.toFixed(1)} KB gzip / 预算 ${MAX_INITIAL_CSS} KB`)

let failed = 0
if (initialJs > MAX_INITIAL_JS) { console.log('❌ 首屏 JS 超预算'); failed++ }
if (initialCss > MAX_INITIAL_CSS) { console.log('❌ 首屏 CSS 超预算'); failed++ }

for (const r of rows) {
  if (r.initial || !r.f.endsWith('.js')) continue
  if (r.gz > MAX_ROUTE_CHUNK) {
    console.log(`⚠️ 路由 chunk 偏大：${r.f} ${r.gz.toFixed(1)} KB > ${MAX_ROUTE_CHUNK} KB`)
  }
}

console.log(failed ? '\n❌ 体积门禁未通过' : '\n✅ 体积门禁通过')
process.exit(failed ? 1 : 0)
