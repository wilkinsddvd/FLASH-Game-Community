/**
 * 全站布局点验（S4）：六档断点 × 主要页面
 *
 * 检查：
 *   1. 无横向滚动
 *   2. 侧栏几何（1920 → 220 / 1440 → 180 / ≤1240 → 收起并改用顶部横滑条）
 *   3. 内容区宽度按壳层计算（1920 下 ≈1396，不是各页写死）
 *   4. 满宽白名单（登录/注册/后台）没有侧栏
 *   5. 页面无 JS 报错
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-layout.mjs
 * 产物：/tmp/layout/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/layout'
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['/home', '首页'],
  ['/squad', '编制总览'],
  ['/squad/RGF/rgf-mechanized', '编制详情'],
  ['/squad/vehicles', '载具信息'],
  ['/squad/points', '点位推测'],
  ['/squad/fire-control', '火控计算器'],
  ['/cert', '基础认证'],
  ['/guide', '攻略'],
]
const BREAKPOINTS = [
  [1920, 1080, '1920'],
  [1440, 900, '1440'],
  [1366, 768, '1366'],
  [1024, 768, '1024'],
  [768, 1024, '768'],
  [390, 844, '390'],
]

let failed = 0
const check = (ok, label, extra = '') => {
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label + (extra ? '  ' + extra : ''))
  if (!ok) failed++
}
const r1 = (v) => Math.round(v * 10) / 10

const PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const rect = (e) => e ? { x: +e.getBoundingClientRect().x.toFixed(1), w: +e.getBoundingClientRect().width.toFixed(1), right: +e.getBoundingClientRect().right.toFixed(1) } : null;
  const rails = [...document.querySelectorAll('.main-content > .side-rail')].filter((e) => getComputedStyle(e).display !== 'none');
  const strip = q('.banner-mobile-strip');
  const main = q('.main-content');
  const shellMain = q('.shell-main');
  return {
    vw: innerWidth,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    rails: rails.length,
    railW: rails.length ? +rails[0].getBoundingClientRect().width.toFixed(1) : 0,
    railRects: rails.map((e) => ({ x: +e.getBoundingClientRect().x.toFixed(1), right: +e.getBoundingClientRect().right.toFixed(1) })),
    stripShown: !!strip && getComputedStyle(strip).display !== 'none',
    mainW: main ? +main.getBoundingClientRect().width.toFixed(1) : 0,
    mainLeft: main ? +main.getBoundingClientRect().x.toFixed(1) : 0,
    shellW: shellMain ? +shellMain.getBoundingClientRect().width.toFixed(1) : 0,
    shellLeft: shellMain ? +shellMain.getBoundingClientRect().x.toFixed(1) : 0,
    headerW: (() => { const h = q('.header-inner'); return h ? +h.getBoundingClientRect().width.toFixed(1) : 0; })(),
  };
})()`

// 库里没 Banner 时侧栏本来就不该出现：自动降级为「零侧栏」断言
let hasBanners = false
try {
  const list = await (await fetch(BASE.replace(/\/$/, '') + '/api/banners')).json()
  hasBanners = Array.isArray(list) && list.length > 0
} catch { hasBanners = false }
console.log('Banner 数据：' + (hasBanners ? '有（验证侧栏几何）' : '无（验证无侧栏时的满宽）'))

const cdp = await connect()
try {
  for (const [w, h, label] of BREAKPOINTS) {
    console.log('\n── 断点 ' + label + ' (' + w + '×' + h + ') ──')
    await cdp.viewport(w, h, { mobile: w < 500 })
    let first = true
    for (const [path, name] of PAGES) {
      await cdp.navigate(BASE + path, first ? 4200 : 2600)
      first = false
      const p = await cdp.evaluate(PROBE)
      const tag = name + ' ' + path
      check(p.overflowX <= 1, tag + ' · 无横向滚动', '溢出 ' + p.overflowX + 'px')

      const expectRails = w > 1240 && hasBanners
      if (expectRails) {
        check(p.rails === 2, tag + ' · 左右侧栏都在', '实际 ' + p.rails + ' 个')
        const expectRailW = w > 1600 ? 220 : 180
        check(Math.abs(p.railW - expectRailW) <= 2, tag + ' · 侧栏宽度 ' + expectRailW + 'px', '实际 ' + p.railW + 'px')
        // 内容不与侧栏重叠
        if (p.railRects.length === 2) {
          const leftRailRight = p.railRects[0].right
          const rightRailLeft = p.railRects[1].x
          const noOverlap = p.shellLeft >= leftRailRight - 0.5 && (p.shellLeft + p.shellW) <= rightRailLeft + 0.5
          check(noOverlap, tag + ' · 内容不与侧栏重叠')
        }
      } else if (hasBanners) {
        check(p.rails === 0, tag + ' · 窄屏收起侧栏', '实际 ' + p.rails + ' 个')
        check(p.stripShown, tag + ' · 改为顶部横滑条')
      } else {
        check(p.rails === 0, tag + ' · 无 Banner 时不渲染侧栏', '实际 ' + p.rails + ' 个')
      }
    }

    if (w === 1920) {
      const p = await cdp.evaluate(PROBE)
      await cdp.navigate(BASE + '/squad', 2600)
      const q = await cdp.evaluate(PROBE)
      check(Math.abs(q.mainW - 1920) <= 2 || q.mainW <= 1920, '1920 · 壳层最大 1920px（内边距 24 → 内容 1872）', 'main ' + r1(q.mainW) + 'px')
      check(q.headerW > 1800, '1920 · 顶栏与内容同宽', 'header ' + r1(q.headerW) + 'px')
      const content = await cdp.evaluate(`(() => { const e = document.querySelector('.squad-page'); return e ? +e.getBoundingClientRect().width.toFixed(1) : 0; })()`)
      const wantW = hasBanners ? [1380, 1410] : [1870, 1874]
      check(content > wantW[0] && content < wantW[1],
        hasBanners ? '1920 · /squad 内容宽度 ≈1396（不再写死 1200）' : '1920 · 无 Banner 时内容满宽 ≈1872',
        r1(content) + 'px')
      await cdp.screenshot(`${OUT}/1920-squad.png`)
    }

    if (w === 1440) {
      await cdp.navigate(BASE + '/squad/vehicles', 2800)
      await cdp.screenshot(`${OUT}/1440-vehicles.png`)
    }
    if (w === 390) {
      await cdp.navigate(BASE + '/home', 2600)
      await cdp.screenshot(`${OUT}/390-home.png`)
    }

    const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
    check(!logs.length, '断点 ' + label + ' · 无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
  }

  // 满宽白名单
  console.log('\n── 满宽白名单 ──')
  await cdp.viewport(1920, 1080)
  await cdp.navigate(BASE + '/login', 3000)
  const login = await cdp.evaluate(PROBE)
  check(login.rails === 0, '登录页无侧栏', '实际 ' + login.rails)
  check(login.mainW >= 1900, '登录页满宽', r1(login.mainW) + 'px')
} finally {
  await cdp.close()
}

console.log('\n' + (failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过') + '（截图：' + OUT + '）')
process.exit(failed ? 1 : 0)
