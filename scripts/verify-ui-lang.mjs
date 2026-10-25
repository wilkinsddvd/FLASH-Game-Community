/**
 * 英文模式点验（S6b）
 *
 * 覆盖：
 *   1. 顶栏语言胶囊可切换，<html lang> 同步，刷新后保持
 *   2. 英文下：导航 / 首页功能入口 / 编制总览（阵营名 + 编制名 + 类型）无中文残留
 *   3. 切回中文立刻恢复
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-lang.mjs
 * 产物：/tmp/lang/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/lang'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label + (extra ? '  ' + extra : ''))
  if (!ok) failed++
}
const CJK = /[\u4e00-\u9fff]/

const NAV = `(() => [...document.querySelectorAll('.main-nav a')].map((a) => a.textContent.trim()))()`
const QUICK = `(() => [...document.querySelectorAll('.quick-card .quick-title')].map((e) => e.textContent.trim()))()`
const HERO = `(() => ({
  title: (document.querySelector('.squad-hero h1') || {}).textContent?.trim() || '',
  sub: (document.querySelector('.squad-hero p') || {}).textContent?.trim() || '',
  factions: [...document.querySelectorAll('.faction-name')].map((e) => e.textContent.trim()),
  rosters: [...document.querySelectorAll('.roster-name')].map((e) => e.textContent.trim()),
  types: [...document.querySelectorAll('.roster-type')].map((e) => e.textContent.trim()),
}))()`

const cdp = await connect()
try {
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {})
  await cdp.viewport(1920, 1080)
  await cdp.navigate(BASE + '/home', 4200)

  // 中文基线
  const zhNav = await cdp.evaluate(NAV)
  check(zhNav.includes('首页') && zhNav.includes('Squad编制'), '中文模式导航正常', zhNav.slice(0, 3).join(' / '))

  // 点语言胶囊
  const btn = await cdp.evaluate(`(() => { const b = document.querySelector('.lang-switch'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`)
  check(!!btn, '顶栏有语言切换胶囊')
  if (btn) {
    await cdp.clickAt(btn.x, btn.y)
    await sleep(700)
    const nav = await cdp.evaluate(NAV)
    const lang = await cdp.evaluate(`document.documentElement.getAttribute('lang')`)
    const stored = await cdp.evaluate(`localStorage.getItem('flash_lang')`)
    check(lang === 'en-US' && stored === 'en', '切换后 <html lang> 与 localStorage 同步', lang + ' / ' + stored)
    check(nav.includes('Home') && nav.includes('Rosters'), '导航变英文', nav.slice(0, 4).join(' / '))

    const q = await cdp.evaluate(QUICK)
    check(q.length === 8 && !q.some((s) => CJK.test(s)), '首页 8 个入口全英文', q.slice(0, 3).join(' / '))
    await cdp.screenshot(`${OUT}/1920-home-en.png`)
  }

  // 刷新保持
  await cdp.navigate(BASE + '/squad', 4000)
  const hero = await cdp.evaluate(HERO)
  check(!CJK.test(hero.title) && hero.title.length > 0, '编制页标题英文', hero.title)
  check(!CJK.test(hero.sub), '编制页副标题英文', hero.sub)
  const facCjk = hero.factions.filter((s) => CJK.test(s))
  check(facCjk.length === 0, '阵营名全英文（' + hero.factions.length + ' 个）', facCjk.slice(0, 3).join(' / '))
  const rosterCjk = hero.rosters.filter((s) => CJK.test(s))
  check(rosterCjk.length === 0, '编制名全英文（' + hero.rosters.length + ' 条）', rosterCjk.slice(0, 3).join(' / '))
  const typeCjk = hero.types.filter((s) => CJK.test(s))
  check(typeCjk.length === 0, '编制类型全英文', typeCjk.slice(0, 3).join(' / '))
  await cdp.screenshot(`${OUT}/1920-squad-en.png`)

  // 切回中文
  await cdp.evaluate(`(() => { localStorage.setItem('flash_lang', 'zh'); return 1 })()`)
  await cdp.navigate(BASE + '/squad', 3800)
  const back = await cdp.evaluate(HERO)
  check(CJK.test(back.title), '切回中文正常', back.title)

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
} finally {
  await cdp.close()
}

console.log('\n' + (failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过') + '（截图：' + OUT + '）')
process.exit(failed ? 1 : 0)
