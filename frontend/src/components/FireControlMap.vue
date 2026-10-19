<template>
  <div class="fc-map" ref="wrapEl" @click="onClick" @mousemove="onMove" @mouseleave="onLeave">
    <img class="fc-bg" :src="bgSrc" alt="" draggable="false" @load="loaded = true" />
    <img v-if="showContours && contourUrl" class="fc-contours" :src="contourUrl" alt="等高线" />

    <!-- 网格 -->
    <svg v-if="showGrid" class="fc-grid" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line v-for="g in gridLines" :key="g.k" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2"
            :class="g.major ? 'major' : 'minor'" vector-effect="non-scaling-stroke" />
    </svg>
    <div v-if="showGrid" class="fc-grid-labels">
      <span v-for="g in colLabels" :key="'c' + g.i" class="fc-grid-label col" :style="{ left: g.pct + '%' }">{{ g.label }}</span>
      <span v-for="g in rowLabels" :key="'r' + g.i" class="fc-grid-label row" :style="{ top: g.pct + '%' }">{{ g.label }}</span>
    </div>

    <!-- 炮位 → 目标 -->
    <svg v-if="src && target" class="fc-line" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line :x1="src.u * 100" :y1="src.v * 100" :x2="target.u * 100" :y2="target.v * 100"
            vector-effect="non-scaling-stroke" />
    </svg>

    <div v-if="src" class="fc-marker src" :style="markerStyle(src)">
      <span class="fc-marker-icon">◎</span>
      <span class="fc-marker-label">炮位</span>
    </div>
    <div v-if="target" class="fc-marker target" :style="markerStyle(target)">
      <span class="fc-marker-icon">✕</span>
      <span class="fc-marker-label">目标</span>
    </div>

    <div v-if="!src && !target" class="fc-map-hint">点击地图放置炮位，再点一下放置目标</div>
    <div v-if="hoverLabel" class="fc-hover-grid">{{ hoverLabel }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { projectPoint } from '../utils/raas'
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

const wrapEl = ref(null)
const loaded = ref(false)
const hoverLabel = ref('')

const bgSrc = computed(() => `/squad-assets/raas/maps/${props.slug}.webp`)
const contourUrl = computed(() => `/squad-assets/contours/${props.slug}.svg`)

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

const gridLines = computed(() => {
  const b = bounds.value
  if (!b) return []
  const out = []
  const step = 30000 // 300m in cm
  const nx = Math.ceil((b.maxX - b.minX) / step)
  const ny = Math.ceil((b.maxY - b.minY) / step)
  for (let i = 1; i < nx; i++) {
    const pct = (i * step) / (b.maxX - b.minX) * 100
    out.push({ k: 'v' + i, x1: pct, y1: 0, x2: pct, y2: 100, major: i % 1 === 0 })
  }
  for (let i = 1; i < ny; i++) {
    const pct = (i * step) / (b.maxY - b.minY) * 100
    out.push({ k: 'h' + i, x1: 0, y1: pct, x2: 100, y2: pct, major: true })
  }
  return out
})

const colLabels = computed(() => {
  const b = bounds.value
  if (!b) return []
  const n = Math.ceil((b.maxX - b.minX) / 30000)
  const out = []
  for (let i = 0; i < n; i++) {
    const pct = (i + 0.5) / n * 100
    out.push({ i, label: String.fromCharCode(65 + i), pct })
  }
  return out
})

const rowLabels = computed(() => {
  const b = bounds.value
  if (!b) return []
  const n = Math.ceil((b.maxY - b.minY) / 30000)
  const out = []
  for (let i = 0; i < n; i++) {
    const pct = (i + 0.5) / n * 100
    out.push({ i, label: String(i + 1), pct })
  }
  return out
})

function markerStyle(p) {
  return { left: `${p.u * 100}%`, top: `${p.v * 100}%` }
}

function pointFromEvent(e) {
  const el = wrapEl.value
  const b = bounds.value
  if (!el || !b) return null
  const r = el.getBoundingClientRect()
  const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  const v = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
  const x = b.minX + u * (b.maxX - b.minX)
  const y = b.minY + v * (b.maxY - b.minY)
  return { u, v, x, y }
}

function onClick(e) {
  const p = pointFromEvent(e)
  if (!p) return
  emit('pick', p)
}

function onMove(e) {
  const p = pointFromEvent(e)
  if (!p) return
  const g = worldToGrid(props.layer, p.x, p.y)
  hoverLabel.value = g ? g.label : ''
}

function onLeave() { hoverLabel.value = '' }

defineExpose({ loaded })
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
  overflow: hidden;
  background: #0e1116;
  border: 1px solid var(--sq-border, #2b3440);
  cursor: crosshair;
  touch-action: manipulation;
}
.fc-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; display: block; }
.fc-contours {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: .9;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, .85)) drop-shadow(0 0 1px rgba(0, 0, 0, .8));
}
.fc-grid { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fc-grid line { stroke: rgba(0, 0, 0, .35); stroke-width: 1; }
.fc-grid line.major { stroke: rgba(0, 0, 0, .55); }
.fc-grid-labels { position: absolute; inset: 0; pointer-events: none; }
.fc-grid-label {
  position: absolute; font-size: 9px; font-weight: 700; color: rgba(0, 0, 0, .65);
  background: rgba(255, 255, 255, .35); border-radius: 2px; padding: 0 3px;
}
.fc-grid-label.col { top: 2px; transform: translateX(-50%); }
.fc-grid-label.row { left: 2px; transform: translateY(-50%); }
.fc-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fc-line line { stroke: #ffd23f; stroke-width: 2; stroke-dasharray: 6 4; }

.fc-marker {
  position: absolute;
  transform: translate(-50%, -50%);
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
</style>
