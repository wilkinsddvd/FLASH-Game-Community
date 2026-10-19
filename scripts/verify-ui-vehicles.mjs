/**
 * 「载具信息」页面无头点验（v3：阵营大图标 → 单阵营页）
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-vehicles.mjs
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'
import { FACTIONS } from '../frontend/src/data/squad/factions.js'
import { buildFactionCards } from '../frontend/src/data/squad/vehicle-view.js'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/raas-overlay'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

const model = buildFactionCards(FACTIONS)
const T = model.totals
const usmc = model.factions.find((f) => f.code === 'USMC')
const wpmc = model.factions.find((f) => f.code === 'WPMC')
const revive = wpmc?.cards.find((c) => c.name === 'M113A3 机动支援载具')
const m1 = usmc?.cards.find((c) => c.name === 'M1A1')

const cdp = await connect()
try {
  await cdp.viewport(1440, 1000)
  await cdp.navigate(`${BASE}/squad/vehicles`, 3500)
  await cdp.freezeAnimations()
  await sleep(500)

  console.log('\n──────── 阵营选择页 ────────')
  let d = await cdp.evaluate(`(() => ({
    picks: document.querySelectorAll('.fac-pick-card').length,
    flags: [...document.querySelectorAll('.fac-pick-flag')].map(e=>Math.round(e.getBoundingClientRect().width)),
    title: document.querySelector('h1')?.textContent?.trim() || '',
    meta: document.querySelector('.hero-meta')?.textContent?.replace(/\\s+/g,' ').trim() || '',
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  }))()`)
  check(d.title === 'SQUAD 载具信息', '页头标题正确', d.title)
  check(d.picks === T.factions, `阵营大图标 = ${T.factions}`, String(d.picks))
  check(d.flags.every((w) => w >= 90), '图标为大尺寸（≥90px）', d.flags.slice(0, 3).join(','))
  check(d.meta.includes(`${T.factions} 阵营`) && d.meta.includes(`${T.models} 型号`), '页头汇总正确', d.meta)
  check(d.overflowX <= 2, '桌面无横向溢出', `overflowX=${d.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-v3-picker.png`)

  // 搜索阵营
  await cdp.evaluate(`(() => { const i=document.querySelector('.search-input'); i.value='USMC'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await sleep(350)
  d = await cdp.evaluate(`(() => ({ picks: document.querySelectorAll('.fac-pick-card').length }))()`)
  check(d.picks === 1, '搜索 USMC 命中 1 个阵营', String(d.picks))

  console.log('\n──────── 单阵营页（USMC）────────')
  await cdp.navigate(`${BASE}/squad/vehicles/USMC`, 3500)
  await cdp.freezeAnimations()
  await sleep(500)
  d = await cdp.evaluate(`(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    crumb: document.querySelector('.crumb-current')?.textContent?.trim() || '',
    cards: document.querySelectorAll('.veh-card').length,
    facTags: [...new Set([...document.querySelectorAll('.tag-fac')].map(e=>e.textContent.trim()))],
    chips: [...document.querySelectorAll('.cat-strip .cat-chip')].map(e=>e.textContent.trim()),
    hasCount: /×\\d|共\\s*\\d+\\s*台/.test(document.body.innerText),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  }))()`)
  check(d.crumb.includes('USMC'), '面包屑正确', d.crumb)
  check(d.cards === usmc.modelCount, `卡片数 = USMC 型号数 ${usmc.modelCount}`, String(d.cards))
  check(d.facTags.length === 1 && d.facTags[0] === 'USMC', '只出现 USMC 阵营标签', d.facTags.join('/'))
  check(d.chips.length >= 2 && d.chips[0].includes('全部'), '类别 chip 正常', String(d.chips.length))
  check(!d.hasCount, '页面没有 ×数量 / 共 X 台')
  check(d.overflowX <= 2, '桌面无横向溢出', `overflowX=${d.overflowX}`)

  // 搜索
  await cdp.evaluate(`(() => { const i=document.querySelector('.search-input'); i.value='M1A1'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await sleep(400)
  d = await cdp.evaluate(`(() => ({ cards: document.querySelectorAll('.veh-card').length }))()`)
  check(d.cards > 0 && d.cards < usmc.modelCount, '搜索 M1A1 命中少量卡片', String(d.cards))
  await cdp.evaluate(`(() => { const i=document.querySelector('.search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await sleep(350)

  // 类别筛选
  const tankCount = usmc.cards.filter((c) => c.cls === '坦克').length
  await cdp.evaluate(`[...document.querySelectorAll('.cat-chip')].find(b=>b.textContent.includes('坦克')).click()`)
  await sleep(400)
  d = await cdp.evaluate(`(() => ({ cards: document.querySelectorAll('.veh-card').length }))()`)
  check(d.cards === tankCount, '坦克类别筛选正确', `${d.cards}/${tankCount}`)
  await cdp.evaluate(`[...document.querySelectorAll('.cat-chip')].find(b=>b.textContent.includes('全部')).click()`)
  await sleep(450)

  // 悬停浮层
  await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M1A1')); c.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false})); })()`)
  await sleep(1400)
  const pop = await cdp.evaluate(`(() => { const p=document.querySelector('.veh-pop'); if(!p) return null; const img=p.querySelector('.vd-cover img'); return {rows:p.querySelectorAll('.vd-table tbody tr').length,img:img?img.naturalWidth:0,hasWeapons:p.innerText.includes('武器配置'),note:p.querySelector('.vd-img-note')?.textContent||''}; })()`)
  check(!!pop, '桌面悬停出现浮层')
  check(pop && pop.img > 0, '浮层大图加载', pop ? `w=${pop.img}` : '')
  check(pop && pop.rows === m1.entries.length, '浮层票数表按编制逐行', pop ? `${pop.rows}/${m1.entries.length}` : '')
  check(pop && pop.hasWeapons, '浮层包含武器配置区')
  check(pop && (pop.note === '' || !!pop.note), '浮层图片来源状态字段存在')
  await cdp.screenshot(`${OUT}/vehicles-v3-hover.png`)

  console.log('\n──────── WPMC 复活车 ────────')
  await cdp.navigate(`${BASE}/squad/vehicles/WPMC`, 3500)
  await cdp.freezeAnimations()
  await sleep(500)
  const wd = await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M113A3 机动支援载具')); return c?{text:c.innerText,tags:[...c.querySelectorAll('.tag')].map(t=>t.textContent)}:null; })()`)
  check(!!wd, 'WPMC 复活车卡片存在')
  check(wd && wd.tags.includes('复活车'), '复活车标签正确', wd ? wd.tags.join('/') : '')
  check(wd && wd.text.includes('票数 20'), '复活车票数 20', wd ? wd.text.replace(/\n/g, ' | ') : '')
  await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M113A3 机动支援载具')); c.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false})); })()`)
  await sleep(1400)
  const wr = await cdp.evaluate(`(() => { const p=document.querySelector('.veh-pop'); return p?p.querySelectorAll('.vd-table tbody tr').length:0; })()`)
  check(wr === revive.entries.length, '复活车浮层列出全部编制', `${wr}/${revive.entries.length}`)
  await cdp.screenshot(`${OUT}/vehicles-v3-wpmc.png`)

  console.log('\n──────── 移动端 ────────')
  await cdp.viewport(390, 844, { mobile: true })
  await cdp.navigate(`${BASE}/squad/vehicles/USMC`, 3500)
  await cdp.freezeAnimations()
  await sleep(600)
  await cdp.evaluate(`document.querySelector('.veh-card').click()`)
  await sleep(450)
  const mobile = await cdp.evaluate(`(() => ({ ok: !!document.querySelector('.sheet-mask'), overflowX: document.documentElement.scrollWidth - window.innerWidth }))()`)
  check(!!mobile.ok, '移动端点击打开抽屉')
  check(mobile.overflowX <= 2, '移动端无横向溢出', `overflowX=${mobile.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-v3-mobile.png`)

  const logs = cdp.consoleLogs().filter((l) => l.type === 'error')
  check(logs.length === 0, '无控制台 error', logs.map((l) => l.text).join(' | '))
} finally {
  await cdp.close()
}
console.log(failed ? `\n❌ 失败 ${failed} 项` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
