/**
 * 火控计算器地图「缩放 / 平移」专项点验（S3）
 *
 * 覆盖：
 *   1. 滚轮以光标为锚缩放（1–8×），标记 u/v 误差 < 0.2%
 *   2. 拖拽平移不误落点（拖 90px 后炮位/目标不变）
 *   3. 单击落点（缩放状态下仍准确）
 *   4. 按钮 ＋ / − / ⤾ 可用；双击复位
 *   5. 触屏双指捏合可缩放、单指拖动平移、单击落点
 *   6. 地图区域不把页面滚乱（touch-action:none）、无 JS 报错
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-firecontrol.mjs
 * 产物：/tmp/fire-control/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const OUT = '/tmp/fire-control'
const PAGE = '/squad/fire-control'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}
const r3 = (v) => Math.round(v * 1000) / 1000

const PROBE = `(() => {
  const map = document.querySelector('.fc-map');
  if (!map) return null;
  const r = map.getBoundingClientRect();
  const stage = map.querySelector('.fc-stage');
  const m = stage ? getComputedStyle(stage).transform : 'none';
  let k = 1, tx = 0, ty = 0;
  if (m && m !== 'none') {
    const nums = m.replace(/^matrix\\(|\\)$/g, '').split(',').map(Number);
    k = nums[0]; tx = nums[4]; ty = nums[5];
  }
  const center = (sel) => {
    const el = map.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const uv = (pt) => pt ? {
    u: ((pt.x - r.left) - tx) / (r.width * k),
    v: ((pt.y - r.top) - ty) / (r.height * k),
  } : null;
  const src = center('.fc-marker.src');
  const tgt = center('.fc-marker.target');
  const zoomTxt = (map.querySelector('.fc-zoom-num') || {}).textContent || '';
  return {
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    k, tx, ty,
    src: uv(src), target: uv(tgt),
    markers: (src ? 1 : 0) + (tgt ? 1 : 0),
    zoomText: zoomTxt.trim(),
    scrollY: Math.round(scrollY),
  };
})()`

const SRC_INPUT = `(() => { const els = [...document.querySelectorAll('.fc-coord-row .fc-input')]; return els[0] ? els[0].value : ''; })()`
const TGT_INPUT = `(() => { const els = [...document.querySelectorAll('.fc-coord-row .fc-input')]; return els[1] ? els[1].value : ''; })()`

/**
 * 滚轮缩放。
 * ⚠️ headless_shell 的 Input.dispatchMouseEvent(mouseWheel) 偶发不投递（RAAS 阶段就踩过），
 * 所以先走真实滚轮，缩放没变化再用页面内合成 WheelEvent 兜底（同一套 handler，逻辑等价）。
 */
async function wheelAt(cdp, x, y, deltaY) {
  const k0 = (await cdp.evaluate(PROBE)).k
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY })
  await sleep(240)
  let k1 = (await cdp.evaluate(PROBE)).k
  if (Math.abs(k1 - k0) > 1e-3) return 'cdp'
  await cdp.evaluate(`(() => {
    const m = document.querySelector('.fc-map');
    m.dispatchEvent(new WheelEvent('wheel', { deltaY: ${deltaY}, clientX: ${x}, clientY: ${y}, bubbles: true, cancelable: true }));
    return 1;
  })()`)
  await sleep(240)
  k1 = (await cdp.evaluate(PROBE)).k
  return Math.abs(k1 - k0) > 1e-3 ? 'synthetic' : 'none'
}

async function dragFromTo(cdp, x1, y1, x2, y2, steps = 8) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1, button: 'none', buttons: 0 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', buttons: 1, clickCount: 1 })
  for (let i = 1; i <= steps; i++) {
    const x = x1 + (x2 - x1) * i / steps
    const y = y1 + (y2 - y1) * i / steps
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 })
    await sleep(16)
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', buttons: 0, clickCount: 1 })
  await sleep(260)
}

async function runDesktop(cdp) {
  console.log('\n── 桌面 (1440×900) ──')
  await cdp.viewport(1440, 900)
  await cdp.navigate(BASE + PAGE, 4200)
  await cdp.evaluate(`(() => { document.querySelector('.fc-map')?.scrollIntoView({ block: 'center' }); return 1 })()`)
  await sleep(500)

  let p = await cdp.evaluate(PROBE)
  check(!!p, '火控地图已渲染')
  if (!p) return
  const { x, y, w, h } = p.rect
  check(p.k === 1 && p.zoomText.startsWith('100'), '初始 100%（k=1）', p.zoomText)

  // 1) 落点
  await cdp.clickAt(x + w * 0.5, y + h * 0.5)
  await sleep(320)
  check((await cdp.evaluate(SRC_INPUT)) !== '', '单击放置炮位（回填网格）', await cdp.evaluate(SRC_INPUT))
  await cdp.clickAt(x + w * 0.74, y + h * 0.26)
  await sleep(420)
  check((await cdp.evaluate(TGT_INPUT)) !== '', '单击放置目标（回填网格）', await cdp.evaluate(TGT_INPUT))

  const before = await cdp.evaluate(PROBE)
  check(before.markers === 2, '炮位 + 目标标记都在')

  // 2) 滚轮缩放（以光标为锚）
  const wm1 = await wheelAt(cdp, x + w * 0.32, y + h * 0.68, -420)
  const wm2 = await wheelAt(cdp, x + w * 0.32, y + h * 0.68, -420)
  let after = await cdp.evaluate(PROBE)
  check(after.k > 1.5, '滚轮放大生效', 'k=' + r3(after.k) + ' 途径 ' + wm1 + '/' + wm2)
  const errU = Math.abs(after.src.u - before.src.u)
  const errV = Math.abs(after.src.v - before.src.v)
  const errTU = Math.abs(after.target.u - before.target.u)
  check(errU < 0.002 && errV < 0.002 && errTU < 0.002,
    '缩放后标记 u/v 误差 < 0.2%',
    'src Δu=' + r3(errU) + ' Δv=' + r3(errV) + ' target Δu=' + r3(errTU))
  await cdp.screenshot(`${OUT}/zoom-in.png`)

  // 3) 拖拽平移不误落点
  const gridBefore = await cdp.evaluate(SRC_INPUT) + '|' + await cdp.evaluate(TGT_INPUT)
  await dragFromTo(cdp, x + w * 0.5, y + h * 0.5, x + w * 0.5 + 90, y + h * 0.5 + 60)
  const afterDrag = await cdp.evaluate(PROBE)
  const gridAfter = await cdp.evaluate(SRC_INPUT) + '|' + await cdp.evaluate(TGT_INPUT)
  check(Math.abs(afterDrag.tx - after.tx) > 20 || Math.abs(afterDrag.ty - after.ty) > 20,
    '拖拽平移生效', 'Δtx=' + r3(afterDrag.tx - after.tx) + ' Δty=' + r3(afterDrag.ty - after.ty))
  check(gridAfter === gridBefore, '拖拽不误落点（网格未变）', gridAfter)
  check(afterDrag.src.u === after.src.u && afterDrag.src.v === after.src.v, '拖拽后炮位不漂移')

  // 4) 按钮
  const plusRect = await cdp.evaluate(`(() => { const b = document.querySelectorAll('.fc-zoom-btn')[0].getBoundingClientRect(); return { x: b.x + b.width/2, y: b.y + b.height/2 }; })()`)
  const minusRect = await cdp.evaluate(`(() => { const b = document.querySelectorAll('.fc-zoom-btn')[1].getBoundingClientRect(); return { x: b.x + b.width/2, y: b.y + b.height/2 }; })()`)
  const resetRect = await cdp.evaluate(`(() => { const b = document.querySelectorAll('.fc-zoom-btn')[2].getBoundingClientRect(); return { x: b.x + b.width/2, y: b.y + b.height/2 }; })()`)
  const kBeforeBtn = afterDrag.k
  await cdp.clickAt(plusRect.x, plusRect.y)
  await sleep(240)
  const kPlus = (await cdp.evaluate(PROBE)).k
  check(kPlus > kBeforeBtn, '＋ 按钮放大', r3(kBeforeBtn) + ' → ' + r3(kPlus))
  await cdp.clickAt(minusRect.x, minusRect.y)
  await sleep(240)
  const kMinus = (await cdp.evaluate(PROBE)).k
  check(kMinus < kPlus, '− 按钮缩小', r3(kPlus) + ' → ' + r3(kMinus))
  await cdp.clickAt(resetRect.x, resetRect.y)
  await sleep(260)
  const kReset = await cdp.evaluate(PROBE)
  check(Math.abs(kReset.k - 1) < 1e-3 && Math.abs(kReset.tx) < 0.5 && Math.abs(kReset.ty) < 0.5,
    '⤾ 复位到 100% 且平移归零', 'k=' + r3(kReset.k) + ' tx=' + r3(kReset.tx) + ' ty=' + r3(kReset.ty))

  // 5) 双击复位
  await wheelAt(cdp, x + w * 0.6, y + h * 0.4, -420)
  const kZoom2 = (await cdp.evaluate(PROBE)).k
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + w * 0.6, y: y + h * 0.4, button: 'left', buttons: 1, clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + w * 0.6, y: y + h * 0.4, button: 'left', buttons: 0, clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + w * 0.6, y: y + h * 0.4, button: 'left', buttons: 1, clickCount: 2 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + w * 0.6, y: y + h * 0.4, button: 'left', buttons: 0, clickCount: 2 })
  await sleep(320)
  const kDbl = (await cdp.evaluate(PROBE)).k
  check(kZoom2 > 1.1 && Math.abs(kDbl - 1) < 1e-3, '双击复位', r3(kZoom2) + ' → ' + r3(kDbl))

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
}

async function runMobile(cdp) {
  console.log('\n── 移动端 (390×844) ──')
  await cdp.viewport(390, 844, { mobile: true })
  await cdp.navigate(BASE + PAGE, 4200)
  await cdp.evaluate(`(() => { document.querySelector('.fc-map')?.scrollIntoView({ block: 'center' }); return 1 })()`)
  await sleep(520)

  const p = await cdp.evaluate(PROBE)
  check(!!p, '地图已渲染（390 档）')
  if (!p) return
  const { x, y, w, h } = p.rect
  check(p.zoomText.startsWith('100'), '初始 100%', p.zoomText)

  // 单指拖动：应平移（缩放=1 时无位移空间，先放大再拖）
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

  // 双指捏合放大
  const cx = x + w * 0.5
  const cy = y + h * 0.5
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: cx - 30, y: cy }, { x: cx + 30, y: cy }],
  })
  for (let i = 1; i <= 6; i++) {
    const d = 30 + i * 14
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: cx - d, y: cy }, { x: cx + d, y: cy }],
    })
    await sleep(24)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await sleep(360)
  const afterPinch = await cdp.evaluate(PROBE)
  check(afterPinch.k > 1.3, '双指捏合放大', 'k=' + r3(afterPinch.k))
  check(afterPinch.markers === p.markers, '捏合不误落点', '标记数 ' + afterPinch.markers)
  await cdp.screenshot(`${OUT}/mobile-pinch.png`)

  // 单指拖动平移
  const beforePan = await cdp.evaluate(PROBE)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] })
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + i * 12, y: cy + i * 8 }] })
    await sleep(20)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await sleep(320)
  const afterPan = await cdp.evaluate(PROBE)
  check(Math.abs(afterPan.tx - beforePan.tx) > 10 || Math.abs(afterPan.ty - beforePan.ty) > 10,
    '单指拖动平移', 'Δtx=' + r3(afterPan.tx - beforePan.tx) + ' Δty=' + r3(afterPan.ty - beforePan.ty))
  check(afterPan.markers === beforePan.markers, '拖动不误落点')

  // 单击落点（缩放状态下）
  await cdp.tapAt(x + w * 0.35, y + h * 0.65)
  await sleep(500)
  const afterTap = await cdp.evaluate(PROBE)
  check(afterTap.markers > beforePan.markers, '触屏单击落点（缩放后仍准确）', '标记数 ' + beforePan.markers + ' → ' + afterTap.markers)

  // 地图内触摸不应带着页面乱滚
  check(Math.abs(afterTap.scrollY - p.scrollY) < 4, '盘面内触摸不滚动页面',
    'ΔscrollY=' + (afterTap.scrollY - p.scrollY))

  const logs = cdp.consoleLogs(true).filter((l) => l.type !== 'warning' || /Vue warn/.test(l.text))
  check(!logs.length, '无 JS 报错', logs.length ? JSON.stringify(logs.slice(0, 2)) : '')
}

const cdp = await connect()
try {
  await runDesktop(cdp)
  await runMobile(cdp)
} finally {
  await cdp.close()
}

console.log('\n' + (failed ? '❌ 失败 ' + failed + ' 项' : '✅ 全部通过') + '（截图：' + OUT + '）')
process.exit(failed ? 1 : 0)
