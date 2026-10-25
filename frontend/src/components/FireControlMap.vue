<template>
  <div
    class="fc-map"
    ref="wrapEl"
    :class="{ dragging: view.dragging, zoomed: view.k > 1.001 }"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @dblclick.prevent="resetView"
  >
    <!-- 缩放层：底图 / 等高线 / 网格线 / 炮位-目标连线 -->
    <div class="fc-stage" :style="stageStyle">
      <img class="fc-bg" :src="bgSrc" alt="" draggable="false" @load="loaded = true" />
      <img v-if="showContours && contourUrl" class="fc-contours" :src="contourUrl" alt="等高线" draggable="false" />

      <svg v-if="showGrid" class="fc-grid" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line v-for="g in gridLines" :key="g.k" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2"
              :class="g.major ? 'major' : 'minor'" vector-effect="non-scaling-stroke" />
      </svg>

      <svg v-if="src && target" class="fc-line" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line :x1="src.u * 100" :y1="src.v * 100" :x2="target.u * 100" :y2="target.v * 100"
              vector-effect="non-scaling-stroke" />
      </svg>
    </div>

    <!-- 不缩放层：网格文字 / 标记（跟随变换移动，但字号与图标恒定） -->
    <div class="fc-overlay">
      <template v-if="showGrid">
        <span v-for="g in colLabels" :key="'c' + g.i" class="fc-grid-label col"
              :style="overlayStyle(g.u, 0)">{{ g.label }}</span>
        <span v-for="g in rowLabels" :key="'r' + g.i" class="fc-grid-label row"
              :style="overlayStyle(0, g.v)">{{ g.label }}</span>
      </template>

      <div v-if="src" class="fc-marker src" :style="overlayStyle(src.u, src.v, true)">
        <span class="fc-marker-icon">◎</span>
        <span class="fc-marker-label">炮位</span>
      </div>
      <div v-if="target" class="fc-marker target" :style="overlayStyle(target.u, target.v, true)">
        <span class="fc-marker-icon">✕</span>
        <span class="fc-marker-label">目标</span>
      </div>
    </div>

    <div v-if="!src && !target" class="fc-map-hint">点击地图放置炮位，再点一下放置目标</div>
    <div v-if="hoverLabel" class="fc-hover-grid">{{ hoverLabel }}</div>

    <!-- 缩放控件 -->
    <div class="fc-zoom" @pointerdown.stop @dblclick.stop>
      <button type="button" class="fc-zoom-btn" title="放大" aria-label="放大" @click="zoomBy(1.35)">＋</button>
      <button type="button" class="fc-zoom-btn" title="缩小" aria-label="缩小" @click="zoomBy(1 / 1.35)">−</button>
      <button type="button" class="fc-zoom-btn reset" title="复位（100%）" aria-label="复位"
              :disabled="view.k <= 1.001" @click="resetView">⤾</button>
      <span class="fc-zoom-num">{{ Math.round(view.k * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { worldToGrid } from '../utils/squad-grid'

const props = defineProps({
  layer: { type: Object, required: true },
  slug: { type: String, required: true },
  src: { type: Object, default: null },
  target: { type: Object, default: null },
  showGrid: { type: Boolean, default: true },
  showContours: { type: Boolean, default: false },
})

const emit = defineEmits(['pick'])

const MIN_K = 1
const MAX_K = 8
const DRAG_THRESHOLD = 6 // px：超过即判拖拽，不落点

const wrapEl = ref(null)
const loaded = ref(false)
const hoverLabel = ref('')

const bgSrc = computed(() => `/squad-assets/raas/maps/${props.slug}.webp`)
const contourUrl = computed(() => `/squad-assets/contours/${props.slug}.svg`)

/* ── 视口状态：k 缩放 + tx/ty 平移（transform-origin: 0 0）── */
const view = reactive({ k: 1, tx: 0, ty: 0, w: 0, h: 0, dragging: false })

const stageStyle = computed(() => ({
  transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`,
  transformOrigin: '0 0',
}))

function measure() {
  const el = wrapEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  view.w = r.width
  view.h = r.height
  clampPan()
}

/** 平移夹取：任何时候都保证画面铺满视口，不露黑边 */
function clampPan() {
  const minX = view.w - view.w * view.k
  const minY = view.h - view.h * view.k
  view.tx = Math.min(0, Math.max(minX, view.tx))
  view.ty = Math.min(0, Math.max(minY, view.ty))
}

/** 以视口内某点 (px) 为锚点缩放 */
function zoomAt(nextK, ax, ay) {
  const k = Math.min(MAX_K, Math.max(MIN_K, nextK))
  if (Math.abs(k - view.k) < 1e-4) return
  const u = (ax - view.tx) / (view.w * view.k)
  const v = (ay - view.ty) / (view.h * view.k)
  view.k = k
  view.tx = ax - u * view.w * k
  view.ty = ay - v * view.h * k
  if (k <= MIN_K + 1e-3) { view.tx = 0; view.ty = 0 }
  clampPan()
}

function zoomBy(factor) {
  zoomAt(view.k * factor, view.w / 2, view.h / 2)
}

function resetView() {
  view.k = 1
  view.tx = 0
  view.ty = 0
}

function onWheel(e) {
  const el = wrapEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const factor = Math.exp(-e.deltaY * 0.0016)
  zoomAt(view.k * factor, e.clientX - r.left, e.clientY - r.top)
}

/* ── 指针：拖拽平移 / 点击落点 / 双指捏合 ── */
const pointers = new Map()
let dragStart = null
let pinch = null

function localPoint(e) {
  const r = wrapEl.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function onPointerDown(e) {
  if (!wrapEl.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  wrapEl.value.setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, localPoint(e))

  if (pointers.size === 2) {
    // 进入捏合：记录起始距离与中点
    const [a, b] = [...pointers.values()]
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, tx: view.tx, ty: view.ty }
    dragStart = null
    view.dragging = true
    return
  }

  dragStart = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: 0, id: e.pointerId }
  view.dragging = false
}

function onPointerMove(e) {
  const p = pointers.get(e.pointerId)
  if (p) pointers.set(e.pointerId, localPoint(e))

  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    if (dist > 4 && pinch.dist > 4) {
      const nextK = Math.min(MAX_K, Math.max(MIN_K, pinch.k * (dist / pinch.dist)))
      const u = (pinch.mid.x - pinch.tx) / (view.w * pinch.k)
      const v = (pinch.mid.y - pinch.ty) / (view.h * pinch.k)
      view.k = nextK
      view.tx = mid.x - u * view.w * nextK
      view.ty = mid.y - v * view.h * nextK
      clampPan()
    }
    return
  }

  if (dragStart) {
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    dragStart.moved = Math.max(dragStart.moved, Math.hypot(dx, dy))
    if (dragStart.moved > DRAG_THRESHOLD) {
      view.dragging = true
      view.tx = dragStart.tx + dx
      view.ty = dragStart.ty + dy
      clampPan()
    }
  }

  updateHover(e)
}

function onPointerUp(e) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null

  const wasDrag = view.dragging || (dragStart && dragStart.moved > DRAG_THRESHOLD)
  const sameId = dragStart && dragStart.id === e.pointerId
  dragStart = null
  view.dragging = false
  if (!wasDrag && sameId) {
    const p = pointFromEvent(e)
    if (p) emit('pick', p)
  }
}

function onPointerCancel(e) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
  dragStart = null
  view.dragging = false
}

function onPointerLeave() {
  hoverLabel.value = ''
}

/* ── 坐标换算 ── */
const bounds = computed(() => {
  const c = props.layer.corners || []
  if (c.length < 2) return null
  return {
    minX: Math.min(c[0][0], c[1][0]),
    maxX: Math.max(c[0][0], c[1][0]),
    minY: Math.min(c[0][1], c[1][1]),
    maxY: Math.max(c[0][1], c[1][1]),
  }
})

/** 反变换：屏幕点 → 归一化 u/v（0~1），随后统一走 worldToGrid */
function pointFromEvent(e) {
  const el = wrapEl.value
  const b = bounds.value
  if (!el || !b) return null
  const r = el.getBoundingClientRect()
  const u = Math.min(1, Math.max(0, ((e.clientX - r.left) - view.tx) / (r.width * view.k)))
  const v = Math.min(1, Math.max(0, ((e.clientY - r.top) - view.ty) / (r.height * view.k)))
  const x = b.minX + u * (b.maxX - b.minX)
  const y = b.minY + v * (b.maxY - b.minY)
  return { u, v, x, y }
}

function updateHover(e) {
  const p = pointFromEvent(e)
  if (!p) return
  const g = worldToGrid(props.layer, p.x, p.y)
  hoverLabel.value = g ? g.label : ''
}

/* ── 网格（线在缩放层，文字在不缩放层）── */
const GRID_STEP = 30000 // 300m（单位 cm）

const gridLines = computed(() => {
  const b = bounds.value
  if (!b) return []
  const out = []
  const nx = Math.ceil((b.maxX - b.minX) / GRID_STEP)
  const ny = Math.ceil((b.maxY - b.minY) / GRID_STEP)
  for (let i = 1; i < nx; i++) {
    const pct = (i * GRID_STEP) / (b.maxX - b.minX) * 100
    out.push({ k: 'v' + i, x1: pct, y1: 0, x2: pct, y2: 100, major: i % 1 === 0 })
  }
  for (let i = 1; i < ny; i++) {
    const pct = (i * GRID_STEP) / (b.maxY - b.minY) * 100
    out.push({ k: 'h' + i, x1: 0, y1: pct, x2: 100, y2: pct, major: true })
  }
  return out
})

const colLabels = computed(() => {
  const b = bounds.value
  if (!b) return []
  const n = Math.ceil((b.maxX - b.minX) / GRID_STEP)
  const out = []
  for (let i = 0; i < n; i++) out.push({ i, label: String.fromCharCode(65 + i), u: (i + 0.5) / n })
  return out
})

const rowLabels = computed(() => {
  const b = bounds.value
  if (!b) return []
  const n = Math.ceil((b.maxY - b.minY) / GRID_STEP)
  const out = []
  for (let i = 0; i < n; i++) out.push({ i, label: String(i + 1), v: (i + 0.5) / n })
  return out
})

/** 不缩放层定位：把 u/v 换算成当前视口 px */
function overlayStyle(u, v, center = false) {
  const x = view.tx + u * view.w * view.k
  const y = view.ty + v * view.h * view.k
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: center ? 'translate(-50%, -50%)' : 'none',
  }
}

/* ── 生命周期 ── */
let ro = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => measure())
    ro.observe(wrapEl.value)
  }
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
watch(() => props.slug, () => { resetView(); measure() })

defineExpose({ loaded, resetView, zoomBy, zoomAt, view })
</script>

<script>
export default { inheritAttrs: false }
</script>

<style scoped>
.fc-map {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: clip;          /* ⚠️ 不能用 hidden：会变成滚动容器，吃掉滚轮事件 */
  background: #0e1116;
  border: 1px solid var(--sq-border, #2b3440);
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}
.fc-map.dragging { cursor: grabbing; }

.fc-stage {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.fc-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; display: block; pointer-events: none; }
.fc-contours {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: .9;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, .85)) drop-shadow(0 0 1px rgba(0, 0, 0, .8));
}
.fc-grid { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fc-grid line { stroke: rgba(0, 0, 0, .35); stroke-width: 1; }
.fc-grid line.major { stroke: rgba(0, 0, 0, .55); }
.fc-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fc-line line { stroke: #ffd23f; stroke-width: 2; stroke-dasharray: 6 4; }

/* 不缩放层 */
.fc-overlay { position: absolute; inset: 0; pointer-events: none; }
.fc-grid-label {
  position: absolute; transform: translateX(-50%);
  font-size: 9px; font-weight: 700; color: rgba(0, 0, 0, .65);
  background: rgba(255, 255, 255, .35); border-radius: 2px; padding: 0 3px;
  white-space: nowrap;
}
.fc-grid-label.col { top: 2px; }
.fc-grid-label.row { transform: translateY(-50%); margin-left: 2px; }

.fc-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  text-shadow: 0 1px 4px rgba(0, 0, 0, .8);
}
.fc-marker-icon { font-size: 24px; line-height: 1; }
.fc-marker.src .fc-marker-icon { color: #ffd23f; }
.fc-marker.target .fc-marker-icon { color: #ff4d4f; font-size: 22px; }
.fc-marker-label {
  margin-top: 2px; font-size: 10px; color: #fff; background: rgba(0, 0, 0, .55);
  padding: 0 5px; border-radius: 4px;
}

.fc-map-hint {
  position: absolute; left: 50%; top: 12px; transform: translateX(-50%);
  font-size: 12px; color: #fff; background: rgba(0, 0, 0, .55);
  padding: 5px 12px; border-radius: 14px; pointer-events: none;
}
.fc-hover-grid {
  position: absolute; right: 8px; bottom: 8px;
  font-size: 11px; color: #fff; background: rgba(0, 0, 0, .6);
  padding: 3px 8px; border-radius: 6px; pointer-events: none;
}

/* 缩放控件 */
.fc-zoom {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  pointer-events: auto;
}
.fc-zoom-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(12, 16, 22, .72);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(3px);
  transition: background .15s, border-color .15s;
}
.fc-zoom-btn:hover:not(:disabled) { background: rgba(32, 40, 52, .9); border-color: rgba(255, 255, 255, .45); }
.fc-zoom-btn:disabled { opacity: .38; cursor: default; }
.fc-zoom-num {
  font-size: 10px; color: #fff; background: rgba(0, 0, 0, .6);
  padding: 1px 6px; border-radius: 999px; font-variant-numeric: tabular-nums;
}
</style>
