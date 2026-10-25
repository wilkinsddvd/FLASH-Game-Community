/**
 * 首页「功能入口」8 大图标点验（S5）
 *
 * 覆盖：
 *   1. 8 张卡都在，链接互不重复且都能落地（逐个点进去看目标页是否有内容）
 *   2. 栅格：1920 → 4 列，1366 → 3 列，768 → 2 列，390 → 2 列
 *   3. 键盘可达：Tab 能走到卡片，Enter 能跳转；每张卡有 aria-label
 *   4. 图标是内联 SVG（44px，桌面），不新增图片请求
 *   5. 暗/亮两套主题下标题文字对比度 ≥ 4.5:1（AA）
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-quicklinks.mjs
 * 产物：/tmp/quicklinks/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/quicklinks'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label + (extra ? '  ' + extra : ''))
  if (!ok) failed++
}
const r1 = (v) => Math.round(v * 10) / 10

/** 每张卡落地后必须出现的页面特征元素 */
const LANDING = {
  '编制': '.squad-page',
  '点位': '.points-home',
  '载具': '.veh-picker',
  '火控': '.fc-page',
  '认证': '.page-title',
  '攻略': '.guide-toolbar',
  '视频': '.video-grid',
  '社区': '.page-title',
}

const GRID = `(() => {
  const cards = [...document.querySelectorAll('.quick-card')];
  if (!cards.length) return null;
  const tops = new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top)));
  const firstRow = cards.filter((c) => Math.round(c.getBoundingClientRect().top) === Math.min(...tops));
  const icon = cards[0].querySelector('.quick-icon svg');
  const ir = icon ? icon.getBoundingClientRect() : null;
  return {
    count: cards.length,
    cols: firstRow.length,
    rows: tops.size,
    hrefs: cards.map((c) => c.getAttribute('href')),
    labels: cards.map((c) => c.getAttribute('aria-label') || ''),
    titles: cards.map((c) => (c.querySelector('.quick-title') || {}).textContent?.trim() || ''),
    iconTag: icon ? icon.tagName.toLowerCase() : '',
    iconW: ir ? +ir.width.toFixed(1) : 0,
    imgInCard: cards[0].querySelectorAll('img').length,
  };
})()`

const CONTRAST = `(() => {
  const parse = (s) => {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const card = document.querySelector('.quick-card');
  const title = card.querySelector('.quick-title');
  const desc = card.querySelector('.quick-desc');
  const icon = card.querySelector('.quick-icon');
  const pageBg = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  const cardBg = blend(parse(getComputedStyle(card).backgroundColor), pageBg);
  return {
    theme: document.documentElement.getAttribute('data-theme') || 'light',
    title: ratio(parse(getComputedStyle(title).color), cardBg),
    desc: ratio(parse(getComputedStyle(desc).color), cardBg),
    icon: ratio(parse(getComputedStyle(icon).color), cardBg),
  };
})()`

const cdp = await connect()
try {
  console.log('── 1920 ──')
  await cdp.viewport(1920, 1080)
  await cdp.navigate(BASE + '/home', 4600)

  let g = await cdp.evaluate(GRID)
  check(!!g, '功能入口已渲染')
  if (!g) { await cdp.close(); process.exit(1) }

  check(g.count === 8, '8 张入口卡', '实际 ' + g.count)
  check(g.cols === 4 && g.rows === 2, '1920 栅格 4×2', g.cols + '列 × ' + g.rows + '行')
  check(new Set(g.hrefs).size === 8, '8 个链接互不重复', g.hrefs.join(' '))
  check(g.iconTag === 'svg', '图标是内联 SVG（无新增图片）', 'tag=' + g.iconTag + ' img=' + g.imgInCard)
  check(g.iconW === 44, '图标 44px', g.iconW + 'px')
  const noLabel = g.titles.filter((t, i) => !g.labels[i]).length
  check(noLabel === 0, '每张卡都有 aria-label', '缺 ' + noLabel)
  await cdp.screenshot(`${OUT}/1920-home.png`)

  // 逐个点进去看目标页
  for (let i = 0; i < 8; i++) {
    await cdp.navigate(BASE + '/home', 3000)
    const card = await cdp.evaluate(`(() => {
      const c = document.querySelectorAll('.quick-card')[${i}];
      if (!c) return null;
      const b = c.getBoundingClientRect();
      b.x; return { x: b.x + b.width / 2, y: b.y + b.height / 2, href: c.getAttribute('href'), name: (c.querySelector('.quick-title') || {}).textContent?.trim() || '' };
    })()`)
    if (!card) { check(false, '第 ' + (i + 1) + ' 张卡可点击'); continue }
    await cdp.clickAt(card.x, card.y)
    await sleep(900)
    const url = await cdp.evaluate(`location.pathname + location.hash`)
    const key = card.name.replace(/[A-Za-z\s]+$/, '').trim()
    const sel = LANDING[key] || ''
    const landed = await cdp.evaluate(`!!document.querySelector('${sel}')`)
    check(landed && url.startsWith(card.href.split('#')[0]), card.name + ' → ' + card.href, '落在 ' + url)
  }

  // 键盘：Tab 能走到卡片，Enter 能跳转
  await cdp.navigate(BASE + '/home', 3800)
  let reached = false
  let tabs = 0
  for (let i = 0; i < 40; i++) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    tabs++
    const onCard = await cdp.evaluate(`!!(document.activeElement && document.activeElement.classList.contains('quick-card'))`)
    if (onCard) { reached = true; break }
  }
  check(reached, 'Tab 可达功能入口', '按了 ' + tabs + ' 次 Tab')
  if (reached) {
    const before = await cdp.evaluate(`location.pathname`)
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await sleep(900)
    const after = await cdp.evaluate(`location.pathname`)
    check(after !== before, 'Enter 可打开入口', before + ' → ' + after)
  }

  // 主题对比度
  await cdp.navigate(BASE + '/home', 3600)
  let c1 = await cdp.evaluate(CONTRAST)
  check(c1.title >= 4.5, '亮色 · 标题对比度 ≥4.5（AA）', r1(c1.title) + ':1')
  check(c1.desc >= 4.5, '亮色 · 说明文字对比度 ≥4.5', r1(c1.desc) + ':1')
  await cdp.evaluate(`document.documentElement.setAttribute('data-theme','dark'); localStorage.setItem('theme','dark'); 1`)
  await sleep(300)
  let c2 = await cdp.evaluate(CONTRAST)
  check(c2.title >= 4.5, '暗色 · 标题对比度 ≥4.5（AA）', r1(c2.title) + ':1')
  check(c2.desc >= 4.5, '暗色 · 说明文字对比度 ≥4.5', r1(c2.desc) + ':1')
  await cdp.screenshot(`${OUT}/1920-home-dark.png`)
  await cdp.evaluate(`document.documentElement.setAttribute('data-theme','light'); localStorage.setItem('theme','light'); 1`)

  // 断点
  for (const [w, h, cols, label] of [[1366, 768, 3, '1366'], [768, 1024, 2, '768'], [390, 844, 2, '390']]) {
    console.log('\n── ' + label + ' ──')
    await cdp.viewport(w, h, { mobile: w < 500 })
    await cdp.navigate(BASE + '/home', 3600)
    const gg = await cdp.evaluate(GRID)
    check(gg && gg.cols === cols, label + ' 栅格 ' + cols + ' 列', gg ? gg.cols + ' 列' : '未渲染')
    const ox = await cdp.evaluate(`document.documentElement.scrollWidth - innerWidth`)
    check(ox <= 1, label + ' 无横向滚动', '溢出 ' + ox + 'px')
    await cdp.screenshot(`${OUT}/${label}-home.png`)
  }

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
} finally {
  await cdp.close()
}

console.log('\n' + (failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过') + '（截图：' + OUT + '）')
process.exit(failed ? 1 : 0)
