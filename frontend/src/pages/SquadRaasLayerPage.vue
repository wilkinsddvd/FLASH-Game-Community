<template>
  <div class="raas-layer" v-if="layer">
    <!-- 顶部信息条 -->
    <div class="raas-bar">
      <RouterLink to="/squad/raas" class="raas-back">← 全部地图</RouterLink>
      <div class="raas-title">
        <span class="raas-map-name">{{ mapName }}</span>
        <span class="raas-layer-name">{{ layer.ver.toUpperCase() }}</span>
        <span v-if="layer.community" class="badge cl">社区层</span>
        <span class="badge">{{ layer.size }}</span>
        <span class="badge">{{ routes.length }} 条路线</span>
      </div>
      <div class="raas-tabs">
        <button :class="{ on: mode === 'view' }" @click="mode = 'view'">路线查看</button>
        <button :class="{ on: mode === 'tool' }" @click="mode = 'tool'">猜点工具</button>
      </div>
    </div>

    <div class="raas-layout">
      <!-- 地图 -->
      <div class="raas-mapwrap">
        <div class="raas-map" :style="{ backgroundImage: `url(${mapUrl})` }">
          <!-- 路线连线（查看模式或高亮某条 lane） -->
          <svg class="raas-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline v-for="(r, i) in drawnRoutes" :key="i"
                      :points="r.points" :stroke="r.color" :stroke-width="0.35"
                      fill="none" :opacity="r.opacity" vector-effect="non-scaling-stroke" />
          </svg>

          <!-- 点位 -->
          <button v-for="p in renderedPoints" :key="p.id"
                  class="raas-dot" :class="p.cls"
                  :style="{ left: p.u * 100 + '%', top: p.v * 100 + '%' }"
                  :title="`${p.n} · ${p.cluster}`"
                  @click="onDotClick(p)">
            <span class="dot-core"></span>
            <span class="dot-label" v-show="showLabels">{{ p.n }}</span>
            <span v-if="p.step" class="dot-step">{{ p.step }}</span>
          </button>
        </div>

        <div class="raas-legend">
          <span><i class="lg confirm"></i>已确认</span>
          <span><i class="lg possible"></i>可能刷新</span>
          <span><i class="lg covered"></i>不会刷新（已覆盖）</span>
          <span><i class="lg dim"></i>非当前路线</span>
          <label class="lg-toggle">
            <input type="checkbox" v-model="showLabels" /> 显示点位名
          </label>
        </div>
      </div>

      <!-- 侧栏 -->
      <aside class="raas-side">
        <!-- 猜点工具面板 -->
        <template v-if="mode === 'tool'">
          <div class="panel">
            <div class="panel-head">
              <span>已确认点位（{{ confirmed.length }}）</span>
              <button v-if="confirmed.length" class="mini" @click="reset">重置</button>
            </div>
            <div v-if="!confirmed.length" class="panel-hint">
              点击地图上的点位，或从下方列表选择「当前已知的点位」，工具会自动覆盖掉不可能再刷新的点。
            </div>
            <ol v-else class="confirm-list">
              <li v-for="(id, i) in confirmed" :key="id">
                <span class="idx">{{ i + 1 }}</span>
                <span class="cname">{{ pointMap.get(id)?.n || id }}</span>
                <button class="mini" @click="unconfirm(id)">✕</button>
              </li>
            </ol>
          </div>

          <div class="panel">
            <div class="panel-head"><span>路线状态</span></div>
            <div class="stat-row">
              <b :class="{ bad: solved.impossible }">{{ solved.alive }}</b> / {{ solved.total }} 条路线仍然成立
            </div>
            <div v-if="solved.impossible" class="warn">
              ⚠️ 当前确认组合不存在于任何一条路线，请检查点位是否选错。
            </div>
          </div>

          <div class="panel grow">
            <div class="panel-head">
              <span>点位列表</span>
              <input v-model="search" class="mini-input" placeholder="搜索点位…" />
            </div>
            <div class="point-list">
              <button v-for="p in listedPoints" :key="p.id"
                      class="point-row" :class="{ confirmed: confirmed.includes(p.id), covered: p.covered }"
                      @click="toggle(p.id)">
                <span class="pn">{{ p.n }}</span>
                <span class="pc">{{ p.clusterLabel }}</span>
                <span v-if="p.prob !== null" class="pp">{{ Math.round(p.prob * 100) }}%</span>
              </button>
            </div>
          </div>
        </template>

        <!-- 路线查看面板 -->
        <template v-else>
          <div class="panel">
            <div class="panel-head"><span>进攻路线</span></div>
            <div class="lane-list">
              <button v-for="(r, i) in routes" :key="i"
                      class="lane-row" :class="{ on: activeLane === i }"
                      @click="activeLane = activeLane === i ? -1 : i">
                <i class="swatch" :style="{ background: laneColor(i) }"></i>
                <span class="lname">{{ r.lane }}</span>
                <span class="lsteps">{{ r.steps.length }} 步</span>
              </button>
            </div>
          </div>

          <div class="panel grow">
            <div class="panel-head">
              <span>{{ activeLane >= 0 ? `${routes[activeLane].lane} 路线点位顺序` : '各路线点位顺序' }}</span>
            </div>
            <div class="seq-list">
              <div v-for="(r, i) in shownRoutes" :key="i" class="seq-block">
                <div class="seq-head">
                  <i class="swatch" :style="{ background: laneColor(r.index) }"></i>{{ r.lane }}
                </div>
                <div class="seq-steps">
                  <span v-for="(s, j) in r.steps" :key="j" class="seq-step">
                    <b>{{ j + 1 }}</b>
                    <em v-for="pt in s.pts" :key="pt.id">{{ pt.n }}</em>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </aside>
    </div>
  </div>

  <div v-else class="raas-missing">
    <p>😕 没有找到图层 <code>{{ layerName }}</code></p>
    <RouterLink to="/squad/raas">返回地图列表</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RAAS_LAYERS, RAAS_MAPS } from '../data/squad/raas-data'
import { buildRoutes, solveRoutes, projectPoint, pointIndex } from '../utils/raas'

const route = useRoute()
const layerName = computed(() => route.params.layer)
const layer = computed(() => RAAS_LAYERS[layerName.value] || null)
const mapMeta = computed(() => RAAS_MAPS.find((m) => m.key === (layer.value && layer.value.map)) || null)
const mapName = computed(() => (layer.value ? layer.value.name.replace(/\s+RAAS.*$/i, '') : ''))
const mapUrl = computed(() => (mapMeta.value ? `/squad-assets/raas/maps/${mapMeta.value.slug}.webp` : ''))

const mode = ref('view')
const search = ref('')
const confirmed = ref([])
const activeLane = ref(-1)
// 点位名默认显示，密集图层（>50 点）默认隐藏以免糊成一团
const showLabels = ref(true)
const totalPointCount = computed(() => { let n = 0; Object.values((layer.value && layer.value.nodes) || {}).forEach((o) => { n += (o.pts || []).length }); return n })
watch(totalPointCount, (n) => { showLabels.value = n <= 50 }, { immediate: true })

const routeData = computed(() => (layer.value ? buildRoutes(layer.value) : { routes: [] }))
const routes = computed(() => routeData.value.routes)
const pointMap = computed(() => (layer.value ? pointIndex(layer.value) : new Map()))

const constraints = computed(() => confirmed.value.map((id) => ({ ids: [id] })))
const solved = computed(() => (routes.value.length ? solveRoutes(routes.value, constraints.value) : { alive: 0, total: 0, byId: new Map(), steps: new Map(), survivors: [], impossible: false }))

/** 每条存活路线里，已确认点位的最深位置；并算出「下一步」候选 */
const analysis = computed(() => {
  const confSet = confirmed.value
  const deepest = new Map()   // routeIndex -> 最深已确认 index
  const futureIds = new Set()
  solved.value.survivors.forEach(({ route, routeIndex }) => {
    let d = -1
    route.steps.forEach((s, idx) => {
      if (s.ids.some((id) => confSet.includes(id))) d = Math.max(d, idx)
    })
    deepest.set(routeIndex, d)
    route.steps.forEach((s, idx) => {
      if (idx > d) s.ids.forEach((id) => futureIds.add(id))
    })
  })
  return { deepest, futureIds }
})

const lastDepth = computed(() => {
  let d = 0
  analysis.value.deepest.forEach((v) => { d = Math.max(d, v + 1) })
  return d
})

const renderedPoints = computed(() => {
  if (!layer.value) return []
  const out = []
  const confSet = confirmed.value
  const future = analysis.value.futureIds
  const laneNodeSet = activeLane.value >= 0
    ? new Set(routes.value[activeLane.value].steps.map((s) => s.cluster))
    : null

  Object.entries(layer.value.nodes || {}).forEach(([cluster, o]) => {
    (o.pts || []).forEach((p) => {
      const { u, v } = projectPoint(layer.value, p.x, p.y)
      const isConf = confSet.includes(p.id)
      const isFuture = future.has(p.id)
      let cls = ''
      if (isConf) cls = 'is-confirmed'
      else if (mode.value === 'tool' && confSet.length) cls = isFuture ? 'is-possible' : 'is-covered'
      else if (laneNodeSet && !laneNodeSet.has(cluster)) cls = 'is-dim'
      out.push({ ...p, cluster, u, v, cls, step: isConf ? confSet.indexOf(p.id) + 1 : 0 })
    })
  })
  return out
})

const listedPoints = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const future = analysis.value.futureIds
  const rows = []
  const seen = new Set()
  Object.entries(layer.value.nodes || {}).forEach(([cluster, o]) => {
    (o.pts || []).forEach((p) => {
      if (seen.has(p.id)) return
      seen.add(p.id)
      if (kw && !p.n.toLowerCase().includes(kw) && !cluster.toLowerCase().includes(kw)) return
      const conf = confirmed.value.includes(p.id)
      const covered = mode.value === 'tool' && confirmed.value.length > 0 && !conf && !future.has(p.id)
      const e = solved.value.byId.get(p.id)
      rows.push({
        id: p.id, n: p.n, clusterLabel: shortCluster(cluster),
        covered, prob: e ? e.probability : null,
      })
    })
  })
  return rows.sort((a, b) => (b.prob ?? -1) - (a.prob ?? -1) || a.n.localeCompare(b.n))
})

const drawnRoutes = computed(() => {
  if (mode.value === 'tool') return []
  return routes.value.map((r, i) => {
    const show = activeLane.value < 0 || activeLane.value === i
    const pts = r.steps.map((s) => {
      const { u, v } = projectPoint(layer.value, s.x, s.y)
      return `${(u * 100).toFixed(2)},${(v * 100).toFixed(2)}`
    }).join(' ')
    return { points: pts, color: laneColor(i), opacity: show ? 0.95 : 0.12 }
  })
})

const shownRoutes = computed(() => {
  const idx = activeLane.value
  return routes.value
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => idx < 0 || r.index === idx)
})

const LANE_COLORS = ['#ff5c5c', '#4ea8ff', '#ffd23f', '#3ddc84', '#c084fc', '#ff9f45', '#5eead4', '#f472b6']
function laneColor(i) { return LANE_COLORS[i % LANE_COLORS.length] }
function shortCluster(c) { return (c || '').replace(/-BP_CaptureZoneCluster$/, '').replace(/CaptureZoneCluster$/, '') }

function toggle(id) {
  const i = confirmed.value.indexOf(id)
  if (i >= 0) confirmed.value.splice(i, 1)
  else confirmed.value.push(id)
}
function onDotClick(p) { if (mode.value === 'tool') toggle(p.id) }
function unconfirm(id) { toggle(id) }
function reset() { confirmed.value = [] }
</script>

<style scoped>
.raas-layer { max-width: 1400px; margin: 0 auto; padding: 20px 16px 48px; }

.raas-bar { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 16px; }
.raas-back { font-size: 13px; color: var(--sq-accent); text-decoration: none; }
.raas-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.raas-map-name { font-size: 20px; font-weight: 700; color: var(--sq-text); }
.raas-layer-name { font-size: 13px; font-weight: 700; letter-spacing: 1px; color: var(--sq-accent); }
.badge {
  font-size: 11px; color: var(--sq-text-3); border: 1px solid var(--sq-border-strong);
  padding: 2px 9px; border-radius: 12px;
}
.badge.cl { color: #d9a13b; border-color: #b98b2f; }
.raas-tabs { margin-left: auto; display: flex; gap: 0; border: 1px solid var(--sq-border-strong); border-radius: 8px; overflow: hidden; }
.raas-tabs button {
  padding: 7px 18px; font-size: 13px; border: 0; cursor: pointer;
  background: transparent; color: var(--sq-text-3);
}
.raas-tabs button.on { background: var(--sq-accent-bg); color: #fff; }

.raas-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }

.raas-mapwrap { min-width: 0; }
.raas-map {
  position: relative; width: 100%; aspect-ratio: 1 / 1;
  background-size: 100% 100%; background-repeat: no-repeat;
  border: 1px solid var(--sq-border); border-radius: 10px;
  background-color: #0e1116; overflow: hidden;
}
.raas-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

.raas-dot {
  position: absolute; transform: translate(-50%, -50%);
  background: transparent; border: 0; padding: 0; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
}
.dot-core {
  width: 11px; height: 11px; border-radius: 50%;
  background: #ffd23f; border: 2px solid rgba(0,0,0,.55);
  box-shadow: 0 0 4px rgba(0,0,0,.6); flex: 0 0 auto;
}
.dot-label {
  font-size: 11px; color: #fff; text-shadow: 0 1px 3px #000, 0 0 2px #000;
  white-space: nowrap; opacity: .92;
}
.dot-step {
  font-size: 10px; font-weight: 700; color: #06210f;
  background: #3ddc84; border-radius: 8px; padding: 0 5px;
}
.raas-dot.is-confirmed .dot-core { background: #3ddc84; width: 14px; height: 14px; }
.raas-dot.is-possible .dot-core { background: #ffd23f; animation: pulse 1.6s infinite; }
.raas-dot.is-covered { opacity: .28; filter: grayscale(1); }
.raas-dot.is-covered .dot-label { text-decoration: line-through; }
.raas-dot.is-dim { opacity: .25; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,210,63,.8);} 50% { box-shadow: 0 0 0 7px rgba(255,210,63,0);} }

.raas-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 12px; color: var(--sq-text-3); }
.raas-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.lg-toggle { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; margin-left: auto; }
.lg.confirm { background: #3ddc84; }
.lg.possible { background: #ffd23f; }
.lg.covered { background: #6b7280; }
.lg.dim { background: #374151; }

.raas-side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.panel { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 10px; padding: 12px 14px; }
.panel.grow { display: flex; flex-direction: column; min-height: 260px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; color: var(--sq-text); margin-bottom: 10px; }
.panel-hint { font-size: 12px; line-height: 1.8; color: var(--sq-text-3); }
.mini { font-size: 11px; background: transparent; border: 1px solid var(--sq-border-strong); color: var(--sq-text-3); border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.mini-input { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--sq-border); background: var(--sq-input); color: var(--sq-text); outline: none; min-width: 0; flex: 1; }

.confirm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.confirm-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sq-text-2); }
.idx { width: 18px; height: 18px; border-radius: 50%; background: #3ddc84; color: #06210f; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.cname { flex: 1; }

.stat-row { font-size: 13px; color: var(--sq-text-3); }
.stat-row b { font-size: 20px; color: #3ddc84; margin-right: 4px; }
.stat-row b.bad { color: #ff5c5c; }
.warn { margin-top: 8px; font-size: 12px; color: #ff9f45; line-height: 1.7; }

.point-list { overflow-y: auto; max-height: 420px; display: flex; flex-direction: column; gap: 3px; }
.point-row {
  display: flex; align-items: center; gap: 8px; text-align: left;
  background: transparent; border: 0; border-radius: 6px; padding: 6px 8px;
  cursor: pointer; font-size: 12px; color: var(--sq-text-2);
}
.point-row:hover { background: var(--sq-hover); }
.point-row.confirmed { background: rgba(61,220,132,.14); color: #3ddc84; }
.point-row.covered { opacity: .38; text-decoration: line-through; }
.pn { flex: 1; }
.pc { font-size: 11px; color: var(--sq-text-3); }
.pp { font-size: 11px; color: var(--sq-accent); min-width: 34px; text-align: right; }

.lane-list { display: flex; flex-direction: column; gap: 4px; }
.lane-row { display: flex; align-items: center; gap: 8px; background: transparent; border: 0; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--sq-text-2); }
.lane-row:hover { background: var(--sq-hover); }
.lane-row.on { background: var(--sq-accent-bg); color: #fff; }
.swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex: 0 0 auto; }
.lname { flex: 1; text-align: left; }
.lsteps { font-size: 11px; color: var(--sq-text-3); }

.seq-list { overflow-y: auto; max-height: 520px; display: flex; flex-direction: column; gap: 14px; }
.seq-head { font-size: 12px; font-weight: 600; color: var(--sq-text); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.seq-steps { display: flex; flex-direction: column; gap: 4px; }
.seq-step { font-size: 12px; color: var(--sq-text-3); display: flex; gap: 8px; align-items: baseline; }
.seq-step b { color: var(--sq-accent); min-width: 14px; }
.seq-step em { font-style: normal; }

.raas-missing { text-align: center; padding: 80px 20px; color: var(--sq-text-3); }

@media (max-width: 1024px) {
  .raas-layout { grid-template-columns: 1fr; }
  .raas-side { order: 2; }
}
</style>
