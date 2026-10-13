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
    -->
    <div class="raas-pins">
      <button
        v-for="p in points"
        :key="p.id"
        class="raas-pin"
        :class="[p.cls, { clickable: p.clickable, base: p.base }]"
        :data-id="p.id"
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
  overflow: hidden;
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

/* ── 点位叠加层（不缩放） ── */
.raas-pins {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.raas-pin {
  position: absolute;
  /* 命中区：桌面 28×28 / 移动 34×34，视觉圆点仍是 12px */
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: default;
}
.raas-pin.clickable { cursor: pointer; }

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
  margin-left: 9px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  line-height: 1.2;
  color: #fff;
  text-shadow: 0 1px 3px #000, 0 0 2px #000;
  white-space: nowrap;
  opacity: 0.93;
  /* 标签也算命中区（整条文字都可以点） */
}
.pin-step {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -150%);
  font-size: 10px;
  font-weight: 700;
  color: #06210f;
  background: #3ddc84;
  border-radius: 8px;
  padding: 0 5px;
  pointer-events: none;
}

/* 已确认 */
.raas-pin.is-confirmed .pin-core { background: #3ddc84; }
.raas-pin.is-confirmed .pin-step { display: block; }
/* 下一步可点（脉动） */
.raas-pin.is-next .pin-core { background: #ffd23f; animation: raas-pulse 1.6s infinite; }
.raas-pin.is-next .pin-label { opacity: 1; font-weight: 600; }
/* 后续可能刷新，但还没轮到他（可见不可点） */
.raas-pin.is-future { opacity: 0.42; }
.raas-pin.is-future .pin-core { background: #8b98a8; }
/* 主基地：方形 */
.raas-pin.base .pin-core { border-radius: 3px; background: #22d3ee; }
.raas-pin.base.is-confirmed .pin-core { background: #3ddc84; }
.raas-pin.is-end .pin-core {
  border-radius: 3px;
  background: transparent;
  border: 2px dashed #94a3b8;
  box-shadow: none;
}
.raas-pin.is-end .pin-label { opacity: 0.75; }

@keyframes raas-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 210, 63, 0.85); }
  50% { box-shadow: 0 0 0 8px rgba(255, 210, 63, 0); }
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
  /* 移动端命中区再放大一档 */
  .raas-pin { width: 34px; height: 34px; }
  .pin-label { font-size: 12px; }}
</style>
