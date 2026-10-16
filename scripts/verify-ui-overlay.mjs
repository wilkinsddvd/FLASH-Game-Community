/**
 * RAAS 点位页 —— 地图浮层专项点验（无头真实指针）
 *
 * 覆盖（用户 2026-10-16 提的两条 UI 问题）：
 *   1. 三档（适配 / 大 / 铺满）下顶栏按钮**位置对齐**，且**不压在地图上**
 *   2. 图例默认收起（只剩开关 chip），展开时在地图**上方**占一行 → 永远不遮地图
 *   3. 铺满档地图比屏幕高时，地图上的小浮层（缩放控件 / 已确认徽标）钉在可视区（sticky）
 *   4. 浮层不吃点位点击（除刻意浮在地图右上角的缩放控件外，其余零遮挡）
 *   5. 页面无 JS 报错 / Vue 警告
 *
 * 用法：RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-overlay.mjs [图层…]
 * 产物：/tmp/raas-overlay/*.png；全绿退出码 0
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const LAYERS = process.argv.slice(2).length ? process.argv.slice(2) : ['Mutaha_RAAS_v1', 'AlBasrah_RAAS_v1']
const OUT = '/tmp/raas-overlay'
mkdirSync(OUT, { recursive: true })
const MODES = ['fit', 'large', 'full']
const VIEW = { w: 1440, h: 1000 }

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

const PROBE = `(() => {
  const el = (sel) => document.querySelector(sel);
  const rectOf = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), bottom: +b.bottom.toFixed(1), right: +b.right.toFixed(1) }; };
  const r = (sel) => rectOf(el(sel));
  const shown = (sel) => { const e = el(sel); if (!e) return false; return getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 1; };
  const inter = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? Math.round(w * h) : 0; };
  const vp = r('.raas-viewport');
  const bar = r('.raas-bar');
  const topbar = r('.raas-topbar');
  const legend = shown('.raas-legend') ? r('.raas-legend') : null;
  const btns = [...document.querySelectorAll('.size-switch .mini')].map((e) => { const b = e.getBoundingClientRect(); return { t: e.textContent.trim(), x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; });
  const pb = rectOf(el('.raas-tools > button.mini:last-child'));
  const pins = [...document.querySelectorAll('.raas-pin')].map((e) => e.getBoundingClientRect());
  let blocked = 0; const blockers = {};
  for (const pr of pins) {
    const cx = pr.x + pr.width / 2, cy = pr.y + pr.height / 2;
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (hit && !hit.closest('.raas-pin')) {
      blocked++;
      const k = hit.closest('.raas-ctrl-dock') ? 'ctrl' : hit.closest('.raas-legend') ? 'legend' : hit.closest('.raas-confirm-float') ? 'confirm' : hit.closest('.raas-topbar') ? 'topbar' : (hit.className || hit.tagName).toString().slice(0, 40);
      blockers[k] = (blockers[k] || 0) + 1;
    }
  }
  const nonCtrl = blocked - (blockers.ctrl || 0);
  return {
    win: { w: innerWidth, h: innerHeight, scrollH: document.documentElement.scrollHeight, scrollY: Math.round(scrollY) },
    vp, bar, topbar, legend,
    back: r('.raas-bar .raas-back'),
    btns,
    panelsBtn: pb,
    legendChip: r('.lg-chip'),
    ctrl: r('.raas-ctrl'),
    confirm: r('.raas-confirm-float'),
    confirmInBar: !!el('.raas-bar .raas-confirm-float'),
    confirmCardShown: shown('.rcf-card'),
    confirmCard: shown('.rcf-card') ? r('.rcf-card') : null,
    legendShown: shown('.raas-legend'),
    legendItems: document.querySelectorAll('.raas-legend > span').length,
    chips: document.querySelectorAll('.lg-chips .lg-chip, .lg-chips .lg-toggle').length,
    pins: pins.length,
    blocked, blockers, nonCtrl,
    topbarOverlapMap: inter(topbar, vp),
    barOverlapMap: inter(bar, vp),
    legendOverlapMap: inter(legend, vp),
    backOverlapMap: inter(r('.raas-bar .raas-back'), vp),
    panelsOverlapMap: inter(pb, vp),
    modeOverlapMap: Math.max(0, ...btns.map((b) => inter(b, vp))),
    chipOverlapMap: inter(r('.lg-chip'), vp),
    ctrlOverlapMap: inter(r('.raas-ctrl'), vp),
    confirmOverlapMap: inter(r('.raas-confirm-float'), vp),
  };
})()`

const near = (a, b, tol = 2) => a && b && Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol && Math.abs(a.w - b.w) <= tol && Math.abs(a.h - b.h) <= tol
const inView = (r, win) => !!r && r.y >= -1 && r.x >= -1 && r.bottom <= win.h + 1 && r.right <= win.w + 1

const cdp = await connect()
try {
  await cdp.viewport(VIEW.w, VIEW.h)
  for (const layer of LAYERS) {
    console.log(`\n──────── ${layer} ────────`)
    const geo = {}
    for (const mode of MODES) {
      await cdp.navigate(`${BASE}/squad/raas/${layer}`, 2600)
      await cdp.evaluate(`localStorage.setItem('raas-map-mode', ${JSON.stringify(mode)}); localStorage.setItem('raas-legend-open', '0'); location.reload()`)
      await sleep(3400)
      await cdp.freezeAnimations()
      await sleep(300)
      // 先点出生点展开旗点（关卡态只有 2 个青圈，测不出遮挡）
      await cdp.evaluate(`document.querySelector('.raas-pin.is-spawn')?.click()`)
      await sleep(500)
      const d = await cdp.evaluate(PROBE)
      geo[mode] = d
      console.log(`\n  【${mode}】地图 ${d.vp ? Math.round(d.vp.w) + '×' + Math.round(d.vp.h) : '—'} | 页高 ${d.win.scrollH} | 点位数 ${d.pins} | 被挡 ${d.blocked}（非缩放控件 ${d.nonCtrl}）${JSON.stringify(d.blockers)}`)

      // ① 顶栏 / 图例开关都压不到地图
      check(d.topbarOverlapMap === 0, `[${mode}] 顶栏条不压地图`, `overlap=${d.topbarOverlapMap}`)
      check(d.backOverlapMap === 0, `[${mode}]「← 全部地图」不压地图`, `overlap=${d.backOverlapMap}`)
      check(d.panelsOverlapMap === 0, `[${mode}]「收起/展开面板」不压地图`, `overlap=${d.panelsOverlapMap}`)
      check(d.modeOverlapMap === 0, `[${mode}] 档位开关不压地图`, `overlap=${d.modeOverlapMap}`)
      check(d.chipOverlapMap === 0, `[${mode}] 图例开关 chip 不压地图`, `overlap=${d.chipOverlapMap}`)
      // ② 点位不被浮层吃掉（缩放控件是刻意浮在地图右上角的小控件，单独统计）
      check(d.nonCtrl === 0, `[${mode}] 无点位被顶栏/图例/徽标挡住`, `非控件遮挡=${d.nonCtrl}`)
      // ③ 图例默认收起
      check(d.legendShown === false, `[${mode}] 图例默认收起（只剩开关 chip）`)
      check(d.chips === 3, `[${mode}] 图例开关 chip + 两个显示开关都在`, `chips=${d.chips}`)
      check(d.confirmInBar === true, `[${mode}]「已确认点位」徽标在顶栏里（不压地图）`)
      check(d.confirmCardShown === false, `[${mode}]「已确认点位」卡片默认不展开`)
      await cdp.screenshot(`${OUT}/${layer}-${mode}-collapsed.png`)

      // ④ 点开图例 → 在地图上方占一行 + 记 localStorage + 说明项齐全 + 依然不遮地图
      await cdp.evaluate(`document.querySelector('.lg-chip').click()`)
      await sleep(320)
      const open = await cdp.evaluate(PROBE)
      check(open.legendShown === true, `[${mode}] 点击 chip 后图例展开`)
      check(open.legendItems === 7, `[${mode}] 展开后图例项齐全`, `items=${open.legendItems}`)
      check(await cdp.evaluate(`localStorage.getItem('raas-legend-open')`) === '1', `[${mode}] 展开状态写入 localStorage`)
      check(open.legendOverlapMap === 0, `[${mode}] 展开的图例不压地图（在地图上方占行）`, `overlap=${open.legendOverlapMap}`)
      check(open.nonCtrl === 0, `[${mode}] 展开图例后点位仍不被挡`, `非控件遮挡=${open.nonCtrl} ${JSON.stringify(open.blockers)}`)
      check(open.topbar && open.legend && open.legend.y >= open.bar.bottom, `[${mode}] 图例在顶栏下方、地图上方`, `bar=${JSON.stringify(open.bar)} legend=${JSON.stringify(open.legend)}`)
      check(open.legend && open.legend.bottom <= open.vp.y + 1, `[${mode}] 图例在地图上方（不压地图）`, `legendBottom=${open.legend && open.legend.bottom} vpTop=${open.vp && open.vp.y}`)
      await cdp.screenshot(`${OUT}/${layer}-${mode}-expanded.png`)

      // 地图一交互自动收起
      const px = open.vp.x + open.vp.w / 2, py = open.vp.y + open.vp.h / 2
      await cdp.clickAt(px, py)
      await sleep(400)
      const after = await cdp.evaluate(PROBE)
      check(after.legendShown === false, `[${mode}] 地图交互后图例自动收起`)
      check(await cdp.evaluate(`localStorage.getItem('raas-legend-open')`) === '0', `[${mode}] 收起状态写回 localStorage`)

      // ⑤ 铺满档：滚到「地图中部」时，地图上的小浮层仍在可视区内（sticky）
      if (mode === 'full') {
        await cdp.evaluate(`(() => { const v = document.querySelector('.raas-viewport').getBoundingClientRect(); const top = v.bottom + scrollY; window.scrollTo(0, Math.max(0, Math.round(top - innerHeight + 140))) })()`)
        await sleep(450)
        const mid = await cdp.evaluate(PROBE)
        check(mid.win.scrollY > 0, '铺满档页面确实可纵向滚动', `scrollY=${mid.win.scrollY}`)
        check(inView(mid.ctrl, mid.win), '滚到地图中部时「缩放控件」仍在可视区（sticky）', JSON.stringify(mid.ctrl))
        check(mid.confirmInBar === true, '顶栏徽标位置稳定（归属顶栏，不随地图滚动）')
        check(!inView(mid.confirm, mid.win), '徽标随顶栏滚出视口（预期：它不再浮在地图上）', JSON.stringify(mid.confirm))
        check(mid.confirmCardShown === false, '徽标卡片保持收起')
        // 打开卡片：应当弹在顶栏下方、不遮挡地图左侧点位行（卡片是临时浮层）
        await cdp.evaluate(`document.querySelector('.rcf-chip').click()`)
        await sleep(320)
        const card = await cdp.evaluate(PROBE)
        check(card.confirmCardShown === true, '点击徽标后卡片展开')
        check(card.confirmCard && card.confirmCard.y >= card.bar.bottom - 1, '卡片挂在顶栏下方（不遮地图顶部工具）', JSON.stringify(card.confirmCard))
        await cdp.screenshot(`${OUT}/${layer}-full-card.png`)
        await cdp.evaluate(`document.querySelector('.rcf-chip').click()`)
        await sleep(250)
        await cdp.screenshot(`${OUT}/${layer}-full-scrolled.png`)
        await cdp.evaluate(`window.scrollTo(0, 0)`)
        await sleep(300)
      }
    }
    // ⑥ 三档按钮位置逐像素对齐
    const base = geo.fit
    for (const mode of ['large', 'full']) {
      const g = geo[mode]
      check(near(base.back, g.back), `[${mode}]「← 全部地图」与适配档同位`, `fit=${base.back && base.back.x + ',' + base.back.y} ${mode}=${g.back && g.back.x + ',' + g.back.y}`)
      check(near(base.panelsBtn, g.panelsBtn), `[${mode}]「收起面板」与适配档同位`)
      check(near(base.legendChip, g.legendChip), `[${mode}]「图例」chip 与适配档同位`)
      check(near(base.bar, g.bar), `[${mode}] 顶栏整体与适配档同位`)
      check(base.btns.length === g.btns.length && base.btns.every((b, i) => near(b, g.btns[i])), `[${mode}] 档位开关逐个与适配档同位`, `${JSON.stringify(g.btns.map((b) => [b.t, b.x, b.y]))}`)
    }
    // ⑦ 没有新增 JS 报错 / Vue 警告（Admin 路由那个是历史遗留，单独放行）
    const logs = cdp.consoleLogs(true).filter((l) => !/route named "Admin"/.test(l.text))
    check(logs.length === 0, '页面无 JS 报错 / Vue 警告', logs.map((l) => l.type + ': ' + l.text).join(' | ').slice(0, 300))
  }
} finally {
  await cdp.close()
}

console.log(`\n${failed === 0 ? '✅ 全部通过' : '❌ 失败 ' + failed + ' 项'}`)
process.exit(failed === 0 ? 0 : 1)
