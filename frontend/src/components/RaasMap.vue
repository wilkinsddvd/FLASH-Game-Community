<template>
  <div
    ref="viewport"
    class="raas-viewport"
    :class="{ grabbing: panning, full: isFull }"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @wheel.prevent="onWheel"
    @dblclick.prevent="onDblClick"
  >
    <div class="raas-stage" :style="stageStyle">
      <img class="raas-bg" :src="bgSrc" alt="" draggable="false" @load="bgLoaded = true" />

      <!-- 占领区半径（跟地图缩放） -->
      <template v-if="showZones">
        <span
          v-for="z in zones"
          :key="'z' + z.id"
          class="raas-zone"
          :class="z.cls"
          :style="{ left: z.u * 100 + '%', top: z.v * 100 + '%', width: z.w * 100 + '%', height: z.h * 100 + '%' }"
        ></span>
      </template>
    </div>

    <!--
      点位叠加层：**不参与缩放**。
      位置按 u*W*k+tx 直接算像素，所以放大多少倍文字/图标都是原生清晰度，
      不再靠 scale(1/k) 反向缩放（那会被浏览器先光栅化后放大 → 糊）。
      每个点位的「可见圆环」本身就是命中区（border-radius 决定圆形命中范围）。
    -->
    <div class="raas-pins" :class="{ dense }" :style="{ '--ring-bump': ringBump + 'px' }">
      <button
        v-for="p in points"
        :key="p.id"
        class="raas-pin"
        :class="[p.cls, { clickable: p.clickable, base: p.base }]"
        :data-id="p.id"
        :data-role="p.cls"
        :style="pinStyle(p)"
        :title="p.title"
        type="button"
        @click="onPinClick(p)"
      >
        <span class="pin-core"></span>
        <span class="pin-label" v-show="showLabels || p.base">{{ p.label }}</span>
        <span v-if="p.step" class="pin-step">{{ p.step }}</span>
      </button>
    </div>

    <!-- 缩放控制 -->
    <div class="raas-ctrl" @pointerdown.stop>
      <button type="button" title="放大" @click="zoomBy(1.6)">＋</button>
      <button type="button" title="缩小" @click="zoomBy(1 / 1.6)">－</button>
      <button type="button" title="复位" @click="reset">⤾</button>
      <button type="button" :title="isFull ? '退出全屏' : '全屏'" @click="toggleFull">{{ isFull ? '✕' : '⛶' }}</button>
      <span class="raas-zoom">{{ Math.round(k * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps({
  /** 图层数据（需要 corners 做坐标换算） */
  layer: { type: Object, required: true },
  /** 底图 slug */
  slug: { type: String, required: true },
  /** 点位：[{id,label,u,v,r,cls,step,clickable,base,title}] */
  points: { type: Array, default: () => [] },
  showLabels: { type: Boolean, default: true },
  showZones: { type: Boolean, default: false },
  /** 高清档目录名（为空则不做高清切换） */
  hiDir: { type: String, default: 'hi' },
  hiThreshold: { type: Number, default: 1.8 },
  maxScaleHi: { type: Number, default: 4 },
  maxScaleLo: { type: Number, default: 2.4 },
  /** 点太密时后续点位只留细圈（避免圈套圈盖住地图） */
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['point-click', 'interact'])

const viewport = ref(null)
const bgLoaded = ref(false)
const k = ref(1)
const tx = ref(0)
const ty = ref(0)
const panning = ref(false)
const isFull = ref(false)
const hiReady = ref(false)
const vw = ref(0) // 视口尺寸：点位定位要用
const vh = ref(0)

const loSrc = computed(() => `/squad-assets/raas/maps/${props.slug}.webp`)
const hiSrc = computed(() => `/squad-assets/raas/${props.hiDir}/${props.slug}.webp`)
const bgSrc = computed(() => (hiReady.value ? hiSrc.value : loSrc.value))

const maxScale = computed(() => (hiReady.value ? props.maxScaleHi : props.maxScaleLo))

const stageStyle = computed(() => ({
  transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${k.value})`,
}))

/* 放大后点位散开，圆环跟着放大一点，更好点 */
const ringBump = computed(() => (k.value >= 2.2 ? 8 : k.value >= 1.6 ? 4 : 0))

/* ── 坐标换算 ── */
function bounds() {
  const c = props.layer.corners || []
  if (c.length < 2) return { dw: 1, dh: 1 }
  const dw = Math.abs(c[1][0] - c[0][0]) || 1
  const dh = Math.abs(c[1][1] - c[0][1]) || 1
  return { dw, dh }
}

/* ── 占领区圆圈（跟随地图缩放） ── */
const zones = computed(() => {
  if (!props.showZones) return []
  const { dw, dh } = bounds()
  return props.points
    .filter((p) => p.r > 0)
    .map((p) => ({
      id: p.id, u: p.u, v: p.v,
      w: (p.r * 2) / dw, h: (p.r * 2) / dh, cls: p.cls,
    }))
})

/* ── 点位：贴在叠加层上，尺寸恒定、文字清晰 ── */
function pinStyle(p) {
  return {
    left: `${p.u * vw.value * k.value + tx.value}px`,
    top: `${p.v * vh.value * k.value + ty.value}px`,
  }
}

/* ── 变换夹取：图不飞出视口 ── */
function clampScale(v) {
  return Math.min(maxScale.value, Math.max(1, v))
}
function clampX(v, kk) {
  const el = viewport.value
  if (!el) return v
  const W = el.clientWidth
  return Math.min(0, Math.max(W - kk * W, v))
}
function clampY(v, kk) {
  const el = viewport.value
  if (!el) return v
  const H = el.clientHeight
  return Math.min(0, Math.max(H - kk * H, v))
}

function applyZoom(nk, localX, localY) {
  const el = viewport.value
  if (!el) return
  nk = clampScale(nk)
  const sx = (localX - tx.value) / k.value
  const sy = (localY - ty.value) / k.value
  tx.value = clampX(localX - sx * nk, nk)
  ty.value = clampY(localY - sy * nk, nk)
  k.value = nk
  maybeLoadHi()
}

function zoomBy(f) {
  const el = viewport.value
  if (!el) return
  applyZoom(k.value * f, el.clientWidth / 2, el.clientHeight / 2)
}

function reset() {
  k.value = 1
  tx.value = 0
  ty.value = 0
}

/* ── 高清档按需加载 ── */
let hiTried = false
function maybeLoadHi() {
  if (hiTried || k.value < props.hiThreshold) return
  hiTried = true
  const img = new Image()
  img.onload = () => { hiReady.value = true }
  img.src = hiSrc.value
}

/* ── 指针手势 ── */
const pointers = new Map()
let dragBase = null
let pinchBase = null
let moved = 0
let didPan = false
let lastTap = { t: 0, onPin: false }
let capturedId = null
let downOnPin = false
let prevDownOnPin = false

/** 拖拽判定阈值：手指比鼠标抖得多，分开对待 */
const SLOP_MOUSE = 5
const SLOP_TOUCH = 12
function slopFor(e) { return e && e.pointerType === 'touch' ? SLOP_TOUCH : SLOP_MOUSE }
function isPinTarget(e) { return !!(e.target && e.target.closest && e.target.closest('.raas-pin')) }

// 注意：不在 pointerdown 时立即 setPointerCapture ——
// 捕获会把 click 事件也重定向到容器，导致点位按钮点不动。
// 只在确认是拖拽（位移超阈值）后才捕获。
function capture(id) {
  if (capturedId !== null) return
  try { viewport.value.setPointerCapture?.(id); capturedId = id } catch (_) { /* 忽略 */ }
}
function releaseCapture(id) {
  if (capturedId !== id) return
  try { viewport.value.releasePointerCapture?.(id) } catch (_) { /* 忽略 */ }
  capturedId = null
}

function onDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  downOnPin = isPinTarget(e)
  emit('interact')
  if (pointers.size === 1) {
    dragBase = { x: e.clientX, y: e.clientY, tx: tx.value, ty: ty.value }
    moved = 0
    didPan = false
    panning.value = false
  } else if (pointers.size === 2) {
    capture(e.pointerId)
    panning.value = true
    const [a, b] = [...pointers.values()]
    const rect = viewport.value.getBoundingClientRect()
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    pinchBase = {
      d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      k: k.value,
      sx: (mid.x - rect.left - tx.value) / k.value,
      sy: (mid.y - rect.top - ty.value) / k.value,
    }
    dragBase = null
  }
}

function onMove(e) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const slop = slopFor(e)

  if (pointers.size === 1 && dragBase) {
    const dx = e.clientX - dragBase.x
    const dy = e.clientY - dragBase.y
    moved = Math.max(moved, Math.hypot(dx, dy))
    if (moved > slop) {
      didPan = true
      panning.value = true
      capture(e.pointerId)
    }
    tx.value = clampX(dragBase.tx + dx, k.value)
    ty.value = clampY(dragBase.ty + dy, k.value)
  } else if (pointers.size === 2 && pinchBase) {
    const [a, b] = [...pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const rect = viewport.value.getBoundingClientRect()
    const nk = clampScale(pinchBase.k * (d / pinchBase.d))
    tx.value = clampX(mid.x - rect.left - pinchBase.sx * nk, nk)
    ty.value = clampY(mid.y - rect.top - pinchBase.sy * nk, nk)
    k.value = nk
    didPan = true
    maybeLoadHi()
  }
}

function onUp(e) {
  const wasTouch = e.pointerType === 'touch'
  const slop = slopFor(e)
  const onPin = downOnPin
  pointers.delete(e.pointerId)
  releaseCapture(e.pointerId)
  if (pointers.size < 2) pinchBase = null
  if (pointers.size === 0) {
    dragBase = null
    panning.value = false
    // 触摸端双击 = 缩放切换（dblclick 在部分机型不可靠）
    // ⚠️ 两次点都落在点位上时不算双击，避免连点两个点位时地图乱跳
    if (wasTouch && moved <= slop && !onPin) {
      const now = Date.now()
      if (now - lastTap.t < 320 && !lastTap.onPin) {
        const rect = viewport.value.getBoundingClientRect()
        const lx = e.clientX - rect.left
        const ly = e.clientY - rect.top
        if (k.value > 1.3) reset()
        else applyZoom(k.value * 2.2, lx, ly)
        lastTap = { t: 0, onPin: false }
      } else {
        lastTap = { t: now, onPin }
      }
    } else {
      lastTap = { t: 0, onPin: false }
    }
    prevDownOnPin = onPin
  } else if (pointers.size === 1) {
    const p = [...pointers.values()][0]
    dragBase = { x: p.x, y: p.y, tx: tx.value, ty: ty.value }
  }
}

function onWheel(e) {
  const rect = viewport.value.getBoundingClientRect()
  const factor = Math.exp(-e.deltaY * 0.0015)
  applyZoom(k.value * factor, e.clientX - rect.left, e.clientY - rect.top)
}

function onDblClick(e) {
  // 点位上双击不缩放（避免连点两个点位把地图放大）
  if (downOnPin || prevDownOnPin) return
  const rect = viewport.value.getBoundingClientRect()
  const lx = e.clientX - rect.left
  const ly = e.clientY - rect.top
  if (k.value > 1.3) reset()
  else applyZoom(k.value * 2.2, lx, ly)
}

function onPinClick(p) {
  // 拖拽过的手势不当作点击
  if (didPan) return
  emit('point-click', p)
}

/* ── 视口尺寸（点位定位依赖） ── */
let ro = null
function measure() {
  const el = viewport.value
  if (!el) return
  vw.value = el.clientWidth
  vh.value = el.clientHeight
}

/* ── 全屏 ── */
function toggleFull() {
  const el = viewport.value
  if (!document.fullscreenElement) el?.requestFullscreen?.().then(() => { isFull.value = true; measure() }).catch(() => {})
  else document.exitFullscreen?.().then(() => { isFull.value = false; measure() }).catch(() => {})
}
function onFsChange() { isFull.value = !!document.fullscreenElement; measure() }

watch(
  () => props.slug,
  () => { reset(); hiTried = false; hiReady.value = false; measure() }
)

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    ro = new ResizeObserver(measure)
    ro.observe(viewport.value)
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', measure)
  if (typeof document !== 'undefined') document.addEventListener('fullscreenchange', onFsChange)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  if (typeof window !== 'undefined') window.removeEventListener('resize', measure)
  if (typeof document !== 'undefined') document.removeEventListener('fullscreenchange', onFsChange)
})
</script>

<style scoped>
.raas-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  /* ⚠️ 同样用 clip 不用 hidden：hidden 会形成滚动容器，把滚轮事件吞掉，
     结果是「鼠标压在地图空白处滚轮不缩放，压在点位上才缩放」。 */
  overflow: clip;
  border: 1px solid var(--sq-border);
  border-radius: 10px;
  background: #0e1116;
  touch-action: none;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.raas-viewport.grabbing { cursor: grabbing; }
.raas-viewport.full { aspect-ratio: auto; height: 100vh; border-radius: 0; }

.raas-stage {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
  will-change: transform;
}
.raas-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  pointer-events: none;
}

.raas-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 210, 63, 0.07);
  pointer-events: none;
}
.raas-zone.is-confirmed { border-color: rgba(61, 220, 132, 0.75); background: rgba(61, 220, 132, 0.13); }
.raas-zone.is-next { border-color: rgba(255, 210, 63, 0.7); background: rgba(255, 210, 63, 0.1); }

/* ── 点位叠加层（不缩放） ──
   每个 pin 是一个「可见圆环」：桌面 44px / 移动 52px，圈内整块都是命中区。
   ⚠️ 用 overflow: clip 而不是 hidden —— hidden 会形成滚动容器，
   把落在空白处（没压到点位）的滚轮事件吃掉，导致「鼠标在地图空白处滚轮不缩放」。 */
.raas-pins {
  --ring: 44px;
  --ring-bump: 0px;
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: clip;
}

.raas-pin {
  position: absolute;
  box-sizing: border-box;
  width: calc(var(--ring) + var(--ring-bump));
  height: calc(var(--ring) + var(--ring-bump));
  margin: 0;
  padding: 0;
  border-radius: 50%;
  border: 2px solid rgba(203, 213, 225, 0.5);
  background: rgba(10, 14, 20, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: default;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.raas-pin.clickable { cursor: pointer; }
.raas-pin.clickable:hover { border-color: #fff; background: rgba(255, 255, 255, 0.14); }

/* 叠圈时的命中优先级：可点（下一步/出生点）永远压在最上面，
   否则密图里黄圈可能被困在灰圈下面点不到 */
.raas-pin.is-future { z-index: 2; }
.raas-pin.is-end { z-index: 3; }
.raas-pin.is-confirmed { z-index: 5; }
.raas-pin.is-spawn,
.raas-pin.is-next { z-index: 6; }

.pin-core {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid rgba(0, 0, 0, 0.55);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  flex: 0 0 auto;
}
.pin-label {
  position: absolute;
  left: 50%;
  top: 50%;
  /* 从圈外 6px 起排，别被圈压住 */
  transform: translate(calc((var(--ring) + var(--ring-bump)) / 2 + 6px), -50%);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  padding: 1px 6px;
  border-radius: 6px;
  color: #fff;
  background: rgba(8, 12, 18, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.16);
  text-shadow: 0 1px 3px #000, 0 0 2px #000;
  white-space: nowrap;
  pointer-events: auto;
}
.pin-step {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, calc(-50% - (var(--ring) + var(--ring-bump)) / 2 - 15px));
  font-size: 11px;
  font-weight: 700;
  color: #06210f;
  background: #3ddc84;
  border-radius: 8px;
  padding: 0 6px;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

/* 已确认 */
.raas-pin.is-confirmed { border-color: rgba(61, 220, 132, 0.9); background: rgba(61, 220, 132, 0.16); }
.raas-pin.is-confirmed .pin-core { background: #3ddc84; }
.raas-pin.is-confirmed .pin-label { border-color: rgba(61, 220, 132, 0.5); background: rgba(6, 40, 22, 0.8); }
/* 下一步可点（金色圈 + 脉动） */
.raas-pin.is-next {
  border-color: #ffd23f;
  background: rgba(255, 210, 63, 0.14);
  animation: raas-pulse 1.6s infinite;
}
.raas-pin.is-next .pin-core { background: #ffd23f; }
.raas-pin.is-next .pin-label { border-color: rgba(255, 210, 63, 0.55); background: rgba(46, 36, 4, 0.82); }
/* 出生点待选（青色圈，第 0 步关卡） */
.raas-pin.is-spawn {
  border-color: #22d3ee;
  background: rgba(34, 211, 238, 0.16);
  animation: raas-pulse-cyan 1.6s infinite;
}
.raas-pin.is-spawn .pin-core { background: #22d3ee; }
.raas-pin.is-spawn .pin-label { border-color: rgba(34, 211, 238, 0.6); background: rgba(4, 34, 42, 0.84); }
/* 后续可能刷新，但还没轮到他（可见不可点） */
.raas-pin.is-future { border-color: rgba(139, 152, 168, 0.5); background: rgba(139, 152, 168, 0.06); }
.raas-pin.is-future .pin-core { background: #8b98a8; }
.raas-pin.is-future .pin-label { opacity: 0.7; }
/* 点太密：后续只留细圈，不填充 */
.raas-pins.dense .raas-pin.is-future { border-width: 1px; border-color: rgba(139, 152, 168, 0.28); background: transparent; }
/* 密图即使手动打开点名，标签也不参与命中（免得盖住别家的圈） */
.raas-pins.dense .pin-label { pointer-events: none; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
/* 主基地：方形 */
.raas-pin.base .pin-core { border-radius: 3px; background: #22d3ee; }
.raas-pin.base.is-confirmed .pin-core { background: #3ddc84; }
.raas-pin.is-end { border-style: dashed; border-color: rgba(148, 163, 184, 0.5); background: transparent; }
.raas-pin.is-end .pin-core {
  border-radius: 3px;
  background: transparent;
  border: 2px dashed #94a3b8;
  box-shadow: none;
}
.raas-pin.is-end .pin-label { opacity: 0.75; }

@keyframes raas-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 210, 63, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 210, 63, 0); }
}
@keyframes raas-pulse-cyan {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
}

/* ── 缩放控件 ── */
.raas-ctrl {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: stretch;
  z-index: 5;
}
.raas-ctrl button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 14, 20, 0.72);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(4px);
}
.raas-ctrl button:hover { background: rgba(30, 40, 55, 0.9); }
.raas-zoom {
  text-align: center;
  font-size: 10px;
  color: #cbd5e1;
  background: rgba(10, 14, 20, 0.72);
  border-radius: 6px;
  padding: 3px 0;
}

@media (max-width: 640px) {
  .raas-ctrl button { width: 40px; height: 40px; }
  /* 移动端圈再放大一档（触控目标 ≥52px） */
  .raas-pins { --ring: 52px; }
  .pin-core { width: 14px; height: 14px; }
  .pin-label { font-size: 14px; }
}
</style>
