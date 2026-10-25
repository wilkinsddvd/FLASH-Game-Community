/**
 * 编制页面「载具浮窗」专项点验（S2）
 *
 * 覆盖：
 *   1. 浮窗 rect 完全在视口内（1920 / 1366 / 390 三档）
 *   2. 图片 object-fit: contain 且不裁切（显示宽高比 vs 原图宽高比误差 < 2%）
 *   3. 字段齐全：类型 / 数量 / 票数 / 重生 / 初始延迟 / 查看完整资料
 *   4. 靠右/靠下自动翻转后仍不越界（取首行 + 末行各试一次）
 *   5. 点击行开详情抽屉；390 触屏单击直接开抽屉（不弹浮窗）
 *   6. 页面无 JS 报错 / Vue 警告
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-tip.mjs
 * 产物：/tmp/vehicle-tip/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/vehicle-tip'
const PAGE = '/squad/RGF/rgf-mechanized'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}
const num = (v) => Math.round(v * 10) / 10

const rowRect = (idx) => `(() => {
  const rows = [...document.querySelectorAll('.veh-row')];
  const r = rows[${idx}];
  if (!r) return null;
  const b = r.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height, cy: b.y + b.height / 2, cx: b.x + Math.min(120, b.width / 2), n: rows.length };
})()`

const TIP = `(() => {
  const el = document.querySelector('.veh-tip');
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const img = el.querySelector('img.vtip-img');
  const ir = img ? img.getBoundingClientRect() : null;
  const txt = el.innerText || '';
  return {
    x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom,
    vw: innerWidth, vh: innerHeight,
    img: img ? {
      fit: getComputedStyle(img).objectFit,
      nw: img.naturalWidth, nh: img.naturalHeight,
      cw: ir.width, ch: ir.height,
    } : null,
    has: {
      type: txt.includes('类型'),
      count: txt.includes('数量'),
      tickets: txt.includes('票数'),
      respawn: txt.includes('重生'),
      delay: txt.includes('初始延迟'),
      more: txt.includes('查看完整资料'),
    },
    overflowX: document.documentElement.scrollWidth - innerWidth,
  };
})()`

const inViewport = (t, tol = 1) =>
  t.x >= -tol && t.y >= -tol && t.right <= t.vw + tol && t.bottom <= t.vh + tol

async function hoverRow(cdp, idx) {
  const r = await cdp.evaluate(rowRect(idx))
  if (!r) return null
  // 先把指针挪到页角，确保随后移动一定会触发 mouseenter
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 3, y: 3, button: 'none', buttons: 0 })
  await sleep(80)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.cx, y: r.cy, button: 'none', buttons: 0 })
  await sleep(420)
  return r
}

async function runDesktop(cdp, w, h, label) {
  console.log(`\n── ${label} (${w}×${h}) ──`)
  await cdp.viewport(w, h)
  await cdp.navigate(BASE + PAGE, 3800)
  // 首行可能不在首屏（1366 档表格靠下），先滚到视口中央再悬停
  await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-row')]; rows[0] && rows[0].scrollIntoView({ block: 'center' }); return 1 })()`)
  await sleep(320)

  const row = await hoverRow(cdp, 0)
  check(!!row, '找到载具行', row ? '共 ' + row.n + ' 行' : '')

  let tip = await cdp.evaluate(TIP)
  check(!!tip, '浮窗已出现')
  if (tip) {
    const rectTxt = 'rect=(' + num(tip.x) + ',' + num(tip.y) + ') ' + num(tip.w) + 'x' + num(tip.h)
      + ' 视口 ' + tip.vw + 'x' + tip.vh
    check(inViewport(tip), '浮窗整体在视口内', rectTxt)
    const okW = tip.w >= 380 && tip.w <= 421
    check(okW, '宽度 380-420px', '实际 ' + num(tip.w) + 'px')
    check(!!tip.img, '浮窗内渲染载具图')
    if (tip.img) {
      check(tip.img.fit === 'contain', 'object-fit: contain', '实际 ' + tip.img.fit)
      const natR = tip.img.nw / tip.img.nh
      const boxR = tip.img.cw / tip.img.ch
      const err = Math.abs(boxR - natR) / natR * 100
      const ratioTxt = '误差 ' + num(err) + '%（原图 ' + tip.img.nw + 'x' + tip.img.nh + '）'
      check(err < 2, '图片宽高比误差 < 2%（不裁切）', ratioTxt)
    }
    const clickable = await cdp.evaluate(`(() => {
      const t = document.querySelector('.veh-tip').getBoundingClientRect();
      const row = document.querySelectorAll('.veh-row')[0];
      const r = row.getBoundingClientRect();
      const w = Math.min(t.right, r.right) - Math.max(t.left, r.left);
      const h = Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top);
      const overlap = w > 0 && h > 0 ? Math.round(w * h) : 0;
      const hit = document.elementFromPoint(r.left + 12, r.top + r.height / 2);
      return { overlap, pct: Math.round(overlap / (r.width * r.height) * 100), rowClickable: !!(hit && hit.closest('.veh-row')) };
    })()`)
    check(clickable.rowClickable, '行左端仍可点中（浮窗未盖死整行）',
      '重叠 ' + clickable.pct + '% 行面积')

    const missing = Object.entries(tip.has).filter(([, v]) => !v).map(([k]) => k)
    check(!missing.length, '字段齐全（类型/数量/票数/重生/初始延迟/完整资料）', missing.length ? '缺 ' + missing.join(',') : '')
    await cdp.screenshot(`${OUT}/tip-${label}-first.png`)
  }

  // 末行：验证「靠下翻转」
  const last = await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-row')]; return rows.length - 1 })()`)
  await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-row')]; rows[rows.length-1].scrollIntoView({block:'center'}); return 1 })()`)
  await sleep(260)
  await hoverRow(cdp, last)
  const tip2 = await cdp.evaluate(TIP)
  const tip2Info = tip2
    ? 'rect=(' + num(tip2.x) + ',' + num(tip2.y) + ') ' + num(tip2.w) + 'x' + num(tip2.h)
    : '未出现'
  check(!!tip2 && inViewport(tip2), '末行浮窗翻转后仍在视口内', tip2Info)
  if (tip2) await cdp.screenshot(`${OUT}/tip-${label}-last.png`)

  // 点击行 → 详情抽屉（先把首行滚回视口，否则坐标在视口外点不到）
  await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-row')]; rows[0].scrollIntoView({block:'center'}); return 1 })()`)
  await sleep(260)
  const r2 = await hoverRow(cdp, 0)
  if (r2) {
    await cdp.clickAt(r2.cx, r2.cy)
    await sleep(520)
    const sheet = await cdp.evaluate(`(() => {
      const p = document.querySelector('.sheet-panel');
      if (!p) return null;
      const b = p.getBoundingClientRect();
      return { w: b.width, h: b.height, vw: innerWidth, vh: innerHeight, inside: b.x >= -1 && b.right <= innerWidth + 1 && b.y >= -1 && b.bottom <= innerHeight + 1, title: (p.querySelector('.vd-head h3') || {}).textContent || '' };
    })()`)
    check(!!sheet, '点击行打开载具详情抽屉')
    if (sheet) {
      check(sheet.inside, '抽屉在视口内', num(sheet.w) + 'x' + num(sheet.h))
      check(!!sheet.title, '抽屉有载具标题', sheet.title)
    }
    await cdp.screenshot(`${OUT}/sheet-${label}.png`)
    await cdp.evaluate(`document.querySelector('.sheet-close')?.click()`)
    await sleep(320)
  }

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
}

async function runMobile(cdp) {
  const w = 390, h = 844
  console.log(`\n── 移动端 (${w}×${h}) ──`)
  await cdp.viewport(w, h, { mobile: true })
  await cdp.navigate(BASE + PAGE, 3800)
  await sleep(400)

  await cdp.evaluate(`(() => { const rows = [...document.querySelectorAll('.veh-row')]; rows[0].scrollIntoView({block:'center'}); return 1 })()`)
  await sleep(300)
  const r = await cdp.evaluate(rowRect(0))
  check(!!r, '找到载具行（390 档）')
  if (!r) return

  // 触屏：不应出现浮窗，单击直接开抽屉
  await cdp.tapAt(r.cx, r.cy)
  await sleep(650)
  const state = await cdp.evaluate(`(() => {
    const tip = document.querySelector('.veh-tip');
    const p = document.querySelector('.sheet-panel');
    const b = p ? p.getBoundingClientRect() : null;
    return {
      tipShown: !!tip,
      sheetShown: !!p,
      sheet: b ? { w: b.width, h: b.height, inside: b.x >= -1 && b.right <= innerWidth + 1 && b.y >= -1 && b.bottom <= innerHeight + 1 } : null,
      vw: innerWidth, vh: innerHeight,
      overflowX: document.documentElement.scrollWidth - innerWidth,
    };
  })()`)
  check(!state.tipShown, '触屏不弹浮窗')
  check(state.sheetShown, '触屏单击直接打开详情抽屉')
  if (state.sheet) check(state.sheet.inside, '抽屉在视口内', num(state.sheet.w) + 'x' + num(state.sheet.h))
  check(state.overflowX <= 0, '无横向滚动', '溢出 ' + state.overflowX + 'px')
  await cdp.screenshot(`${OUT}/mobile-sheet.png`)

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
}

const cdp = await connect()
try {
  await runDesktop(cdp, 1920, 1080, '1920')
  await runDesktop(cdp, 1366, 768, '1366')
  await runMobile(cdp)
} finally {
  await cdp.close()
}

console.log(`\n${failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过'}（截图：${OUT}）`)
process.exit(failed ? 1 : 0)
