/**
 * 编制详情页无头点验（名称 / 载具行 / 图片可加载 / 无横向溢出）
 *
 * 用法：
 *   RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-rosters.mjs                 # 默认点验 2026-10-31 补充的 3 条编制
 *   RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-rosters.mjs USMC:usmc-combined ADF:adf-combined
 *
 * 坑：headless 下行内 <img loading="lazy"> 的 naturalWidth 恒为 0（不等滚动也如此），
 *     所以图片是否可加载用探针 Image() 逐个真实请求判断，不看页面里的 naturalWidth。
 */
import { connect, sleep } from './lib/cdp.mjs'
import { FACTIONS } from '../frontend/src/data/squad/factions.js'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const DEFAULT_CASES = ['USMC:usmc-combined', 'USA:usa-armored', 'RGF:rgf-armored']

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

const specs = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CASES).map((s) => {
  const [code, key] = s.split(':')
  const faction = FACTIONS.find((f) => f.code === code)
  const roster = faction?.rosters.find((r) => r.key === key)
  return { code, key, path: `/squad/${code}/${key}`, roster, name: roster?.name || '', rows: roster?.vehicles.length || 0 }
})

const cdp = await connect()
try {
  await cdp.viewport(1440, 1000)
  for (const c of specs) {
    console.log(`\n──────── ${c.path} ────────`)
    if (!c.roster) { check(false, '编制存在于静态数据', c.key); continue }
    await cdp.navigate(BASE + c.path, 3500)
    await cdp.freezeAnimations()
    await sleep(700)
    const d = await cdp.evaluate(`(() => {
      const txt = document.body.innerText || ''
      const rows = [...document.querySelectorAll('tr')].map(e => e.innerText.replace(/\\s+/g, ' ').trim()).filter(t => /\\d/.test(t) && !/名称/.test(t))
      return { txt: txt.slice(0, 600), rowCount: rows.length, sample: rows.slice(0, 40), overflowX: document.documentElement.scrollWidth - window.innerWidth }
    })()`)
    check(d.txt.includes(c.name), '编制名称出现', c.name)
    check(d.rowCount >= c.rows, `载具行数 ≥ ${c.rows}`, String(d.rowCount))
    const missingRows = c.roster.vehicles.map((v) => v.name).filter((n) => !d.sample.some((t) => t.includes(n.replace(/\s+/g, '')) || t.includes(n)))
    check(missingRows.length === 0, '每条载具都渲染出来', missingRows.join(', ') || `${c.rows}/${c.rows}`)
    check(d.overflowX <= 0, '无横向溢出', 'overflowX=' + d.overflowX)

    const probe = await cdp.evaluate(`(async () => {
      const urls = [...new Set([...document.images].map(i => i.src).filter(s => s.includes('/squad-assets/')))]
      const out = []
      for (const u of urls) {
        const ok = await new Promise(r => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = u; setTimeout(() => r(false), 5000) })
        out.push({ u, ok })
      }
      return out
    })()`)
    const broken = (probe || []).filter((x) => !x.ok)
    check(broken.length === 0, '所有图片可加载', broken.length ? broken.map((b) => b.u.split('/').pop()).join(',') : `共 ${(probe || []).length} 张`)
  }
} finally {
  await cdp.close?.()
}

console.log(failed ? `\n❌ ${failed} 项失败` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
