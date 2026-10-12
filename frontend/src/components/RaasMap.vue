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

      <!-- 进攻路线连线 -->
      <svg class="raas-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          v-for="(r, i) in lines"
          :key="i"
          :points="r.points"
          fill="none"
          :stroke="r.color"
          stroke-width="1.4"
          :opacity="r.opacity"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <!-- 占领区半径 -->
      <template v-if="showZones">
        <span
          v-for="z in zones"
          :key="'z' + z.id"
          class="raas-zone"
          :class="z.cls"
          :style="{ left: z.u * 100 + '%', top: z.v * 100 + '%', width: z.w * 100 + '%', height: z.h * 100 + '%' }"
        ></span>
      </template>

      <!-- 点位 -->
      <button
        v-for="p in points"
        :key="p.id"
        class="raas-dot"
        :class="p.cls"
        :style="dotStyle(p)"
        :title="p.n"
        @click="onDotClick(p)"
      >
        <span class="dot-core"></span>
        <span class="dot-label" v-show="showLabels">{{ p.n }}</span>
        <span v-if="p.step" class="dot-step">{{ p.step }}</span>
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
import { ref, computed, reactive, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  /** 图层数据（需要 corners 做坐标换算） */
  layer: { type: Object, required: true },
  /** 底图 slug */
  slug: { type: String, required: true },
  /** 点位：[{id,n,x,y,r,cluster,cls,step}] */
  points: { type: Array, default: () => [] },
  /** 路线连线：[{points:'x,y x,y', color, opacity}] */
  lines: { type: Array, default: () => [] },
  showLabels: { type: Boolean, default: true },
  showZones: { type: Boolean, default: false },
  /** 是否允许点击点位 */
  interactive: { type: Boolean, default: true },
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

/* ── 点位：位置固定，尺寸反向缩放（像地图图钉） ── */
function dotStyle(p) {
  return {
    left: p.u * 100 + '%',
    top: p.v * 100 + '%',
    transform: `translate(-50%, -50%) scale(${1 / k.value})`,
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
let lastTap = 0
let capturedId = null

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

  if (pointers.size === 1 && dragBase) {
    const dx = e.clientX - dragBase.x
    const dy = e.clientY - dragBase.y
    moved = Math.max(moved, Math.hypot(dx, dy))
    if (moved > 5) {
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
  pointers.delete(e.pointerId)
  releaseCapture(e.pointerId)
  if (pointers.size < 2) pinchBase = null
  if (pointers.size === 0) {
    dragBase = null
    panning.value = false
    // 触摸端双击 = 缩放切换（dblclick 在部分机型不可靠）
    if (wasTouch && moved < 8) {
      const now = Date.now()
      if (now - lastTap < 300) {
        const rect = viewport.value.getBoundingClientRect()
        const lx = e.clientX - rect.left
        const ly = e.clientY - rect.top
        if (k.value > 1.3) reset()
        else applyZoom(k.value * 2.2, lx, ly)
        lastTap = 0
      } else {
        lastTap = now
      }
    }
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
  const rect = viewport.value.getBoundingClientRect()
  const lx = e.clientX - rect.left
  const ly = e.clientY - rect.top
  if (k.value > 1.3) reset()
  else applyZoom(k.value * 2.2, lx, ly)
}

function onDotClick(p) {
  if (!props.interactive || didPan) return
  emit('point-click', p)
}

/* ── 全屏 ── */
function toggleFull() {
  const el = viewport.value
  if (!document.fullscreenElement) el?.requestFullscreen?.().then(() => { isFull.value = true }).catch(() => {})
  else document.exitFullscreen?.().then(() => { isFull.value = false }).catch(() => {})
}
function onFsChange() { isFull.value = !!document.fullscreenElement }

watch(
  () => props.slug,
  () => { reset(); hiTried = false; hiReady.value = false }
)

if (typeof document !== 'undefined') document.addEventListener('fullscreenchange', onFsChange)
onBeforeUnmount(() => {
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

.raas-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

.raas-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 210, 63, 0.07);
  pointer-events: none;
}
.raas-zone.is-confirmed { border-color: rgba(61, 220, 132, 0.75); background: rgba(61, 220, 132, 0.13); }
.raas-zone.is-possible { border-color: rgba(255, 210, 63, 0.7); background: rgba(255, 210, 63, 0.1); }

.raas-dot {
  position: absolute;
  background: transparent;
  border: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transform-origin: center center;
}
.dot-core {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid rgba(0, 0, 0, 0.55);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  flex: 0 0 auto;
}
.dot-label {
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 3px #000, 0 0 2px #000;
  white-space: nowrap;
  opacity: 0.93;
}
.dot-step {
  font-size: 10px;
  font-weight: 700;
  color: #06210f;
  background: #3ddc84;
  border-radius: 8px;
  padding: 0 5px;
}
.raas-dot.is-confirmed .dot-core { background: #3ddc84; }
.raas-dot.is-possible .dot-core { background: #ffd23f; animation: raas-pulse 1.6s infinite; }

@keyframes raas-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 210, 63, 0.85); }
  50% { box-shadow: 0 0 0 8px rgba(255, 210, 63, 0); }
}

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
}
</style>
