<template>
  <div class="fc-page">
    <div class="fc-hero">
      <div class="fc-hero-title">
        <span class="fc-logo">🎯</span>
        <div>
          <h1>火控计算器</h1>
          <p>选地图 · 点炮位/目标或输入网格坐标 · 自动高程 · 直接出密位/角度</p>
        </div>
      </div>
      <div class="fc-hero-meta">
        <span>🗺️ {{ maps.length }} 张地图</span>
        <span>📐 6400 密位制</span>
      </div>
    </div>

    <div class="fc-controls card-like">
      <div class="fc-field">
        <label>地图</label>
        <select v-model="mapKey" class="fc-select">
          <option v-for="m in maps" :key="m.key" :value="m.key">{{ m.name }}</option>
        </select>
      </div>
      <div class="fc-field">
        <label>武器</label>
        <select v-model="weaponId" class="fc-select">
          <option v-for="w in WEAPONS" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </div>
      <div v-if="weapon.shells.length > 1" class="fc-field">
        <label>弹种</label>
        <select v-model.number="shellIndex" class="fc-select">
          <option v-for="(s, i) in weapon.shells" :key="s.name" :value="i">{{ s.name }}</option>
        </select>
      </div>
      <div class="fc-field">
        <label>显示单位</label>
        <select v-model="displayUnit" class="fc-select">
          <option value="mil">密位</option>
          <option value="deg">度</option>
        </select>
      </div>
      <div class="fc-field fc-check">
        <label><input type="checkbox" v-model="showContours" /> 主图叠加等高线</label>
      </div>
    </div>

    <div class="fc-layout">
      <div class="fc-map-col">
        <FireControlMap
          :layer="layer"
          :slug="currentMap.slug"
          :src="src"
          :target="target"
          :show-contours="showContours"
          @pick="onPick"
        />

        <div class="fc-map-actions">
          <button class="fc-btn" :class="{ on: pickMode === 'src' }" @click="startPick('src')">重选炮位</button>
          <button class="fc-btn" :class="{ on: pickMode === 'target' }" @click="startPick('target')">重选目标</button>
          <button class="fc-btn" @click="clearAll">清空</button>
          <span class="fc-pick-hint">
            {{ !src ? '点击地图放置炮位' : (!target ? '再点一下放置目标' : '点击地图移动目标') }}
          </span>
        </div>

        <div class="fc-coords">
          <div class="fc-coord-row">
            <span class="fc-coord-label">炮位</span>
            <input v-model="srcGrid" class="fc-input" placeholder="如 D4-6-3" @keyup.enter="applyGrid('src')" @blur="applyGrid('src')" />
            <span class="fc-elev">{{ srcHeight !== null ? `${srcHeight.toFixed(1)} m` : '高程 —' }}</span>
          </div>
          <div class="fc-coord-row">
            <span class="fc-coord-label">目标</span>
            <input v-model="targetGrid" class="fc-input" placeholder="如 D4-6-3" @keyup.enter="applyGrid('target')" @blur="applyGrid('target')" />
            <span class="fc-elev">{{ targetHeight !== null ? `${targetHeight.toFixed(1)} m` : '高程 —' }}</span>
          </div>
          <div class="fc-height-row">
            <label class="fc-check"><input type="checkbox" v-model="useAutoHeight" /> 自动高程</label>
            <label v-if="!useAutoHeight" class="fc-manual">
              手动高差
              <input v-model.number="manualHeight" type="number" step="0.5" class="fc-input sm" /> m
            </label>
            <span class="fc-hint">行 0=北，网格 300m/格；点击地图会自动回填</span>
          </div>
          <div v-if="gridError" class="fc-err">{{ gridError }}</div>
          <div v-if="heightmapError" class="fc-err">{{ heightmapError }}</div>
        </div>
      </div>

      <aside id="fc-result" class="fc-result">
        <div class="fc-result-head">
          <span>射击诸元</span>
          <button class="fc-copy" :disabled="!solution || !solution.inRange" @click="copyResult">复制</button>
        </div>

        <template v-if="solution">
          <div v-if="!solution.inRange" class="fc-alert">{{ solution.reason }}</div>
          <div class="fc-result-grid">
            <div class="fc-metric primary">
              <div class="fc-metric-label">仰角</div>
              <div class="fc-metric-value">{{ solution.primary ? formatAngle(solution.primary.deg, displayUnit) : '—' }}</div>
              <div class="fc-metric-sub" v-if="solution.primary">{{ displayUnit === 'mil' ? `${solution.primary.deg.toFixed(2)}°` : `${Math.round(solution.primary.mil)} mil` }}</div>
            </div>
            <div class="fc-metric">
              <div class="fc-metric-label">距离</div>
              <div class="fc-metric-value">{{ formatDistance(solution.dist) }}</div>
            </div>
            <div class="fc-metric">
              <div class="fc-metric-label">方位角</div>
              <div class="fc-metric-value">{{ formatAngle(solution.bearing, displayUnit) }}</div>
            </div>
            <div class="fc-metric">
              <div class="fc-metric-label">飞行时间</div>
              <div class="fc-metric-value">{{ solution.primary ? formatTime(solution.primary.tof) : '—' }}</div>
            </div>
            <div class="fc-metric">
              <div class="fc-metric-label">高差</div>
              <div class="fc-metric-value">{{ solution.hDiff >= 0 ? '+' : '' }}{{ solution.hDiff.toFixed(1) }} m</div>
              <div class="fc-metric-sub">{{ solution.autoHeight && useAutoHeight ? '自动高程' : '手动高差' }}</div>
            </div>
            <div class="fc-metric">
              <div class="fc-metric-label">最大射程</div>
              <div class="fc-metric-value">{{ formatDistance(solution.maxRange) }}</div>
            </div>
          </div>

          <div v-if="solution.low && solution.high" class="fc-branches">
            <div class="fc-branch" :class="{ on: solution.primary === solution.low }">
              <span>低伸</span>
              <b>{{ solution.low.valid ? formatAngle(solution.low.deg, displayUnit) : '射界外' }}</b>
            </div>
            <div class="fc-branch" :class="{ on: solution.primary === solution.high }">
              <span>高抛</span>
              <b>{{ solution.high.valid ? formatAngle(solution.high.deg, displayUnit) : '射界外' }}</b>
            </div>
          </div>

          <div class="fc-status">
            <span v-if="solution.belowMin" class="bad">低于最小射距 {{ Math.round(solution.minDistance) }} m</span>
            <span v-else-if="solution.inRange" class="ok">✅ 在射界内</span>
            <span v-if="!useAutoHeight" class="warn">未计地形（手动高差）</span>
          </div>
        </template>
        <div v-else class="fc-empty">先选择炮位和目标</div>
      </aside>
    </div>

    <!-- 移动端底部射击诸元摘要：不遮挡地图，点「详情」跳到完整面板 -->
    <div class="fc-mobile-bar">
      <template v-if="solution && solution.inRange">
        <div class="fc-mb-item">
          <span>仰角</span>
          <b>{{ formatAngle(solution.primary.deg, displayUnit) }}</b>
        </div>
        <div class="fc-mb-item">
          <span>距离</span>
          <b>{{ formatDistance(solution.dist) }}</b>
        </div>
        <div class="fc-mb-item">
          <span>方位</span>
          <b>{{ formatAngle(solution.bearing, displayUnit) }}</b>
        </div>
      </template>
      <div v-else class="fc-mb-empty">
        {{ solution && !solution.inRange ? solution.reason : '先选炮位和目标' }}
      </div>
      <button class="fc-mb-more" type="button" @click="goResult">详情</button>
    </div>

    <!-- 等高线图 -->
    <section class="fc-contour-card">
      <div class="fc-contour-head">
        <h2>等高线图 · {{ currentMap.name }}</h2>
        <div class="fc-contour-meta">
          <span>等高距 {{ contourMeta ? contourMeta.interval : '—' }} m</span>
          <span v-if="contourMeta">{{ contourMeta.min }} ~ {{ contourMeta.max }} m</span>
          <span>与自动高程同一套 500×500 数据</span>
        </div>
      </div>
      <div class="fc-contour-box">
        <img class="fc-contour-bg" :src="`/squad-assets/raas/maps/${currentMap.slug}.webp`" alt="" />
        <img v-if="contourMeta" class="fc-contour-lines" :src="`/squad-assets/contours/${currentMap.slug}.svg`" alt="等高线" />
        <div v-else class="fc-contour-missing">该地图暂无等高线数据</div>
      </div>
      <div class="fc-contour-legend">
        <span><i class="line minor"></i> 等高线</span>
        <span><i class="line major"></i> 每 5 条加粗 / 标注高程</span>
        <span>高程单位：米（海拔）</span>
      </div>
    </section>

    <p class="fc-footnote">
      高程数据来源：squadcalc.app（500×500）· 弹道参数来源：squadmaps-v2（MIT）·
      结果基于理想弹道与地图高程，实战请结合地形与校射。
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FireControlMap from '../components/FireControlMap.vue'
import { RAAS_MAPS, RAAS_LAYERS } from '../data/squad/raas-data'
import { HEIGHTMAPS } from '../data/squad/heightmaps-meta'
import { CONTOURS } from '../data/squad/contours-meta'
import { WEAPONS, getWeapon } from '../data/squad/weapons'
import {
  solveFiringSolution, decodeHeightmap, sampleHeight,
  formatAngle, formatDistance, formatTime,
} from '../utils/fire-control'
import { gridToWorld, worldToGrid } from '../utils/squad-grid'
import { projectPoint } from '../utils/raas'

const maps = RAAS_MAPS.map((m) => {
  const layer = RAAS_LAYERS[m.layers[0]]
  return { ...m, layer }
}).filter((m) => m.layer)

const mapKey = ref(maps[0]?.key || '')
const currentMap = computed(() => maps.find((m) => m.key === mapKey.value) || maps[0])
const layer = computed(() => currentMap.value.layer)
const contourMeta = computed(() => CONTOURS[mapKey.value] || null)

const weaponId = ref('mortar')
const weapon = computed(() => getWeapon(weaponId.value))
const shellIndex = ref(0)
const displayUnit = ref('mil')
watch(weapon, (w) => {
  shellIndex.value = 0
  displayUnit.value = w.unit
}, { immediate: true })

const showContours = ref(false)
const pickMode = ref('src')
const src = ref(null)
const target = ref(null)
const srcGrid = ref('')
const targetGrid = ref('')
const gridError = ref('')

const useAutoHeight = ref(true)
const manualHeight = ref(0)
const heightmap = ref(null)
const heightmapError = ref('')

const heightCache = new Map()

async function loadHeightmap() {
  const meta = HEIGHTMAPS[mapKey.value]
  heightmap.value = null
  heightmapError.value = ''
  if (!meta) {
    heightmapError.value = '该地图暂无高程数据'
    return
  }
  if (heightCache.has(meta.slug)) {
    heightmap.value = heightCache.get(meta.slug)
    return
  }
  try {
    const res = await fetch(`/squad-assets/heightmaps/${meta.slug}.bin`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const hm = decodeHeightmap(await res.arrayBuffer(), meta)
    heightCache.set(meta.slug, hm)
    heightmap.value = hm
  } catch (e) {
    heightmapError.value = '高程加载失败，可手动输入高差'
  }
}

const srcHeight = computed(() => {
  if (!src.value || !heightmap.value || !layer.value) return null
  return sampleHeight(layer.value, heightmap.value, src.value.x, src.value.y)
})
const targetHeight = computed(() => {
  if (!target.value || !heightmap.value || !layer.value) return null
  return sampleHeight(layer.value, heightmap.value, target.value.x, target.value.y)
})

const solution = computed(() => {
  if (!src.value || !target.value || !layer.value) return null
  return solveFiringSolution({
    weapon: weapon.value,
    shellIndex: shellIndex.value,
    src: src.value,
    target: target.value,
    zSrc: srcHeight.value,
    zTarget: targetHeight.value,
    manualHeight: useAutoHeight.value ? null : (Number(manualHeight.value) || 0),
  })
})

function pointWithGrid(p) {
  const g = worldToGrid(layer.value, p.x, p.y)
  return { ...p, grid: g ? g.label : '' }
}

function onPick(p) {
  gridError.value = ''
  const point = pointWithGrid(p)
  if (pickMode.value === 'src' || !src.value) {
    src.value = point
    srcGrid.value = point.grid
    pickMode.value = 'target'
  } else {
    target.value = point
    targetGrid.value = point.grid
  }
}

function startPick(which) {
  pickMode.value = which
  if (which === 'src') {
    src.value = null
    target.value = null
    srcGrid.value = ''
    targetGrid.value = ''
  }
}

function applyGrid(which) {
  const text = String(which === 'src' ? srcGrid.value : targetGrid.value).trim()
  if (!text) return
  const g = gridToWorld(layer.value, text)
  if (!g) {
    gridError.value = `无效网格坐标：${text}`
    return
  }
  gridError.value = ''
  const { u, v } = projectPoint(layer.value, g.x, g.y)
  const point = { x: g.x, y: g.y, u, v, grid: g.label }
  if (which === 'src') {
    src.value = point
    srcGrid.value = g.label
    if (pickMode.value === 'src') pickMode.value = 'target'
  } else {
    target.value = point
    targetGrid.value = g.label
  }
}

function clearAll() {
  src.value = null
  target.value = null
  srcGrid.value = ''
  targetGrid.value = ''
  pickMode.value = 'src'
  gridError.value = ''
}

function copyResult() {
    const s = solution.value
    if (!s || !s.inRange) return
  const text = [
    `地图：${currentMap.value.name}`,
    `武器：${weapon.value.name}`,
    `炮位：${srcGrid.value}`,
    `目标：${targetGrid.value}`,
    `距离：${Math.round(s.dist)} m`,
    `方位：${formatAngle(s.bearing, displayUnit.value)}`,
    `仰角：${formatAngle(s.primary.deg, displayUnit.value)}`,
    `飞行时间：${s.primary.tof.toFixed(1)} s`,
    `高差：${s.hDiff >= 0 ? '+' : ''}${s.hDiff.toFixed(1)} m`,
  ].join('\n')
  navigator.clipboard?.writeText(text)
}

function goResult() {
  const el = document.getElementById('fc-result')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(mapKey, () => {
  clearAll()
  loadHeightmap()
})
onMounted(loadHeightmap)
</script>

<style scoped>
.fc-page { padding: 20px 0 40px; }

.fc-hero {
  display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;
  background: var(--sq-hero-grad); border: 1px solid var(--sq-border);
  border-radius: 12px; padding: 22px 26px; margin-bottom: 16px;
}
.fc-hero-title { display: flex; align-items: center; gap: 16px; }
.fc-logo { font-size: 34px; }
.fc-hero h1 { margin: 0; font-size: 22px; color: var(--sq-hero-text); letter-spacing: .5px; }
.fc-hero p { margin: 4px 0 0; font-size: 13px; color: var(--sq-hero-sub); }
.fc-hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.fc-hero-meta span {
  font-size: 12px; color: var(--sq-text-2); background: var(--sq-meta-bg);
  border: 1px solid var(--sq-meta-border); border-radius: 14px; padding: 4px 12px;
}

.card-like { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; }
.fc-controls {
  display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end;
  padding: 14px 16px; margin-bottom: 14px;
}
.fc-field { display: flex; flex-direction: column; gap: 5px; }
.fc-field label { font-size: 11.5px; color: var(--sq-text-3); }
.fc-select, .fc-input {
  font-size: 13px; padding: 7px 10px; border-radius: 7px;
  border: 1px solid var(--sq-border); background: var(--sq-input); color: var(--sq-text);
  outline: none; min-width: 150px;
}
.fc-select:focus, .fc-input:focus { border-color: var(--sq-accent); }
.fc-input.sm { min-width: 70px; width: 80px; }
.fc-check { flex-direction: row; align-items: center; gap: 6px; font-size: 12.5px; color: var(--sq-text-2); padding-bottom: 7px; }
.fc-check input { accent-color: var(--sq-accent); }

.fc-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
.fc-map-col { min-width: 0; }
.fc-map-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 10px 0; }
.fc-btn {
  font-size: 12px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
  border: 1px solid var(--sq-border-strong); background: var(--sq-card); color: var(--sq-text-2);
}
.fc-btn:hover { border-color: var(--sq-accent); color: var(--sq-text); }
.fc-btn.on { background: var(--sq-accent-bg); border-color: var(--sq-accent-border); color: #fff; }
.fc-pick-hint { font-size: 12px; color: var(--sq-text-3); }

.fc-coords { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 10px; padding: 12px 14px; }
.fc-coord-row { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.fc-coord-label { width: 34px; font-size: 12px; color: var(--sq-text-2); }
.fc-coord-row .fc-input { flex: 1; }
.fc-elev { width: 90px; text-align: right; font-size: 11.5px; color: var(--sq-text-3); }
.fc-height-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; font-size: 12px; color: var(--sq-text-2); }
.fc-manual { display: flex; align-items: center; gap: 6px; }
.fc-hint { font-size: 11px; color: var(--sq-text-3); }
.fc-err { margin-top: 6px; font-size: 11.5px; color: #ff8a8a; }

.fc-result { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; padding: 14px 16px; position: sticky; top: 84px; }
.fc-result-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: var(--sq-text); margin-bottom: 12px; }
.fc-copy { font-size: 11px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--sq-border-strong); background: transparent; color: var(--sq-text-2); cursor: pointer; }
.fc-copy:disabled { opacity: .4; cursor: default; }
.fc-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fc-metric { background: var(--sq-card-alt); border-radius: 8px; padding: 9px 10px; }
.fc-metric.primary { grid-column: span 2; background: var(--sq-accent-bg); border: 1px solid var(--sq-accent-border); }
.fc-metric-label { font-size: 10.5px; color: var(--sq-text-3); }
.fc-metric-value { margin-top: 3px; font-size: 17px; font-weight: 800; color: var(--sq-text); }
.fc-metric.primary .fc-metric-value { font-size: 26px; color: #fff; }
.fc-metric-sub { margin-top: 2px; font-size: 10.5px; color: var(--sq-text-3); }
.fc-metric.primary .fc-metric-sub { color: rgba(255,255,255,.8); }
.fc-branches { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.fc-branch { border: 1px solid var(--sq-border); border-radius: 7px; padding: 6px 9px; font-size: 11px; color: var(--sq-text-3); display: flex; justify-content: space-between; }
.fc-branch b { color: var(--sq-text-2); }
.fc-branch.on { border-color: var(--sq-accent); background: var(--sq-hover); }
.fc-status { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 11.5px; }
.fc-status .ok { color: #3ddc84; }
.fc-status .bad { color: #ff6b6b; }
.fc-status .warn { color: #f0a04b; }
.fc-alert { margin-bottom: 10px; padding: 8px 10px; border-radius: 7px; background: rgba(255,77,79,.12); border: 1px solid rgba(255,77,79,.4); color: #ff8a8a; font-size: 12px; }
.fc-empty { color: var(--sq-text-3); font-size: 13px; padding: 30px 0; text-align: center; }

.fc-contour-card { margin-top: 22px; background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; padding: 16px 18px; }
.fc-contour-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: baseline; margin-bottom: 12px; }
.fc-contour-head h2 { margin: 0; font-size: 16px; color: var(--sq-text); }
.fc-contour-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11.5px; color: var(--sq-text-3); }
.fc-contour-box { position: relative; width: 100%; max-width: 900px; margin: 0 auto; aspect-ratio: 1 / 1; border-radius: 10px; overflow: hidden; background: #0e1116; border: 1px solid var(--sq-border); }
.fc-contour-bg, .fc-contour-lines { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
.fc-contour-lines {
  opacity: .95;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, .85)) drop-shadow(0 0 1px rgba(0, 0, 0, .8));
}
.fc-contour-missing { position: absolute; inset: 0; display: grid; place-items: center; color: var(--sq-text-3); font-size: 13px; }
.fc-contour-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 11.5px; color: var(--sq-text-3); }
.fc-contour-legend .line { display: inline-block; width: 18px; height: 0; border-top: 1px solid #888; margin-right: 5px; vertical-align: middle; }
.fc-contour-legend .line.major { border-top-width: 2px; border-color: #333; }

.fc-footnote { margin-top: 24px; font-size: 11.5px; color: var(--sq-text-3); line-height: 1.8; }

/* 移动端底部摘要条（桌面隐藏） */
.fc-mobile-bar { display: none; }

@media (max-width: 980px) {
  .fc-layout { grid-template-columns: 1fr; }
  .fc-result { position: static; }
  .fc-page { padding-bottom: 96px; }
  .fc-mobile-bar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 80;
    align-items: center;
    gap: 14px;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    background: var(--sq-card);
    border-top: 1px solid var(--sq-border);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, .18);
  }
  .fc-mb-item { display: flex; flex-direction: column; min-width: 0; }
  .fc-mb-item span { font-size: 10px; color: var(--sq-text-3); }
  .fc-mb-item b { font-size: 15px; color: var(--sq-text); white-space: nowrap; }
  .fc-mb-empty { flex: 1; min-width: 0; font-size: 12px; color: var(--sq-text-3); }
  .fc-mb-more {
    margin-left: auto;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid var(--sq-accent-border);
    background: var(--sq-accent-bg);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
  }
}
@media (max-width: 640px) {
  .fc-page { padding: 14px 12px 96px; }
  .fc-hero { padding: 16px; }
  .fc-hero h1 { font-size: 18px; }
  .fc-controls { padding: 12px; }
  .fc-field, .fc-select { width: 100%; }
  .fc-coord-row { flex-wrap: wrap; }
  .fc-elev { width: auto; }
  .fc-result-grid { grid-template-columns: 1fr; }
  .fc-metric.primary { grid-column: span 1; }
  .fc-contour-card { padding: 12px; }
}
</style>
