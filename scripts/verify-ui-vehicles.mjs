/**
 * 「载具信息」页面无头点验
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-vehicles.mjs
 * 断言：页头汇总 = 数据层统计 / 两个视图行数 / 类别与阵营筛选 / 搜索 / 展开明细 / 无 JS 报错
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'
import { FACTIONS, VEHICLE_CATEGORIES } from '../frontend/src/data/squad/factions.js'
import { buildVehicleStats } from '../frontend/src/data/squad/vehicle-stats.js'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/raas-overlay'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

const st = buildVehicleStats(FACTIONS, VEHICLE_CATEGORIES)
const T = st.totals
const tankCount = st.byVehicle.filter((v) => v.category === 'tank').length
const m1 = st.byVehicle.find((v) => v.name === 'M1A1')
const usmc = st.byFaction.find((f) => f.code === 'USMC')
/** 按阵营视图里型号条目总数 = 各阵营去重型号数累加（同一型号可能在多个阵营分别计一行） */
const allFactionItems = st.byFaction.reduce((s, f) => s + f.uniqueCount, 0)

const probe = `(() => {
  const n = (sel) => document.querySelectorAll(sel).length;
  const txt = (sel) => (document.querySelector(sel)?.textContent || '').trim();
  return {
    h1: txt('h1'),
    meta: [...document.querySelectorAll('.hero-meta span')].map((e) => e.textContent.trim()),
    catChips: n('.cat-strip .cat-chip'),
    facChips: n('.fac-filters .fac-chip'),
    viewOn: txt('.view-switch button.on'),
    rows: n('.veh-table tbody tr.veh-row'),
    detailRows: n('.veh-table tbody tr.detail-row'),
    detailItems: n('.detail-list .detail-item'),
    facCards: n('.fac-list .fac-card'),
    facItems: n('.fac-list .fac-item'),
    facCats: n('.fac-list .fac-cat'),
    hit: txt('.hit-count'),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    errors: 0,
  };
})()`

const cdp = await connect()
try {
  await cdp.viewport(1440, 1000)
  await cdp.navigate(`${BASE}/squad/vehicles`, 3200)
  await cdp.freezeAnimations()
  await sleep(500)
  let d = await cdp.evaluate(probe)

  console.log('\n──────── 载具信息页 ────────')
  console.log(`  ${d.h1} | ${d.meta.join(' · ')}`)
  check(d.h1 === 'SQUAD 载具信息', '页头标题正确', d.h1)
  check(d.meta.join('|').replace(/[^\d|]/g, '') === `${T.factions}|${T.rosters}|${T.uniqueVehicles}|${T.entries}|${T.totalUnits}`,
    '页头汇总 = 数据层统计', d.meta.join(' · '))
  check(d.catChips === st.categories.length + 1, '类别 chip 数 = 全部 + 各类别', `${d.catChips}/${st.categories.length + 1}`)
  check(d.facChips === FACTIONS.length + 1, '阵营 chip 数 = 全部 + 各阵营', `${d.facChips}/${FACTIONS.length + 1}`)
  check(d.viewOn.includes('按载具'), '默认视图 = 按载具', d.viewOn)
  check(d.rows === T.uniqueVehicles, '按载具：默认列出全部型号', `${d.rows}/${T.uniqueVehicles}`)
  check(d.overflowX <= 2, '页面无横向溢出', `overflowX=${d.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-vehicle-view.png`)

  // 类别筛选
  await cdp.evaluate(`[...document.querySelectorAll('.cat-strip .cat-chip')].find((b) => b.textContent.includes('坦克')).click()`)
  await sleep(350)
  d = await cdp.evaluate(probe)
  check(d.rows === tankCount, '点「坦克」类别 → 只剩坦克', `${d.rows}/${tankCount}`)
  await cdp.evaluate(`[...document.querySelectorAll('.cat-strip .cat-chip')].find((b) => b.textContent.includes('全部')).click()`)
  await sleep(300)

  // 搜索
  await cdp.evaluate(`(() => { const i = document.querySelector('.search-input'); i.value = 'M1A1'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`)
  await sleep(350)
  d = await cdp.evaluate(probe)
  check(d.rows >= 1 && d.rows <= 6, '搜索 M1A1 命中少量型号', `rows=${d.rows}`)
  await cdp.evaluate(`(() => { const i = document.querySelector('.search-input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`)
  await sleep(300)

  // 展开明细（找 M1A1 那一行）
  const target = await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-table tbody tr.veh-row')]; const r = rows.find((x) => x.textContent.includes('M1A1')); if (!r) return null; r.click(); return r.textContent.trim().slice(0, 40); })()`)
  await sleep(350)
  d = await cdp.evaluate(probe)
  check(!!target, '找到 M1A1 行并点击', target || '')
  check(d.detailRows === 1, '点行后展开 1 条明细', `${d.detailRows}`)
  check(d.detailItems === m1.entryCount, '明细条数 = 该型号出现的编制数', `${d.detailItems}/${m1.entryCount}`)
  await cdp.screenshot(`${OUT}/vehicles-detail.png`)

  // 阵营筛选
  await cdp.evaluate(`[...document.querySelectorAll('.fac-filters .fac-chip')].find((b) => b.textContent.includes('USMC')).click()`)
  await sleep(350)
  d = await cdp.evaluate(probe)
  const usmcExpected = usmc.categories.reduce((s, c) => s + c.items.length, 0)
  check(d.rows === usmcExpected, '阵营筛选 USMC → 只要 USMC 的型号', `${d.rows}/${usmcExpected}`)
  await cdp.evaluate(`[...document.querySelectorAll('.fac-filters .fac-chip')].find((b) => b.textContent.includes('全部阵营')).click()`)
  await sleep(300)

  // 按阵营视图
  await cdp.evaluate(`[...document.querySelectorAll('.view-switch button')].find((b) => b.textContent.includes('按阵营')).click()`)
  await sleep(450)
  d = await cdp.evaluate(probe)
  check(d.facCards === FACTIONS.length, '按阵营：17 张阵营卡片', `${d.facCards}/${FACTIONS.length}`)
  check(d.facItems === allFactionItems, '按阵营：型号累加 = 各阵营型号数之和', `${d.facItems}/${allFactionItems}`)
  check(d.facCats >= FACTIONS.length, '每阵营至少一个类别分组', `facCats=${d.facCats}`)
  await cdp.screenshot(`${OUT}/vehicles-faction-view.png`)

  // 移动端
  await cdp.viewport(390, 844, { mobile: true })
  await sleep(700)
  d = await cdp.evaluate(probe)
  check(d.facCards === FACTIONS.length, '移动端按阵营视图仍完整', `${d.facCards}`)
  check(d.overflowX <= 2, '移动端无横向溢出', `overflowX=${d.overflowX}`)
  await cdp.screenshot(`${OUT}/vehicles-mobile.png`)
  await cdp.viewport(1440, 1000)
  await sleep(400)

  // 本地没起后端时 remote.js 会 console.warn 一行「Squad 远程数据加载失败」——不算页面问题
  const logs = cdp.consoleLogs(true).filter((l) => !/route named "Admin"/.test(l.text) && !/Squad 远程数据加载失败/.test(l.text))
  check(logs.length === 0, '页面无 JS 报错 / Vue 警告', logs.map((l) => l.type + ': ' + l.text).join(' | ').slice(0, 300))
} finally {
  await cdp.close()
}

console.log(`\n${failed === 0 ? '✅ 全部通过' : '❌ 失败 ' + failed + ' 项'}`)
process.exit(failed === 0 ? 0 : 1)
