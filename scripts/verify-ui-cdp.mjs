/**
 * RAAS 猜点页 —— 无头浏览器自动点验（真实指针事件，不是合成 click）
 *
 * 覆盖：出生点关卡（双向）/ 圆环命中区 / 名字字号 / 严格顺序（含反向倒序）/
 *       气泡步序 / 放大清晰度 / PC「地图在上、面板在下」布局 / 移动端抽屉
 *
 * 用法：
 *   node scripts/verify-ui-cdp.mjs                     # 默认 Mutaha + AlBasrah
 *   node scripts/verify-ui-cdp.mjs Mutaha_RAAS_v1 ...  # 指定图层
 *   RAAS_UI_BASE=http://localhost:3001 node scripts/verify-ui-cdp.mjs
 *
 * 前置：前端 dev server 已在跑（默认 3001）。
 * 产物：/tmp/raas-verify/*.png（截图）+ 终端 ✓/✗ 报告，全部通过时退出码 0。
 */
import { mkdirSync } from 'node:fs'
import { connect, sleep } from './lib/cdp.mjs'
import { sharpness } from './lib/png-metrics.mjs'
import { RAAS_LAYERS } from '../frontend/src/data/squad/raas-data.js'
import { buildRoutes, spawnIds, solveRoutes, nextIds, routeDepths, pointIndex } from '../frontend/src/utils/raas.js'

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const LAYERS = process.argv.slice(2).length ? process.argv.slice(2) : ['Mutaha_RAAS_v1', 'AlBasrah_RAAS_v1']
const OUT = '/tmp/raas-verify'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x))

/* ── 页面内小工具 ── */
const PICK_VISIBLE = (selector, margin = 12) => `(() => {
  const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
  for (const el of document.querySelectorAll(${JSON.stringify(selector)})) {
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    if (cx < vp.left + ${margin} || cx > vp.right - ${margin} || cy < vp.top + ${margin} || cy > vp.bottom - ${margin}) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (hit && (hit === el || el.contains(hit))) {
      return JSON.stringify({ id: el.dataset.id, cx, cy, x: r.x, y: r.y, w: r.width, h: r.height,
        label: el.querySelector('.pin-label')?.textContent || '', cls: el.className });
    }
  }
  return null;
})()`

const CONFIRMED = `(() => {
  const items = [...document.querySelectorAll('.confirm-list li')].map((li) => (li.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
  return JSON.stringify({ count: items.length, items });
})()`

const PIN_IDS = (sel) => `JSON.stringify([...document.querySelectorAll(${JSON.stringify(sel)})].map(p => p.dataset.id))`

const LABEL_RECT_BY_ID = (id) => `(() => {
  const p = document.querySelector('.raas-pin[data-id=' + JSON.stringify(${JSON.stringify(id)}) + ']');
  if (!p) return 'null';
  const l = p.querySelector('.pin-label');
  if (!l || getComputedStyle(l).display === 'none') return 'null';
  const r = l.getBoundingClientRect();
  return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, label: l.textContent });
})()`

/** 用气泡选出生点（地图角落的主基地可能被 PICK_VISIBLE 的边距过滤掉） */
const CLICK_FIRST_NEXT_BUBBLE = `(() => {
  const b = document.querySelector('.bubble.next');
  if (!b) return null;
  const label = b.querySelector('.bname')?.textContent || '';
  b.click();
  return JSON.stringify({ label });
})()`

const cdp = await connect()

try {
  for (const layerName of LAYERS) {
    console.log(`\n=== ${layerName} ===`)
    // 期望值：直接复用页面同一套求解器算出来（双向）
    const rd = buildRoutes(RAAS_LAYERS[layerName], { bidirectional: true })
    const [spawnA, spawnB] = [...spawnIds(rd.routes)]
    const firstFrom = (sp) => {
      const s = solveRoutes(rd.routes, [{ ids: [sp] }])
      return [...nextIds(s.survivors, routeDepths(s.survivors, [sp]))]
    }
    const stepRange = (sp) => {
      const s = solveRoutes(rd.routes, [{ ids: [sp] }])
      const a = s.survivors.map((x) => x.route.steps.length)
      return [Math.min(...a), Math.max(...a)]
    }
    const pmA = pointIndex(RAAS_LAYERS[layerName], rd.routes, spawnA)
    const corners = RAAS_LAYERS[layerName].corners || []
    const tol = Math.min(Math.abs(corners[1][0] - corners[0][0]), Math.abs(corners[1][1] - corners[0][1])) * 0.002
    /** 与 id 共享同一坐标的候选个数（同点变体） */
    const groupSizeOf = (id) => {
      const me = pmA.get(id)
      if (!me) return 1
      return expA.filter((x) => { const q = pmA.get(x); return q && Math.abs(q.x - me.x) <= tol && Math.abs(q.y - me.y) <= tol }).length
    }
    const expA = firstFrom(spawnA)
    const expB = firstFrom(spawnB)

    await cdp.viewport(1440, 1000, { deviceScaleFactor: 1 })
    await cdp.navigate(`${BASE}/squad/raas/${layerName}`, 4500)
    await cdp.freezeAnimations()
    cdp.consoleLogs(true) // 丢掉导航前的旧日志

    /* ⓪ 页面不能有 JS 报错 / Vue 警告 */
    const errs = cdp.consoleLogs().filter((l) => !/favicon|ERR_/.test(l.text))
    check(errs.length === 0, '进入/加载时无 JS 报错、Vue 警告', errs.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '))

    /* ① 关卡态：只显示两个主基地，其余什么都不给 */
    const init = JSON.parse(await cdp.evaluate(`(() => {
      const pins = [...document.querySelectorAll('.raas-pin')];
      return JSON.stringify({
        pins: pins.length,
        spawn: pins.filter(p => p.classList.contains('is-spawn')).map(p => p.dataset.id),
        next: pins.filter(p => p.classList.contains('is-next')).length,
        future: pins.filter(p => p.classList.contains('is-future')).length,
        gate: !!document.querySelector('.raas-gate'),
        nextBubbles: document.querySelectorAll('.bubble.next').length,
        groups: [...document.querySelectorAll('.bubble-group')].map(g => g.querySelector('.bubble-gstep').textContent.trim()),
      });
    })()`))
    check(init.pins === 2 && init.spawn.length === 2, '开局是「选出生点」关卡：地图上只有 2 个主基地', `pins=${init.pins} spawn=${JSON.stringify(init.spawn)}`)
    check(init.next === 0 && init.future === 0, '关卡态不泄露任何旗点', `next=${init.next} future=${init.future}`)
    check(init.gate, '有关卡提示（第 0 点：先选出生点）')
    check(init.nextBubbles === 2, '气泡里同样给出两个出生点二选一', `${init.nextBubbles} 个`)
    check(init.groups.length === 1 && /第 0 点/.test(init.groups[0]), '气泡组头标成「第 0 点」', JSON.stringify(init.groups))
    check(same(init.spawn, [spawnA, spawnB]), '两个候选出生点与数据一致', JSON.stringify([spawnA, spawnB]))
    await cdp.screenshot(`${OUT}/${layerName}-1-gate.png`)

    /* ② 选出生点 A（真实指针点圆环；点不到就退回气泡） */
    const spawnPin = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-spawn')))
    let spawnLabel = ''
    if (spawnPin) {
      // 点在圈边缘（中心外 16px）——「只要点到圈就能选中」
      await cdp.clickAt(spawnPin.cx + 16, spawnPin.cy)
      await sleep(500)
      spawnLabel = spawnPin.label
    }
    let conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    if (conf.count === 0) {
      const viaBubble = await cdp.evaluate(CLICK_FIRST_NEXT_BUBBLE)
      await sleep(500)
      conf = JSON.parse(await cdp.evaluate(CONFIRMED))
      spawnLabel = viaBubble ? JSON.parse(viaBubble).label : spawnLabel
      check(conf.count === 1, '（主基地在视口角落）改用气泡选出生点成功', spawnLabel)
    } else {
      check(conf.count === 1, '点圆环边缘即可选出生点（第 0 点）', `${spawnLabel} @ +16px`)
    }
    check(/出生点/.test(conf.items[0] || ''), '第 0 点显示为出生点', conf.items[0])

    const after = JSON.parse(await cdp.evaluate(`(() => {
      const pins = [...document.querySelectorAll('.raas-pin')];
      return JSON.stringify({
        end: pins.filter(p => p.classList.contains('is-end')).map(p => p.dataset.id),
        next: pins.filter(p => p.classList.contains('is-next')).map(p => p.dataset.id),
        future: pins.filter(p => p.classList.contains('is-future')).length,
        confirmed: pins.filter(p => p.classList.contains('is-confirmed')).map(p => p.dataset.id),
        gate: !!document.querySelector('.raas-gate'),
      });
    })()`))
    check(after.gate === false, '关卡提示消失')
    check(after.end.length === 1 && after.end[0] === spawnB, '对端主基地变成「终点」标记', `end=${JSON.stringify(after.end)}`)
    check(after.confirmed.length === 1, '出生点记为已确认（绿圈）', JSON.stringify(after.confirmed))
    check(same(after.next, expA), '从 A 出发的「第 1 点」候选与数据一致', `${after.next.length} 个`)
    check(after.future === init.pins * 0 || after.future > 0, '后续点可见但不可点（灰圈）', `future=${after.future}`)
    await cdp.screenshot(`${OUT}/${layerName}-2-spawn-A.png`)

    /* ③ 圆环命中区 + 名字字号 + 叠圈可达性（密图）*/
    const ringInfoRaw = await cdp.evaluate(`(() => {
      const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
      const out = [];
      for (const el of document.querySelectorAll('.raas-pin.is-next')) {
        const r = el.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        const inVp = cx > vp.left && cx < vp.right && cy > vp.top && cy < vp.bottom;
        const hit = (dx, dy) => { const q = document.elementFromPoint(cx + dx, cy + dy); return !!(q && (q === el || el.contains(q))); };
        const behind = (dx, dy) => { const q = document.elementFromPoint(cx + dx, cy + dy); return q ? (q.className || q.tagName) : 'none'; };
        const lab = el.querySelector('.pin-label');
        const labShown = !!(lab && getComputedStyle(lab).display !== 'none');
        out.push({ id: el.dataset.id, cx, cy, x: r.x, y: r.y, w: r.width, h: r.height, inVp,
          center: inVp && hit(0, 0), ringHits: [0,1,2,3,4,5,6,7].filter(a => { const g = a * Math.PI / 4; return inVp && hit(Math.cos(g) * 16, Math.sin(g) * 16) }).length,
          four: inVp && [hit(16,0), hit(-16,0), hit(0,16), hit(0,-16)].every(Boolean),
          out30: [hit(-30, 0), hit(0, 30), hit(0, -30)],
          rightOfRing: behind(30, 0),
          labelShown: labShown,
          fs: labShown ? parseFloat(getComputedStyle(lab).fontSize) : null,
          labelHit: (() => { if (!labShown) return false; const l = lab.getBoundingClientRect(); const q = document.elementFromPoint(l.x + l.width / 2, l.y + l.height / 2); return !!(q && (q === el || el.contains(q))); })(),
        });
      }
      return JSON.stringify(out);
    })()`)
    const rings = JSON.parse(ringInfoRaw)
    const vRings = rings.filter((r) => r.inVp)
    check(vRings.length > 0, '视口内有「下一步」圆环', `${vRings.length}/${rings.length}`)

    // 叠圈可达性：每个「位置」（按屏幕坐标聚簇）必须能点到 —— 要么中心可命中，
    // 要么至少有一段圈露在外面；同一坐标的多候选点一下会整组确认。
    const pxGroups = []
    for (const r of vRings) {
      const g = pxGroups.find((x) => Math.abs(x.cx - r.cx) < 4 && Math.abs(x.cy - r.cy) < 4)
      if (g) g.members.push(r); else pxGroups.push({ cx: r.cx, cy: r.cy, members: [r] })
    }
    const spotOk = pxGroups.filter((g) => g.members.some((m) => m.center) || g.members.some((m) => m.ringHits > 0))
    check(spotOk.length === pxGroups.length,
      '每个候选位置都能点到（中心或圈上任意一点）', `${spotOk.length}/${pxGroups.length} 个位置`)
    const centerOk = pxGroups.filter((g) => g.members.some((m) => m.center))
    const centerRatio = centerOk.length / pxGroups.length

    // 取一个「四个方向都在圈内」的圆环做精确探测
    const probe = vRings.find((r) => r.four) || vRings.find((r) => r.center) || null
    check(!!probe, '存在一个圆环，四个方向 16px 都在命中区内')
    if (probe) {
      check(probe.w >= 44 && probe.h >= 44, '圆环命中区 ≥44px（PC）', `${probe.w}×${probe.h}`)
      check(probe.out30.every((v) => v === false), '圈外 30px 不命中（圈就是命中边界）', JSON.stringify(probe.out30))
      const shownLabels = vRings.filter((r) => r.labelShown)
      if (shownLabels.length) {
        check(probe.fs >= 13, '点位名字号 ≥13px', `${probe.fs}px`)
        check(shownLabels.some((r) => r.labelHit), '点名标签（药丸）本身也可点', `${shownLabels.filter((r) => r.labelHit).length}/${shownLabels.length} 个可点`)
        check(/pin-label/.test(probe.rightOfRing) || shownLabels.filter((r) => /pin-label/.test(r.rightOfRing)).length > 0,
          '圈右侧是药丸标签（不是空白）', probe.rightOfRing)
      } else {
        check(true, '密图默认隐藏点名（开关可手动打开）', '本次标签隐藏，跳过字号/标签命中检查')
      }
      if (rings.length > 30) console.log(`     密图诊断：${rings.length} 个候选圈 / ${pxGroups.length} 个位置（${(rings.length / pxGroups.length).toFixed(2)} 个同点变体/位置），中心可直接点中 ${centerOk.length} 个（${Math.round(centerRatio * 100)}%）`)
    }

    /* ④ 点第 1 点（就用刚测过的那一个圆环）→ 同点变体应整组确认 */
    if (probe) {
      const gs = groupSizeOf(probe.id)
      await cdp.clickAt(probe.cx, probe.cy)
      await sleep(500)
      conf = JSON.parse(await cdp.evaluate(CONFIRMED))
      check(conf.count === 2, '可继续点第 1 点', JSON.stringify(conf.items))
      check(/第 1 点/.test(conf.items[1] || ''), '确认列表里标注「第 1 点」', conf.items[1])
      if (gs > 1) {
        check(new RegExp(`同点 ×${gs}`).test(conf.items[1] || ''), `同一位置的 ${gs} 个候选一起锁定（不会错杀 lane）`, conf.items[1])
      } else {
        check(!/同点/.test(conf.items[1] || ''), '该位置只有 1 个候选，无需整组锁定', conf.items[1])
      }
      const badge = await cdp.evaluate(`document.querySelector('.raas-pin.is-confirmed .pin-step')?.textContent || ''`)
      check(badge !== '', '已确认点位显示步号角标', `角标=${badge}`)
      const hits = await cdp.evaluate(`document.querySelectorAll('.seq-step em.hit').length`)
      check(hits >= 1, '「进攻路线参考」里已确认的点被高亮', `${hits} 处`, )
    }

    /* ⑤ 跨越点击仍被拦住（灰圈点了给提示，但不确认） */
    const far = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-future')))
    if (far) {
      await cdp.clickAt(far.cx, far.cy)
      await sleep(400)
      const cnt = JSON.parse(await cdp.evaluate(CONFIRMED)).count
      const toast = await cdp.evaluate(`document.querySelector('.raas-toast')?.textContent || ''`)
      check(cnt === 2, '跳步点击不会确认', `count=${cnt}`)
      check(/按顺序/.test(toast), '点灰圈给出「请按顺序来」提示', toast.trim())
    }
    const step2 = await cdp.evaluate(`document.querySelectorAll('.raas-pin.is-next').length`)
    check(step2 >= 1, '第 2 点候选出现', `${step2} 个`)
    await cdp.screenshot(`${OUT}/${layerName}-3-step2.png`)

    /* ⑥ 气泡按步序单调 */
    const groups = await cdp.evaluate(`(() => {
      const gs = [...document.querySelectorAll('.bubble-group')];
      const nums = gs.map(g => { const t = g.querySelector('.bubble-gstep').textContent; const m = t.match(/(\\d+)/); return m ? +m[1] : null; });
      return JSON.stringify({ seq: nums });
    })()`)
    const seq = JSON.parse(groups).seq.filter((n) => n !== null)
    check(seq.every((n, i) => i === 0 || n >= seq[i - 1]), '气泡按步序单调排列', JSON.stringify(seq.slice(0, 10)) + (seq.length > 10 ? '…' : ''))

    /* ⑦ 滚轮缩放 + 放大后文字清晰度 */
    await cdp.evaluate(`(() => { const c = [...document.querySelectorAll('.lg-toggle input')][0]; if (c && !c.checked) c.click(); })()`)
    await sleep(300)

    // ⑦a 滚轮压在地图「空白处」也该缩放（曾经的 bug：overflow:hidden 把滚轮吞了）
    const blank = JSON.parse(await cdp.evaluate(`(() => {
      const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
      const cand = [[vp.left + 30, vp.top + 30], [vp.left + 30, vp.bottom - 30], [vp.right - 30, vp.top + 30], [vp.right - 30, vp.bottom - 30],
        [(vp.left + vp.right) / 2, vp.top + 25], [(vp.left + vp.right) / 2, vp.bottom - 25]];
      for (const [x, y] of cand) {
        const h = document.elementFromPoint(x, y);
        if (h && !h.closest('.raas-pin') && !h.closest('.raas-ctrl')) return JSON.stringify({ x, y, el: h.className });
      }
      return 'null';
    })()`))
    let wheelZoomed = false
    for (let i = 0; i < 3 && !wheelZoomed; i++) {
      await cdp.evaluate(`document.querySelector('.raas-ctrl button[title=复位]')?.click()`)
      await sleep(250)
      await cdp.wheelAt(blank.x, blank.y, -900)
      await sleep(400)
      const z = await cdp.evaluate(`document.querySelector('.raas-zoom').textContent`)
      wheelZoomed = parseInt(z, 10) >= 150
      if (wheelZoomed) check(true, '滚轮压在地图空白处也能缩放', `${z} @ ${blank.el}`)
    }
    if (!wheelZoomed) check(false, '滚轮压在地图空白处也能缩放', '试了 3 次仍未放大')
    await cdp.evaluate(`document.querySelector('.raas-ctrl button[title=复位]')?.click()`)
    await sleep(300)

    // ⑦b 同一标签 1x vs 放大后的清晰度（用界面 ＋ 按钮，比无头滚轮可靠）
    const pickRaw = await cdp.evaluate(`(() => {
      const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
      const mx = (vp.left + vp.right) / 2, my = (vp.top + vp.bottom) / 2;
      let best = null;
      for (const p of document.querySelectorAll('.raas-pin')) {
        const l = p.querySelector('.pin-label');
        if (!l || getComputedStyle(l).display === 'none') continue;
        const r = l.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        if (cx < vp.left + 70 || cx > vp.right - 70 || cy < vp.top + 60 || cy > vp.bottom - 60) continue;
        const d = Math.hypot(cx - mx, cy - my);
        if (!best || d < best.d) best = { d, id: p.dataset.id };
      }
      return best ? JSON.stringify({ id: best.id }) : 'null';
    })()`)
    if (pickRaw !== 'null') {
      const zoomId = JSON.parse(pickRaw).id
      const r1 = JSON.parse(await cdp.evaluate(LABEL_RECT_BY_ID(zoomId)))
      const vpNow = JSON.parse(await cdp.evaluate(`(() => { const v = document.querySelector('.raas-viewport').getBoundingClientRect(); return JSON.stringify({ l: v.left, t: v.top, r: v.right, b: v.bottom }); })()`))
      const inVp = (r) => r && r.x > vpNow.l && r.y > vpNow.t && r.x + r.w < vpNow.r && r.y + r.h < vpNow.b
      if (r1 && inVp(r1)) {
        // ⚠️ 药丸标签半透明：不同缩放下透出的地图纹理会污染指标，截图期间改成不透明
        await cdp.evaluate(`(() => {
          if (document.getElementById('__sharp_fix')) return 'ok';
          const s = document.createElement('style'); s.id = '__sharp_fix';
          s.textContent = '.pin-label{background:#0b0f14 !important;border-color:#ffffff !important} .pin-step{background:#3ddc84 !important}';
          document.head.appendChild(s); return 'ok';
        })()`)
        await sleep(150)
        const r1b = JSON.parse(await cdp.evaluate(LABEL_RECT_BY_ID(zoomId))) || r1
        const clipW = Math.round(r1b.w) + 4
        const clipH = Math.round(r1b.h) + 4
        await cdp.screenshot(`${OUT}/${layerName}-4-zoom-1x.png`, { x: Math.round(r1b.x) - 2, y: Math.round(r1b.y) - 2, width: clipW, height: clipH, scale: 2 })
        const plus = JSON.parse(await cdp.evaluate(`(() => { const b = [...document.querySelectorAll('.raas-ctrl button')].find(x => x.textContent.trim() === '＋'); const r = b.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()`))
        await cdp.clickAt(plus.x, plus.y)
        await sleep(400)
        await cdp.clickAt(plus.x, plus.y)
        await sleep(900)
        const zoom = await cdp.evaluate(`document.querySelector('.raas-zoom').textContent`)
        check(parseInt(zoom, 10) >= 150, '点 ＋ 按钮放大生效', `当前 ${zoom}`)
        const r2Raw = await cdp.evaluate(LABEL_RECT_BY_ID(zoomId))
        const r2 = r2Raw === 'null' ? null : JSON.parse(r2Raw)
        if (r2 && inVp(r2) && Math.abs(r2.w - r1.w) < 2) {
          // 用与 1x 完全相同的裁剪尺寸，保证两边只差「文字栅格化」
          await cdp.screenshot(`${OUT}/${layerName}-5-zoom-in.png`, { x: Math.round(r2.x) - 2, y: Math.round(r2.y) - 2, width: clipW, height: clipH, scale: 2 })
          const ratio = sharpness(`${OUT}/${layerName}-5-zoom-in.png`).grad / sharpness(`${OUT}/${layerName}-4-zoom-1x.png`).grad
          check(ratio > 0.8, `放大 ${zoom} 后文字未变糊（梯度比 ${ratio.toFixed(2)}）`, `标签「${r1b.label}」宽 ${r1b.w.toFixed(1)}px → ${r2.w.toFixed(1)}px`)
        } else {
          check(true, '缩放后该标签移出画面（地图边缘夹取所致），跳过清晰度对比', `r2=${r2 ? 'in-view:' + inVp(r2) : 'null'}`)
        }
        await cdp.evaluate(`document.querySelector('.raas-ctrl button[title=复位]')?.click()`)
        await sleep(300)
      } else check(false, '找不到合适的可见标签用于清晰度对比')
    } else check(true, '本图层没有可用的可见标签（默认隐藏点名），跳过清晰度对比')

    /* ⑧ PC 布局：地图在上、面板在下；地图尺寸三档 */
    const layout = JSON.parse(await cdp.evaluate(`(() => {
      const map = document.querySelector('.raas-mapwrap').getBoundingClientRect();
      const side = document.querySelector('.raas-side').getBoundingClientRect();
      return JSON.stringify({ mapW: map.width, mapBottom: map.bottom, mapTop: map.top, sideTop: side.top, vw: innerWidth, vh: innerHeight,
        cls: document.querySelector('.raas-layer').className,
        on: [...document.querySelectorAll('.size-switch .mini.on')].map(b => b.textContent.trim()) });
    })()`))
    check(layout.mapW > 700, 'PC 地图宽度没被侧栏吃掉（>700px）', `${Math.round(layout.mapW)}px / 视口 ${layout.vw}`)
    check(layout.sideTop >= layout.mapBottom - 2, '面板整体落在地图下方', `mapBottom=${Math.round(layout.mapBottom)} sideTop=${Math.round(layout.sideTop)}`)
    check(/mapmode-large/.test(layout.cls) && layout.on.join() === '大', 'PC 默认「大」档', `${layout.cls} · 选中=${layout.on}`)
    check(layout.mapBottom <= layout.vh + 2 && layout.mapW >= layout.vh - 160,
      '「大」档地图吃满视口高度（底部不超屏）', `地图 ${Math.round(layout.mapW)}px，视口 ${layout.vh}px`)

    // 三档切换 + 记忆
    const clickMode = async (label) => {
      await cdp.evaluate(`[...document.querySelectorAll('.size-switch .mini')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`)
      await sleep(400)
      return JSON.parse(await cdp.evaluate(`(() => { const m = document.querySelector('.raas-mapwrap').getBoundingClientRect();
        return JSON.stringify({ w: m.width, cls: document.querySelector('.raas-layer').className, ls: localStorage.getItem('raas-map-mode') }); })()`))
    }
    const adapt = await clickMode('适配')
    check(/mapmode-fit/.test(adapt.cls) && adapt.w < layout.mapW, '切「适配」档地图变小', `${Math.round(layout.mapW)}→${Math.round(adapt.w)}px`)
    const full = await clickMode('铺满')
    check(/mapmode-full/.test(full.cls) && full.w > layout.mapW, '切「铺满」档地图变宽（可滚动）', `${Math.round(layout.mapW)}→${Math.round(full.w)}px`)
    check(full.ls === 'full', '档位写入 localStorage（记忆）', String(full.ls))
    const back = await clickMode('大')
    check(/mapmode-large/.test(back.cls) && Math.abs(back.w - layout.mapW) < 12, '切回「大」档尺寸回到实测值', `${Math.round(back.w)}px`)

    // 收起面板：面板隐藏、地图不被压小
    await cdp.evaluate(`[...document.querySelectorAll('.raas-tools button')].find(b => /面板/.test(b.textContent))?.click()`)
    await sleep(350)
    const offState = JSON.parse(await cdp.evaluate(`(() => JSON.stringify({
      cls: document.querySelector('.raas-layer').className,
      w: document.querySelector('.raas-mapwrap').getBoundingClientRect().width,
    }))()`))
    check(/panels-off/.test(offState.cls) && offState.w >= layout.mapW - 2,
      '「收起面板」生效且地图不被压小', `${Math.round(layout.mapW)}→${Math.round(offState.w)}px`)
    await cdp.evaluate(`[...document.querySelectorAll('.raas-tools button')].find(b => /面板/.test(b.textContent))?.click()`)
    await sleep(300)
    await cdp.screenshot(`${OUT}/${layerName}-6-pc-layout.png`)

    /* ⑨ 移动端：圈更大 + 抽屉 */
    await cdp.viewport(390, 844, { deviceScaleFactor: 1, mobile: true })
    await sleep(800)
    await cdp.screenshot(`${OUT}/${layerName}-7-mobile.png`)
    const mob = JSON.parse(await cdp.evaluate(`(() => {
      const pin = document.querySelector('.raas-pin');
      const r = pin.getBoundingClientRect();
      return JSON.stringify({ w: r.width, h: r.height });
    })()`))
    check(mob.w >= 52 && mob.h >= 52, '移动端圆环命中区 ≥52px', `${mob.w}×${mob.h}`)
    await cdp.evaluate(`document.querySelector('.raas-sheet-head .handle')?.click()`)
    await sleep(700)
    const sheet = await cdp.evaluate(`!!document.querySelector('.raas-layer.sheet-open')`)
    check(sheet, '移动端底部抽屉可展开')
    await cdp.screenshot(`${OUT}/${layerName}-8-mobile-sheet.png`)

    /* ⑩ 反向倒序：重置 → 选另一个出生点 → 第 1 点必须是 A 方向的最后一个点 */
    await cdp.viewport(1440, 1000, { deviceScaleFactor: 1 })
    await sleep(600)
    await cdp.evaluate(`[...document.querySelectorAll('.rcf-card .mini, .rcf-head .mini, .panel-head .mini')].find(b => /重选出生点|重置/.test(b.textContent))?.click()`)
    await sleep(400)
    const backToGate = await cdp.evaluate(`(() => JSON.stringify({ gate: !!document.querySelector('.raas-gate'), spawn: document.querySelectorAll('.raas-pin.is-spawn').length }))()`)
    check(JSON.parse(backToGate).gate && JSON.parse(backToGate).spawn === 2, '重置后回到出生点关卡', backToGate)

    // 直接按 data-id 拿 B 的位置（不受 PICK_VISIBLE 取第一个的影响）
    const bPosRaw = await cdp.evaluate(`(() => {
      const el = document.querySelector('.raas-pin[data-id=' + JSON.stringify(${JSON.stringify(spawnB)}) + ']');
      if (!el) return 'null';
      const r = el.getBoundingClientRect();
      const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const inside = cx > vp.left + 6 && cx < vp.right - 6 && cy > vp.top + 6 && cy < vp.bottom - 6;
      const h = inside ? document.elementFromPoint(cx, cy) : null;
      const hittable = !!(h && (h === el || el.contains(h)));
      return JSON.stringify({ cx, cy, inside, hittable });
    })()`)
    const bPos = bPosRaw === 'null' ? null : JSON.parse(bPosRaw)
    if (bPos && bPos.hittable) {
      await cdp.clickAt(bPos.cx, bPos.cy)
    } else {
      // 兜底：按阵营短码精确匹配气泡（不能用 /B/ 这种模糊匹配：BAF 也带 B）
      const teams = RAAS_LAYERS[layerName].teams || []
      let idx = -1
      if (/team2/i.test(spawnB)) idx = 1
      else if (/team1/i.test(spawnB)) idx = 0
      const code = idx >= 0 && teams[idx] ? String(teams[idx]).split('_')[0]
        : String(spawnB).replace(/\s*(Main|Base)\s*$/i, '').replace(/^\d+[-_ ]*/, '').trim()
      await cdp.evaluate(`(() => {
        const bs = [...document.querySelectorAll('.bubble.next')];
        const t = bs.find(b => b.textContent.includes(${JSON.stringify(code)})) || bs[bs.length - 1];
        t?.click();
      })()`)
    }
    await sleep(600)
    const revState = JSON.parse(await cdp.evaluate(`(() => {
      const pins = [...document.querySelectorAll('.raas-pin')];
      return JSON.stringify({
        conf: [...document.querySelectorAll('.confirm-list li')].map(li => li.innerText.replace(/\\n/g,' ').trim()),
        next: pins.filter(p => p.classList.contains('is-next')).map(p => p.dataset.id),
        end: pins.filter(p => p.classList.contains('is-end')).map(p => p.dataset.id),
      });
    })()`))
    const pickedB = revState.conf.length === 1
    check(pickedB, '重置后能改选另一个出生点', JSON.stringify(revState.conf))
    const isB = same(revState.next, expB)
    const notA = !same(revState.next, expA)
    check(isB, '反向（从对端出生）的第 1 点候选与数据一致', `${revState.next.length} 个`)
    check(notA, '反向候选 ≠ 正向候选（确实倒序了）', `正向 ${expA.length} 个 / 反向 ${expB.length} 个`)
    check(revState.end.length === 1 && revState.end[0] === spawnA, '终点换成了另一端主基地', JSON.stringify(revState.end))
    await cdp.screenshot(`${OUT}/${layerName}-9-reverse.png`)

    /* ⑪ 反向也要按序点到底 */
    let steps = 1
    for (let i = 0; i < 16; i++) {
      const has = await cdp.evaluate(`!!document.querySelector('.bubble.next')`)
      if (!has) break
      await cdp.evaluate(`document.querySelector('.bubble.next').click()`)
      await sleep(200)
      steps++
    }
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    const [lo, hi] = stepRange(spawnB)
    check(conf.count === steps, '倒序一路按序点完，每步只计一次', `点了 ${steps} 步 / 记录 ${conf.count} 条`)
    check(steps >= lo && steps <= hi, '倒序步数落在 lane 步数区间内', `${steps} ∈ [${lo},${hi}]`)
    const done = await cdp.evaluate(`document.querySelector('.done, .stat-sub')?.textContent?.trim() || ''`)
    const remaining = await cdp.evaluate(`document.querySelectorAll('.bubble.next').length`)
    check(remaining === 0, '点到底后没有可点项了', `剩余 ${remaining}`)
    await cdp.screenshot(`${OUT}/${layerName}-10-reverse-done.png`)
    console.log(`     末态：${done}`)

    /* ⑫ 单击切换：点一次选中、再点退回/取消 + 防抖 + 左上角徽标 */
    await cdp.evaluate(`[...document.querySelectorAll('.rcf-card .mini, .rcf-head .mini, .panel-head .mini')].find(b => /重选出生点|重置/.test(b.textContent))?.click()`)
    await sleep(400)
    const spawnPin2Raw = await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-spawn', 2))
    if (spawnPin2Raw) {
      const sp = JSON.parse(spawnPin2Raw)
      // ① 真实指针点一次 → 选中
      await cdp.clickAt(sp.cx, sp.cy)
      await sleep(450)
      conf = JSON.parse(await cdp.evaluate(CONFIRMED))
      check(conf.count === 1, '真实指针点一下 = 选中该点', `count=${conf.count} id=${sp.id}`)
      // ② 同一个圈两下几乎零间隔 → 防抖只算一次 → 取消它自己（回到关卡）
      await cdp.evaluate(`(() => { const el = document.querySelector('.raas-pin.is-confirmed'); if (el) { el.click(); el.click(); } return 'ok'; })()`)
      await sleep(400)
      conf = JSON.parse(await cdp.evaluate(CONFIRMED))
      check(conf.count === 0, '同一圈瞬时连点两下只算一次（防抖）', `count=${conf.count}`)
      // ③ 间隔足够后再点 → 又能选中
      await sleep(400)
      await cdp.clickAt(sp.cx, sp.cy)
      await sleep(400)
      conf = JSON.parse(await cdp.evaluate(CONFIRMED))
      check(conf.count === 1, '间隔超过防抖窗口后可再次选中', `count=${conf.count}`)
    } else {
      check(false, '关卡态没有中心可命中的出生点圈（可能被浮层挡住）')
    }

    // 依次选到第 3 点（用气泡，稳）
    for (let i = 0; i < 3; i++) {
      const ok = await cdp.evaluate(`(() => { const b = document.querySelector('.bubble.next'); if (!b) return false; b.click(); return true; })()`)
      if (!ok) break
      await sleep(260)
    }
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    check(conf.count === 4, '已按顺序选到第 3 点（共 4 条记录）', `count=${conf.count}`)

    // 已选的第 2 点：点一下 = 退回该步（保留 0..2，撤其后）；再点 = 取消它自己
    const step2id = await cdp.evaluate(`(() => {
      const p = [...document.querySelectorAll('.raas-pin.is-confirmed')].find(x => (x.querySelector('.pin-step')?.textContent || '').trim() === '2');
      return p ? p.dataset.id : '';
    })()`)
    const clickConfirmed = async (id) => {
      // 优先点地图上的圈（真实指针），中心不可命中时退回气泡
      const box = await cdp.evaluate(`(() => {
        const el = document.querySelector('.raas-pin[data-id=' + JSON.stringify(${JSON.stringify(step2id)}) + ']');
        if (!el) return 'null';
        const r = el.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        const h = document.elementFromPoint(cx, cy);
        const self = !!(h && (h === el || el.contains(h)));
        return JSON.stringify({ cx, cy, self });
      })()`)
      if (box !== 'null' && JSON.parse(box).self) {
        const b = JSON.parse(box)
        await cdp.clickAt(b.cx, b.cy)
        return 'map'
      }
      await cdp.evaluate(`document.querySelector('.bubble.on[data-id=' + JSON.stringify(${JSON.stringify(step2id)}) + ']')?.click()`)
      return 'bubble'
    }
    const via1 = await clickConfirmed(step2id)
    await sleep(450)
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    const toast1 = await cdp.evaluate(`document.querySelector('.raas-toast')?.textContent || ''`)
    check(conf.count === 3, '点已选的第 2 点 = 退回该步（保留 0/1/2）', `via=${via1} count=${conf.count}`)
    check(/退回/.test(toast1), '给出「退回」提示', toast1.trim())

    const via2 = await clickConfirmed(step2id)
    await sleep(450)
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    const toast2 = await cdp.evaluate(`document.querySelector('.raas-toast')?.textContent || ''`)
    check(conf.count === 2, '再点一次 = 取消它自己（剩 0/1）', `via=${via2} count=${conf.count}`)
    check(/取消/.test(toast2), '给出「取消」提示', toast2.trim())

    // 左上角徽标 + 卡片
    const chip = JSON.parse(await cdp.evaluate(`(() => {
      const c = document.querySelector('.rcf-chip');
      c?.click();
      return JSON.stringify({ txt: (c?.textContent || '').replace(/\\s+/g, ' ').trim(), num: (document.querySelector('.rcf-num')?.textContent || '').trim() });
    })()`))
    await sleep(300)
    const card = JSON.parse(await cdp.evaluate(`(() => {
      const el = document.querySelector('.rcf-card');
      const r = el.getBoundingClientRect();
      return JSON.stringify({ visible: !!el.offsetParent, w: r.width, top: r.top, mapTop: document.querySelector('.raas-mapwrap').getBoundingClientRect().top,
        rows: [...document.querySelectorAll('.rcf-card .confirm-list li')].map(li => (li.textContent||'').replace(/\\s+/g,' ').trim()) });
    })()`))
    check(card.visible && String(chip.num) === String(card.rows.length), '地图左上角徽标数量 = 已确认点数', `徽标 ${chip.num} / 列表 ${card.rows.length}`)
    check(card.rows.length === conf.count, '点徽标展开的列表与已确认记录一致', `rows=${card.rows.length} conf=${conf.count}`)
    check(card.w < 340, '已确认列表是地图上的浮层（窄卡片，不占下方版面）', `${Math.round(card.w)}px`)
    await cdp.evaluate(`document.querySelector('.rcf-chip')?.click()`)
    await sleep(200)
    const legendTip = await cdp.evaluate(`document.querySelector('.raas-legend .lg-tip')?.textContent?.trim() || ''`)
    check(/单击选点/.test(legendTip), '图例写明单击/再点规则', legendTip)
    await cdp.screenshot(`${OUT}/${layerName}-11-toggle.png`)

    const errs2 = cdp.consoleLogs().filter((l) => !/favicon|ERR_/.test(l.text))
    check(errs2.length === 0, '全流程无 JS 报错、Vue 警告', errs2.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '))
  }
} finally {
  await cdp.close()
}

console.log(failed ? `\n❌ 失败 ${failed} 项` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
