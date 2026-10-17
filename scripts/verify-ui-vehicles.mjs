/**
 * 「载具信息」页面无头点验（v2：分阵营大图标 / 标签 / 票数按编制 / 悬停与抽屉）
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-vehicles.mjs
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'
import { FACTIONS } from '../frontend/src/data/squad/factions.js'
import { buildFactionCards } from '../frontend/src/data/squad/vehicle-view.js'
import { VEHICLE_CLASS_ORDER } from '../frontend/src/data/squad/vehicle-class.js'

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
const m1 = model.factions.flatMap((f) => f.cards).find((c) => c.name === 'M1A1')
const wpmc = model.factions.find((f) => f.code === 'WPMC')
const revive = wpmc?.cards.find((c) => c.name === 'M113A3 机动支援载具')

const probe = `(() => {
  const cards=[...document.querySelectorAll('.veh-card')];
  return {
    h1:(document.querySelector('h1')||{}).textContent||'',
    meta:[...document.querySelectorAll('.hero-meta span')].map(x=>x.textContent.trim()),
    facCards:document.querySelectorAll('.fac-card').length,
    vehCards:cards.length,
    catChips:[...document.querySelectorAll('.cat-strip .cat-chip')].map(x=>x.textContent.trim()),
    hasCount:/×\\d|共\\s*\\d+\\s*台/.test(document.body.innerText),
    overflowX:document.documentElement.scrollWidth-window.innerWidth,
  };
})()`

const cdp = await connect()
try {
  await cdp.viewport(1440, 1000)
  await cdp.navigate(`${BASE}/squad/vehicles`, 4500)
  await cdp.freezeAnimations()
  await sleep(800)
  let d = await cdp.evaluate(probe)

  console.log('\n──────── 载具信息页（v2）────────')
  check(d.h1 === 'SQUAD 载具信息', '页头标题正确', d.h1)
  check(d.meta.join('|').includes(`${T.factions} 阵营`) && d.meta.join('|').includes(`${T.rosters} 编制`) && d.meta.join('|').includes(`${T.models} 型号`), '页头汇总正确（无台数）', d.meta.join(' · '))
  check(d.facCards === T.factions, '阵营卡片数正确', `${d.facCards}/${T.factions}`)
  check(d.vehCards === T.cards, '载具卡片数正确', `${d.vehCards}/${T.cards}`)
  check(d.catChips.length === VEHICLE_CLASS_ORDER.length + 1, '类别 chip = 全部 + 15 类', `${d.catChips.length}`)
  check(!d.hasCount, '页面没有 ×数量 / 共 X 台')
  check(d.overflowX <= 2, '桌面无横向溢出', `overflowX=${d.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-v2-desktop.png`)

  // 搜索
  await cdp.evaluate(`(() => { const i=document.querySelector('.search-input'); i.value='M1A1'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await sleep(400)
  d = await cdp.evaluate(probe)
  check(d.vehCards > 0 && d.vehCards < T.cards, '搜索 M1A1 命中少量卡片', `${d.vehCards}`)
  await cdp.evaluate(`(() => { const i=document.querySelector('.search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await sleep(350)

  // 类别筛选
  await cdp.evaluate(`[...document.querySelectorAll('.cat-chip')].find(b=>b.textContent.includes('坦克')).click()`)
  await sleep(400)
  d = await cdp.evaluate(probe)
  const tankCount = model.factions.reduce((s, f) => s + f.cards.filter((c) => c.cls === '坦克').length, 0)
  check(d.vehCards === tankCount, '坦克类别筛选正确', `${d.vehCards}/${tankCount}`)
  await cdp.evaluate(`[...document.querySelectorAll('.cat-chip')].find(b=>b.textContent.includes('全部')).click()`)
  await sleep(550)

  // 悬停浮层
  await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M1A1')); c.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false})); })()`)
  await sleep(1500)
  const pop = await cdp.evaluate(`(() => { const p=document.querySelector('.veh-pop'); if(!p) return null; const img=p.querySelector('.vd-cover img'); return {rows:p.querySelectorAll('.vd-table tbody tr').length,img:img?img.naturalWidth:0,hasWeapons:p.innerText.includes('武器配置')}; })()`)
  check(!!pop, '桌面悬停出现浮层')
  check(pop && pop.img > 0, '浮层大图加载', pop ? `w=${pop.img}` : '')
  check(pop && pop.rows === m1.entries.length, '浮层票数表按编制逐行', pop ? `${pop.rows}/${m1.entries.length}` : '')
  check(pop && pop.hasWeapons, '浮层包含武器配置区')
  await cdp.screenshot(`${OUT}/vehicles-v2-hover.png`)

  // WPMC 复活车
  await cdp.evaluate(`[...document.querySelectorAll('.fac-chip')].find(b=>b.textContent.trim()==='WPMC').click()`)
  await sleep(900)
  const wd = await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M113A3 机动支援载具')); return c?{text:c.innerText,tags:[...c.querySelectorAll('.tag')].map(t=>t.textContent)}:null; })()`)
  check(!!wd, 'WPMC 复活车卡片存在')
  check(wd && wd.tags.includes('复活车'), '复活车标签正确', wd ? wd.tags.join('/') : '')
  check(wd && wd.text.includes('票数 20'), '复活车票数 20', wd ? wd.text.replace(/\n/g, ' | ') : '')
  await cdp.evaluate(`(() => { const c=[...document.querySelectorAll('.veh-card')].find(x=>x.textContent.includes('M113A3 机动支援载具')); c.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false})); })()`)
  await sleep(1500)
  const wr = await cdp.evaluate(`(() => { const p=document.querySelector('.veh-pop'); return p?p.querySelectorAll('.vd-table tbody tr').length:0; })()`)
  check(wr === revive.entries.length, '复活车浮层列出全部编制', `${wr}/${revive.entries.length}`)
  await cdp.screenshot(`${OUT}/vehicles-v2-wpmc.png`)

  // 移动端抽屉
  await cdp.viewport(390, 844)
  await cdp.navigate(`${BASE}/squad/vehicles`, 4000)
  await cdp.freezeAnimations()
  await sleep(600)
  await cdp.evaluate(`(() => { const c=document.querySelector('.veh-card'); c.click(); })()`)
  await sleep(450)
  const mobile = await cdp.evaluate(`(() => { const m=document.querySelector('.sheet-mask'); return m?{ok:true,overflowX:document.documentElement.scrollWidth-window.innerWidth}:{ok:false}; })()`)
  check(!!mobile.ok, '移动端点击打开抽屉')
  check(mobile.overflowX <= 2, '移动端无横向溢出', `overflowX=${mobile.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-v2-mobile.png`)

  console.log(`\n${failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过'}`)
  process.exitCode = failed ? 1 : 0
} finally {
  await cdp.close()
}
