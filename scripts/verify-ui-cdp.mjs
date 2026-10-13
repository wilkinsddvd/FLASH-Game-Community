/**
 * RAAS 猜点页 —— 无头浏览器自动点验（真实指针事件，不是合成 click）
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

const BASE = process.env.RAAS_UI_BASE || 'http://localhost:3001'
const LAYERS = process.argv.slice(2).length ? process.argv.slice(2) : ['Mutaha_RAAS_v1', 'AlBasrah_RAAS_v1']
const OUT = '/tmp/raas-verify'
mkdirSync(OUT, { recursive: true })

let failed = 0
const check = (ok, label, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`)
  if (!ok) failed++
}

/* ── 页面内小工具 ── */
const PICK_VISIBLE = (selector) => `(() => {
  const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
  for (const el of document.querySelectorAll(${JSON.stringify(selector)})) {
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    if (cx < vp.left + 12 || cx > vp.right - 12 || cy < vp.top + 12 || cy > vp.bottom - 12) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (hit && (hit === el || el.contains(hit))) {
      return JSON.stringify({ id: el.dataset.id, cx, cy, x: r.x, y: r.y, w: r.width, h: r.height,
        label: el.querySelector('.pin-label')?.textContent || '', cls: el.className });
    }
  }
  return null;
})()`

const CONFIRMED = `(() => {
  const raw = document.querySelector('.raas-stat') ? null : null;
  const items = [...document.querySelectorAll('.confirm-list li')].map((li) => li.innerText.replace(/\\n/g, ' ').trim());
  const badge = document.querySelector('.raas-title .badge:nth-of-type(1)');
  return JSON.stringify({ count: items.length, items });
})()`

const LABEL_RECT = `(() => {
  const vp = document.querySelector('.raas-viewport').getBoundingClientRect();
  for (const p of document.querySelectorAll('.raas-pin')) {
    const l = p.querySelector('.pin-label');
    if (!l || l.offsetParent === null) continue;
    const r = l.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    if (cx < vp.left + 40 || cx > vp.right - 40 || cy < vp.top + 30 || cy > vp.bottom - 30) continue;
    if (document.elementFromPoint(cx, cy) !== l && !p.contains(document.elementFromPoint(cx, cy))) continue;
    return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height, cx, cy, label: l.textContent });
  }
  return null;
})()`

const cdp = await connect()

try {
  for (const layerName of LAYERS) {
    console.log(`\n=== ${layerName} ===`)
    await cdp.viewport(1440, 1000, { deviceScaleFactor: 1 })
    await cdp.navigate(`${BASE}/squad/raas/${layerName}`, 4000)
    await cdp.freezeAnimations()

    // ① 初始态：只有出生点可点
    const init = JSON.parse(await cdp.evaluate(`(() => {
      const pins = [...document.querySelectorAll('.raas-pin')];
      return JSON.stringify({
        pins: pins.length,
        next: pins.filter(p => p.classList.contains('is-next')).map(p => p.dataset.id),
        future: pins.filter(p => p.classList.contains('is-future')).length,
        end: pins.filter(p => p.classList.contains('is-end')).length,
        nextBubbles: document.querySelectorAll('.bubble.next').length,
        groups: [...document.querySelectorAll('.bubble-group')].map(g => g.querySelector('.bubble-gstep').textContent.trim()),
      });
    })()`))
    check(init.pins > 0, '点位已渲染', `共 ${init.pins} 个`)
    check(init.next.length === 1 && /Main|^0/.test(init.next[0]), '开局只有出生点可点（第 0 步）', `next=${JSON.stringify(init.next)}`)
    check(init.future === init.pins - init.next.length - init.end, '其余点位为「可见不可点」', `future=${init.future} end=${init.end}`)
    check(init.end >= 1, '终点标记存在', `end=${init.end}`)
    await cdp.screenshot(`${OUT}/${layerName}-1-initial.png`)

    // ② 跨越点击应被拦住
    const futurePin = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-future')))
    if (futurePin) {
      await cdp.clickAt(futurePin.cx, futurePin.cy)
      await sleep(400)
      const after = JSON.parse(await cdp.evaluate(CONFIRMED))
      const toast = await cdp.evaluate(`document.querySelector('.raas-toast')?.textContent || ''`)
      check(after.count === 0, '跨越点击无效（未确认任何点）')
      check(/按顺序/.test(toast), '给出「按顺序」提示', toast.trim())
    } else {
      check(false, '没找到可测的 is-future 点位（数据异常？）')
    }

    // ③ 命中区：点位周围 10px 也应命中（盒子 28×28）
    const pinBox = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-next')))
    if (pinBox) {
      const probe = JSON.parse(await cdp.evaluate(`(() => {
        const el = document.querySelector('.raas-pin[data-id=' + JSON.stringify(${JSON.stringify(pinBox.id)}) + ']');
        const r = el.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        const pts = { left: [cx - 10, cy], right: [cx + 10, cy], up: [cx, cy - 10], down: [cx, cy + 10] };
        const out = {};
        for (const [k, [x, y]] of Object.entries(pts)) {
          const hit = document.elementFromPoint(x, y);
          out[k] = !!(hit && (hit === el || el.contains(hit)));
        }
        return JSON.stringify({ box: { w: r.width, h: r.height }, ...out });
      })()`))
      check(probe.box.w >= 28 && probe.box.h >= 28, '命中盒 ≥28px', JSON.stringify(probe.box))
      check(probe.left && probe.right && probe.up && probe.down, '四周 10px 偏移仍可命中', JSON.stringify(probe))
    }

    // ④ 按顺序点：出生点 → 第 1 步
    const base = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-next')))
    await cdp.clickAt(base.cx, base.cy)
    await sleep(500)
    let conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    check(conf.count === 1, '点了出生点后计入第 0 步', JSON.stringify(conf.items))
    check(/出生点/.test(conf.items[0] || ''), '第 0 步显示为出生点', conf.items[0])

    const step1 = JSON.parse(await cdp.evaluate(`(() => {
      const pins = [...document.querySelectorAll('.raas-pin.is-next')];
      const out = pins.map(p => ({ id: p.dataset.id, label: p.querySelector('.pin-label')?.textContent || '' }));
      return JSON.stringify(out);
    })()`))
    check(step1.length >= 1, '第 1 步候选出现', `${step1.length} 个: ${step1.map((s) => s.label).join('/')}`)
    check(step1.every((s) => !/^[A-Z]{0,2}\d+[-_ ]/.test(s.label) && !/[a-z][A-Z]/.test(s.label)),
      '点位名已去掉 A1/A2 前缀且驼峰已拆', step1.map((s) => s.label).join(' / '))

    const p1 = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-next')))
    await cdp.clickAt(p1.cx, p1.cy)
    await sleep(500)
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    check(conf.count === 2, '可继续点第 1 步', JSON.stringify(conf.items))

    // ⑤ 点完第 1 步后，第 2 步候选出现；跨到第 3 步仍被拦
    const step2 = await cdp.evaluate(`document.querySelectorAll('.raas-pin.is-next').length`)
    check(step2 >= 1, '第 2 步候选出现', `${step2} 个`)
    const far = JSON.parse(await cdp.evaluate(PICK_VISIBLE('.raas-pin.is-future')))
    if (far) {
      await cdp.clickAt(far.cx, far.cy)
      await sleep(400)
      const after = JSON.parse(await cdp.evaluate(CONFIRMED))
      check(after.count === 2, '跳到更后面的步无效', `count=${after.count}`)
    }

    // ⑥ 撤销：末尾 ✕ 退一步
    await cdp.evaluate(`document.querySelectorAll('.confirm-list .mini')[document.querySelectorAll('.confirm-list .mini').length - 1].click()`)
    await sleep(400)
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    check(conf.count === 1, '末尾 ✕ 撤销一步', `count=${conf.count}`)

    // ⑦ 气泡按步序排列
    const groups = await cdp.evaluate(`(() => {
      const gs = [...document.querySelectorAll('.bubble-group')];
      const nums = gs.map(g => { const t = g.querySelector('.bubble-gstep').textContent; const m = t.match(/(\\d+)/); return m ? +m[1] : null; });
      return JSON.stringify({ seq: nums, first: gs[0]?.querySelector('.bubble-gname')?.textContent || '' });
    })()`)
    const seq = JSON.parse(groups).seq.filter((n) => n !== null)
    const sorted = seq.every((n, i) => i === 0 || n >= seq[i - 1])
    check(sorted, '气泡按步序单调排列', JSON.stringify(seq.slice(0, 10)) + (seq.length > 10 ? '…' : ''))

    // ⑧ 放大后文字清晰度（同一标签区域 1x vs 放大后对比）
    const r1 = JSON.parse(await cdp.evaluate(LABEL_RECT))
    if (r1) {
      await cdp.screenshot(`${OUT}/${layerName}-2-zoom-1x.png`, { x: r1.x - 3, y: r1.y - 3, width: r1.w + 6, height: r1.h + 6, scale: 2 })
      await cdp.wheelAt(r1.cx, r1.cy, -900)
      await sleep(300)
      await cdp.wheelAt(r1.cx, r1.cy, -900)
      await sleep(900)
      const zoom = await cdp.evaluate(`document.querySelector('.raas-zoom').textContent`)
      const r2 = JSON.parse(await cdp.evaluate(LABEL_RECT))
      if (r2) {
        await cdp.screenshot(`${OUT}/${layerName}-3-zoom-in.png`, { x: r2.x - 3, y: r2.y - 3, width: r2.w + 6, height: r2.h + 6, scale: 2 })
        const s1 = sharpness(`${OUT}/${layerName}-2-zoom-1x.png`)
        const s2 = sharpness(`${OUT}/${layerName}-3-zoom-in.png`)
        const ratio = s2.grad / s1.grad
        check(ratio > 0.85, `放大 ${zoom} 后文字未变糊（梯度比 ${ratio.toFixed(2)}）`, `1x grad=${s1.grad.toFixed(1)} → ${s2.grad.toFixed(1)}`)
        await cdp.screenshot(`${OUT}/${layerName}-4-zoomed-full.png`)
      } else {
        check(false, '放大后找不到标签用于对比')
      }
    } else {
      check(false, '找不到可见标签用于清晰度对比')
    }

    // ⑨ 移动端：抽屉 + 命中区
    await cdp.viewport(390, 844, { deviceScaleFactor: 1, mobile: true })
    await sleep(800)
    await cdp.screenshot(`${OUT}/${layerName}-5-mobile.png`)
    await cdp.evaluate(`document.querySelector('.raas-sheet-head .handle')?.click()`)
    await sleep(700)
    await cdp.screenshot(`${OUT}/${layerName}-6-mobile-sheet.png`)
    const mob = JSON.parse(await cdp.evaluate(`(() => {
      const pin = document.querySelector('.raas-pin');
      const r = pin.getBoundingClientRect();
      return JSON.stringify({ w: r.width, h: r.height, sheet: !!document.querySelector('.raas-layer.sheet-open') });
    })()`))
    check(mob.w >= 34 && mob.h >= 34, '移动端命中盒 ≥34px', JSON.stringify(mob))
    check(mob.sheet, '移动端底部抽屉可展开')

    // ⑩ 端到端：重置后按顺序一路点到底（走气泡，避开图上标签遮挡的干扰）
    await cdp.viewport(1440, 1000, { deviceScaleFactor: 1 })
    await sleep(500)
    await cdp.evaluate(`[...document.querySelectorAll('.panel-head .mini')].find(b => b.textContent.includes('重置'))?.click()`)
    await sleep(400)
    let steps = 0
    for (let i = 0; i < 14; i++) {
      const has = await cdp.evaluate(`!!document.querySelector('.bubble.next')`)
      if (!has) break
      await cdp.evaluate(`document.querySelector('.bubble.next').click()`)
      await sleep(220)
      steps++
    }
    conf = JSON.parse(await cdp.evaluate(CONFIRMED))
    check(steps > 1 && conf.count === steps, '一路按顺序点到底且每步只计一次', `点了 ${steps} 步 / 记录 ${conf.count} 条`)
    const doneMsg = await cdp.evaluate(`document.querySelector('.stat-sub, .done')?.textContent?.trim() || ''`)
    const remaining = await cdp.evaluate(`document.querySelectorAll('.bubble.next').length`)
    check(remaining === 0 && /完毕/.test(doneMsg), '走到底后提示「点位已确认完毕」', doneMsg)
    await cdp.screenshot(`${OUT}/${layerName}-7-walkthrough.png`)
  }
} finally {
  await cdp.close()
}

console.log(failed ? `\n❌ 失败 ${failed} 项` : '\n✅ 全部通过')
process.exit(failed ? 1 : 0)
