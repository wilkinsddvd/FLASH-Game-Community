/**
 * 载具图片审计：输出 CSV + 按阵营 contact sheet
 *
 * 用法：node scripts/audit-vehicle-images.mjs
 * 产物：
 *   docs/vehicle-image-audit.csv
 *   docs/vehicle-image-contact-sheet.html
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FACTIONS } from '../frontend/src/data/squad/factions.js'
import { buildFactionCards } from '../frontend/src/data/squad/vehicle-view.js'
import { vehicleImageFor, vehicleImageStatus, vehicleImageNote } from '../frontend/src/data/squad/vehicle-images.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = resolve(ROOT, 'frontend/public')

const data = buildFactionCards(FACTIONS)
const rows = []
const byFac = new Map()

for (const f of data.factions) {
  const list = []
  for (const c of f.cards) {
    const img = vehicleImageFor(c.name)
    const status = vehicleImageStatus(c.name)
    const abs = img ? resolve(PUBLIC, img.replace(/^\//, '')) : ''
    const exists = abs ? existsSync(abs) : false
    const row = {
      faction: f.code,
      name: c.name,
      cls: c.cls || '',
      image: img,
      status,
      exists,
      note: vehicleImageNote(c.name),
    }
    rows.push(row)
    list.push(row)
  }
  byFac.set(f.code, list)
}

/* ── CSV ── */
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const csv = [
  ['阵营', '载具', '类别', '图片', '状态', '文件存在', '备注'].map(esc).join(','),
  ...rows.map((r) => [r.faction, r.name, r.cls, r.image, r.status, r.exists ? 'Y' : 'N', r.note].map(esc).join(',')),
].join('\n')
writeFileSync(resolve(ROOT, 'docs/vehicle-image-audit.csv'), '\ufeff' + csv)

/* ── HTML contact sheet ── */
const badge = (status) => {
  const map = {
    exact: ['#1f8f4e', 'exact'],
    'same-chassis': ['#b7791f', 'same-chassis'],
    missing: ['#c53030', 'missing'],
  }
  const [color, label] = map[status] || ['#666', status]
  return `<span class="badge" style="background:${color}">${label}</span>`
}

const sections = [...byFac.entries()].map(([code, list]) => {
  const f = data.factions.find((x) => x.code === code)
  const cards = list.map((r) => {
    const src = r.image ? `../frontend/public${r.image}` : ''
    return `<figure class="card">
      <div class="thumb">${src ? `<img src="${src}" loading="lazy" alt="${r.name}">` : '<span class="noimg">无图</span>'}</div>
      <figcaption>
        <div class="name">${r.name}</div>
        <div class="meta">${r.cls || '未分类'} · ${badge(r.status)}</div>
        <div class="file">${r.image || '—'}</div>
      </figcaption>
    </figure>`
  }).join('\n')
  return `<section>
    <h2>${code} ${f?.name || ''} <small>${list.length} 型号</small></h2>
    <div class="grid">${cards}</div>
  </section>`
}).join('\n')

const counts = rows.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {})
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>载具图片审计 · ${new Date().toISOString().slice(0, 10)}</title>
<style>
  body { font-family: -apple-system, "PingFang SC", sans-serif; background:#11151c; color:#e6e8eb; margin:0; padding:24px; }
  h1 { margin:0 0 6px; font-size:22px; }
  .sum { color:#9aa4b2; margin-bottom:22px; }
  h2 { font-size:16px; margin:28px 0 12px; border-left:3px solid #409eff; padding-left:10px; }
  h2 small { color:#8b95a3; font-weight:400; margin-left:8px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:12px; }
  .card { margin:0; background:#1a2029; border:1px solid #2b3440; border-radius:10px; overflow:hidden; }
  .thumb { aspect-ratio:16/10; background:#0e1116; display:grid; place-items:center; overflow:hidden; }
  .thumb img { width:100%; height:100%; object-fit:contain; }
  .noimg { color:#c53030; font-size:13px; }
  figcaption { padding:10px 12px; }
  .name { font-size:13px; font-weight:700; line-height:1.35; }
  .meta { margin-top:5px; font-size:11px; color:#9aa4b2; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .badge { color:#fff; font-size:10px; padding:1px 7px; border-radius:999px; }
  .file { margin-top:6px; font-size:10px; color:#66707d; word-break:break-all; }
</style>
</head>
<body>
  <h1>载具图片审计</h1>
  <div class="sum">共 ${rows.length} 张阵营卡片 · exact ${counts.exact || 0} · same-chassis ${counts['same-chassis'] || 0} · missing ${counts.missing || 0}</div>
  ${sections}
</body>
</html>`
writeFileSync(resolve(ROOT, 'docs/vehicle-image-contact-sheet.html'), html)

console.log(`✅ 写出 docs/vehicle-image-audit.csv（${rows.length} 行）`)
console.log(`✅ 写出 docs/vehicle-image-contact-sheet.html`)
console.log(`   exact ${counts.exact || 0} / same-chassis ${counts['same-chassis'] || 0} / missing ${counts.missing || 0}`)
const missing = rows.filter((r) => r.status === 'missing')
if (missing.length) {
  console.log('\n缺图：')
  for (const r of missing) console.log(`  - ${r.faction} ${r.name}`)
}
const bad = rows.filter((r) => r.image && !r.exists)
if (bad.length) {
  console.log('\n断链：')
  for (const r of bad) console.log(`  - ${r.faction} ${r.name} → ${r.image}`)
  process.exit(1)
}
