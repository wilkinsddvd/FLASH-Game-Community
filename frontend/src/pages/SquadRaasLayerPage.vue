<template>
  <div class="raas-layer" v-if="layer" :class="{ 'sheet-open': sheetOpen }">
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
    </div>

    <div class="raas-layout">
      <!-- 地图 -->
      <div class="raas-mapwrap">
        <RaasMap
          :layer="layer"
          :slug="slug"
          :points="renderedPoints"
          :show-labels="showLabels"
          :show-zones="showZones"
          @point-click="onPinClick"
          @interact="onMapInteract"
        />
        <div v-if="hint" class="raas-toast">{{ hint }}</div>

        <div class="raas-legend">
          <span><i class="lg confirm"></i>已确认</span>
          <span><i class="lg next"></i>下一步可点</span>
          <span><i class="lg future"></i>后续（暂不可点）</span>
          <span><i class="lg base"></i>出生点</span>
          <span><i class="lg end"></i>终点</span>
          <label class="lg-toggle"><input type="checkbox" v-model="showLabels" /> 点位名</label>
          <label class="lg-toggle"><input type="checkbox" v-model="showZones" /> 占领区</label>
        </div>
      </div>

      <!-- 移动端抽屉把手 -->
      <div class="raas-sheet-head">
        <button class="handle" @click="sheetOpen = !sheetOpen">
          点位工具
          <span class="chev">{{ sheetOpen ? '▼' : '▲' }}</span>
        </button>
      </div>

      <!-- 侧栏 / 底部抽屉 -->
      <aside class="raas-side">
        <div class="panel">
          <div class="panel-head">
            <span>已确认点位（{{ confirmed.length }}）</span>
            <button v-if="confirmed.length" class="mini" @click="reset">重置</button>
          </div>
          <div v-if="!confirmed.length" class="panel-hint">
            按顺序点：<b>第 0 步 = 出生点</b>，然后依次点第 1、2、3… 步。
            点地图上的点或下方气泡都行；点错顺序会被拦住。
          </div>
          <ol v-else class="confirm-list">
            <li v-for="(id, i) in confirmed" :key="id">
              <span class="idx">{{ i }}</span>
              <span class="cname">{{ nameOf(id) }}</span>
              <button class="mini" :title="i === confirmed.length - 1 ? '撤销这一步' : '撤销这一步及之后的记录'" @click="unconfirmAt(i)">✕</button>
            </li>
          </ol>
        </div>

        <div class="panel">
          <div class="panel-head"><span>路线状态</span></div>
          <div class="stat-row">
            <b :class="{ bad: solved.impossible }">{{ solved.alive }}</b> / {{ solved.total }} 条路线仍然成立
          </div>
          <div v-if="solved.impossible" class="warn">
            ⚠️ 当前确认组合不存在于任何一条路线，请撤销上一步。
          </div>
          <div v-else-if="done" class="done">✅ 本局点位已确认完毕。</div>
          <div v-else-if="stepNo !== null" class="stat-sub">
            现在该点：<b>第 {{ stepNo }} 步</b>{{ stepNo === 0 ? '（出生点）' : '' }}，共 {{ nextSet.size }} 个候选
          </div>
        </div>

        <div class="panel grow">
          <div class="panel-head">
            <span>点位气泡（按步序）</span>
            <input v-model="search" class="mini-input" placeholder="搜索点位…" />
          </div>
          <div class="bubble-cloud">
            <div v-for="g in bubbleGroups" :key="g.cluster" class="bubble-group"
                 :class="{ locked: g.stepNo !== null && g.items.some((i) => i.confirmed) }">
              <div class="bubble-gl">
                <span class="bubble-gstep">{{ g.stepNo === null ? '—' : '第 ' + g.stepNo + ' 步' }}</span>
                <span class="bubble-gname">{{ g.label }}</span>
              </div>
              <div class="bubbles">
                <button v-for="it in g.items" :key="it.id"
                        class="bubble"
                        :class="{ on: it.confirmed, next: it.clickable, dim: !it.confirmed && !it.clickable }"
                        :title="it.title"
                        @click="tryConfirm(it)">
                  <span class="bname">{{ it.label }}</span>
                  <span v-if="it.prob !== null && !it.base" class="bprob">{{ Math.round(it.prob * 100) }}%</span>
                </button>
              </div>
            </div>
            <div v-if="!bubbleGroups.length" class="panel-hint">没有匹配的点位。</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span>进攻路线参考</span>
            <button class="mini" @click="showRoutes = !showRoutes">{{ showRoutes ? '收起' : '展开' }}</button>
          </div>
          <div v-show="showRoutes" class="lane-list">
            <button v-for="(r, i) in routes" :key="i"
                    class="lane-row" :class="{ on: activeLane === i }"
                    @click="activeLane = activeLane === i ? -1 : i">
              <i class="swatch" :style="{ background: laneColor(i) }"></i>
              <span class="lname">{{ r.lane }}</span>
              <span class="lsteps">{{ r.steps.length }} 步</span>
            </button>
          </div>
          <div v-show="showRoutes" class="seq-list">
            <div v-for="(r, i) in shownRoutes" :key="i" class="seq-block">
              <div class="seq-head">
                <i class="swatch" :style="{ background: laneColor(r.index) }"></i>{{ r.lane }}
              </div>
              <div class="seq-steps">
                <span v-for="(s, j) in r.steps" :key="j" class="seq-step">
                  <b>{{ j }}</b>
                  <em v-for="pt in s.pts" :key="pt.id"
                      :class="{ hit: confirmed.includes(pt.id) }">{{ pt.n }}</em>
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <div v-else class="raas-missing">
    <p>😕 没有找到图层 <code>{{ layerName }}</code></p>
    <RouterLink to="/squad/raas">返回地图列表</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import RaasMap from '../components/RaasMap.vue'
import { RAAS_LAYERS, RAAS_MAPS } from '../data/squad/raas-data'
import {
  buildRoutes, solveRoutes, projectPoint, pointIndex,
  displayName, clusterShort, startBaseId,
  routeDepths, futureIds, nextIds, currentStepNo,
  BASE_LABEL_START, BASE_LABEL_END,
} from '../utils/raas'

const route = useRoute()
const layerName = computed(() => route.params.layer)
const layer = computed(() => RAAS_LAYERS[layerName.value] || null)
const mapMeta = computed(() => RAAS_MAPS.find((m) => m.key === (layer.value && layer.value.map)) || null)
const slug = computed(() => (mapMeta.value ? mapMeta.value.slug : ''))
const mapName = computed(() => (layer.value ? layer.value.name.replace(/\s+RAAS.*$/i, '') : ''))

const search = ref('')
const confirmed = ref([])
const activeLane = ref(-1)
const sheetOpen = ref(false)
const showZones = ref(false)
const showRoutes = ref(false)
const hint = ref('')
let hintTimer = null

function flash(msg) {
  hint.value = msg
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => { hint.value = '' }, 2400)
}
onBeforeUnmount(() => { if (hintTimer) clearTimeout(hintTimer) })

const routeData = computed(() => (layer.value ? buildRoutes(layer.value) : { routes: [] }))
const routes = computed(() => routeData.value.routes)
const startId = computed(() => startBaseId(routes.value))
const pointMap = computed(() => (layer.value ? pointIndex(layer.value, routes.value) : new Map()))
const totalPointCount = computed(() => pointMap.value.size)

// 点位名：密集图层默认关闭，免得糊成一团
const showLabels = ref(true)
watch(totalPointCount, (n) => { showLabels.value = n <= 50 }, { immediate: true })

const constraints = computed(() => confirmed.value.map((id) => ({ ids: [id] })))
const solved = computed(() => (routes.value.length
  ? solveRoutes(routes.value, constraints.value)
  : { alive: 0, total: 0, byId: new Map(), steps: new Map(), survivors: [], impossible: false }))

/** 每条存活路线已确认的最深步；以及「仍可能刷新」「下一步可点」的集合 */
const depths = computed(() => routeDepths(solved.value.survivors, confirmed.value))
const futureSet = computed(() => futureIds(solved.value.survivors, depths.value))
const nextSet = computed(() => nextIds(solved.value.survivors, depths.value))
const stepNo = computed(() => currentStepNo(solved.value.survivors, depths.value))
const done = computed(() => !!confirmed.value.length && !solved.value.impossible && stepNo.value === null)
const picking = computed(() => confirmed.value.length > 0)

/** 全部点位（含主基地），按 id 去重：同一 objectName 可能挂多个 cluster */
const allPins = computed(() => {
  if (!layer.value) return []
  const seen = new Set()
  const out = []
  Object.entries(layer.value.nodes || {}).forEach(([cluster, o]) => {
    if (o.main) {
      if (seen.has(cluster)) return
      seen.add(cluster)
      const isStart = !startId.value || cluster === startId.value
      out.push({
        id: cluster, cluster, n: cluster, x: o.x, y: o.y, r: 0,
        base: isStart ? 'start' : 'end',
        label: isStart ? BASE_LABEL_START : BASE_LABEL_END,
      })
      return
    }
    (o.pts || []).forEach((p) => {
      if (seen.has(p.id)) return
      seen.add(p.id)
      out.push({ ...p, cluster, base: null, label: displayName(cluster, p.n) })
    })
  })
  return out
})

/**
 * 地图点位。
 *   出生点 = 第 0 步（可点）；终点只是标记；
 *   确认后不可能再刷新的一律隐藏；后续仍可能刷新的可见但不可点（除非正好是下一步）。
 */
const renderedPoints = computed(() => {
  if (!layer.value) return []
  const confSet = confirmed.value
  const next = nextSet.value
  const future = futureSet.value
  const out = []

  allPins.value.forEach((p) => {
    const isConf = confSet.includes(p.id)
    const isNext = next.has(p.id)
    let cls
    let clickable = false

    if (p.base === 'end') {
      cls = 'is-end'
    } else if (isConf) {
      cls = 'is-confirmed'
    } else if (isNext) {
      cls = 'is-next'
      clickable = true
    } else if (future.has(p.id)) {
      cls = 'is-future' // 保留可见、不可点
    } else {
      return // 不可能再刷新 → 直接隐藏
    }

    const { u, v } = projectPoint(layer.value, p.x, p.y)
    const e = solved.value.byId.get(p.id)
    const prob = e && !p.base ? e.probability : null
    out.push({
      ...p, u, v, cls, clickable, prob,
      step: isConf ? confSet.indexOf(p.id) : 0,
      title: p.base ? p.label : `${p.label}${prob !== null ? ` · ${Math.round(prob * 100)}%` : ''}`,
    })
  })
  return out
})

/** 气泡：按步序分组（第 0 步 = 出生点），已确认/可点/后续用颜色区分 */
const bubbleGroups = computed(() => {
  if (!layer.value) return []
  const kw = search.value.trim().toLowerCase()
  const confSet = confirmed.value
  const next = nextSet.value
  const future = futureSet.value
  const depthMap = depths.value
  const pickingNow = picking.value

  // cluster → 在存活路线上的最早步序
  const stepOf = new Map()
  routes.value.forEach((r, ri) => {
    if (!solved.value.survivors.some((s) => s.routeIndex === ri)) return
    r.steps.forEach((s, i) => {
      const cur = stepOf.get(s.cluster)
      if (cur === undefined || i < cur) stepOf.set(s.cluster, i)
    })
  })

  const groups = new Map()
  allPins.value.forEach((p) => {
    if (p.base === 'end') return // 终点不进列表
    const isConf = confSet.includes(p.id)
    const isNext = next.has(p.id)
    const isFuture = future.has(p.id)
    if (pickingNow && !isConf && !isFuture) return // 不可能再刷新 → 隐藏
    const label = p.label
    if (kw && !label.toLowerCase().includes(kw) && !clusterShort(p.cluster).toLowerCase().includes(kw)) return

    if (!groups.has(p.cluster)) {
      groups.set(p.cluster, {
        cluster: p.cluster,
        label: p.base ? p.label : clusterShort(p.cluster),
        stepNo: stepOf.get(p.cluster) ?? null,
        order: stepOf.get(p.cluster) ?? 9999,
        items: [],
      })
    }
    const e = solved.value.byId.get(p.id)
    groups.get(p.cluster).items.push({
      id: p.id, label: p.base ? p.label : `${p.label}`,
      base: !!p.base,
      prob: e ? e.probability : null,
      confirmed: isConf,
      clickable: isNext,
      step: isConf ? confSet.indexOf(p.id) : 0,
      title: p.base
        ? `${p.label}（第 0 步）`
        : `${p.label}${e ? ` · ${Math.round(e.probability * 100)}%` : ''}`,
    })
  })

  const arr = [...groups.values()]
  arr.forEach((g) => {
    g.items.sort((a, b) => (b.prob ?? -1) - (a.prob ?? -1) || a.label.localeCompare(b.label))
  })
  arr.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  return arr
})

const shownRoutes = computed(() => {
  const idx = activeLane.value
  return routes.value.map((r, i) => ({ ...r, index: i })).filter((r) => idx < 0 || r.index === idx)
})

const LANE_COLORS = ['#ff5c5c', '#4ea8ff', '#ffd23f', '#3ddc84', '#c084fc', '#ff9f45', '#5eead4', '#f472b6']
function laneColor(i) { return LANE_COLORS[i % LANE_COLORS.length] }
function nameOf(id) {
  const p = pointMap.value.get(id)
  if (!p) return id
  return p.base ? p.n : displayName(p.cluster, p.n)
}

/** 点一个点位：只有「下一步」和「出生点」允许 */
function tryConfirm(p) {
  if (confirmed.value.includes(p.id)) {
    flash('该点位已确认，如需撤销请用左侧列表的 ✕')
    return
  }
  if (p.base === 'end') {
    flash('终点不是旗点，无需选择')
    return
  }
  if (!nextSet.value.has(p.id)) {
    const n = stepNo.value
    flash(n === null
      ? '本局点位已确认完毕，无需再选'
      : `请按顺序来：现在该点第 ${n} 步${n === 0 ? '（出生点）' : ''}`)
    return
  }
  confirmed.value.push(p.id)
}

function onPinClick(p) { tryConfirm(p) }
function unconfirmAt(i) {
  const removed = confirmed.value.length - i
  confirmed.value = confirmed.value.slice(0, i)
  if (removed > 1) flash(`已撤销第 ${i} 步及其之后的 ${removed - 1} 条记录`)
}
function reset() { confirmed.value = [] }
function onMapInteract() { if (sheetOpen.value) sheetOpen.value = false }

watch(layerName, () => { confirmed.value = []; activeLane.value = -1; search.value = ''; hint.value = '' })
</script>

<style scoped>
.raas-layer { max-width: 1400px; margin: 0 auto; padding: 20px 16px 48px; }

.raas-bar { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 16px; }
.raas-back { font-size: 13px; color: var(--sq-accent); text-decoration: none; }
.raas-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.raas-map-name { font-size: 20px; font-weight: 700; color: var(--sq-text); }
.raas-layer-name { font-size: 13px; font-weight: 700; letter-spacing: 1px; color: var(--sq-accent); }
.badge { font-size: 11px; color: var(--sq-text-3); border: 1px solid var(--sq-border-strong); padding: 2px 9px; border-radius: 12px; }
.badge.cl { color: #d9a13b; border-color: #b98b2f; }

.raas-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.raas-mapwrap { min-width: 0; position: relative; }

.raas-toast {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  background: rgba(12, 16, 22, 0.92);
  color: #ffd23f;
  border: 1px solid rgba(255, 210, 63, 0.5);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12px;
  z-index: 8;
  pointer-events: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.raas-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 10px; font-size: 12px; color: var(--sq-text-3); }
.raas-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
.lg.confirm { background: #3ddc84; }
.lg.next { background: #ffd23f; }
.lg.future { background: #8b98a8; }
.lg.base { background: #22d3ee; border-radius: 3px; }
.lg.end { background: transparent; border: 2px dashed #94a3b8; border-radius: 3px; box-sizing: border-box; }
.lg-toggle { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; }

/* 抽屉把手：桌面隐藏 */
.raas-sheet-head { display: none; }

.raas-side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.panel { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 10px; padding: 12px 14px; }
.panel.grow { display: flex; flex-direction: column; min-height: 260px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; color: var(--sq-text); margin-bottom: 10px; }
.panel-hint { font-size: 12px; line-height: 1.8; color: var(--sq-text-3); }
.panel-hint b { color: var(--sq-accent); }
.mini { font-size: 11px; background: transparent; border: 1px solid var(--sq-border-strong); color: var(--sq-text-3); border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.mini-input { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--sq-border); background: var(--sq-input); color: var(--sq-text); outline: none; min-width: 0; flex: 1; }

.confirm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.confirm-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sq-text-2); }
.idx { width: 18px; height: 18px; border-radius: 50%; background: #3ddc84; color: #06210f; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.cname { flex: 1; }

.stat-row { font-size: 13px; color: var(--sq-text-3); }
.stat-row b { font-size: 20px; color: #3ddc84; margin-right: 4px; }
.stat-row b.bad { color: #ff5c5c; }
.stat-sub { margin-top: 6px; font-size: 12px; color: var(--sq-text-3); }
.stat-sub b { color: #ffd23f; }
.warn { margin-top: 8px; font-size: 12px; color: #ff9f45; line-height: 1.7; }
.done { margin-top: 8px; font-size: 12px; color: #3ddc84; }

/* ── 气泡 ── */
.bubble-cloud { overflow-y: auto; max-height: 460px; display: flex; flex-direction: column; gap: 12px; padding-right: 2px; }
.bubble-group { display: flex; flex-direction: column; gap: 6px; }
.bubble-gl { display: flex; align-items: center; gap: 6px; }
.bubble-gstep { font-size: 10px; font-weight: 700; color: var(--sq-text-3); background: var(--sq-input); border: 1px solid var(--sq-border-strong); border-radius: 8px; padding: 1px 7px; white-space: nowrap; }
.bubble-group.locked .bubble-gstep { color: #06210f; background: #3ddc84; border-color: #3ddc84; }
.bubble-gname { font-size: 11px; color: var(--sq-text-3); letter-spacing: 0.3px; }
.bubbles { display: flex; flex-wrap: wrap; gap: 6px; }
.bubble {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 999px; padding: 4px 11px;
  font-size: 12px; line-height: 1.35; cursor: pointer;
  background: var(--sq-input); color: var(--sq-text-2);
  border: 1px solid var(--sq-border);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.bubble:hover { border-color: var(--sq-accent); color: var(--sq-text); }
.bubble.next { border-color: #ffd23f; color: #ffd23f; }
.bubble.on { background: rgba(61, 220, 132, 0.18); border-color: #3ddc84; color: #3ddc84; }
.bubble.dim { opacity: 0.4; }
.bubble .bname { white-space: nowrap; }
.bubble .bprob { font-size: 10px; color: var(--sq-accent); }
.bubble.on .bprob { color: #3ddc84; }

.lane-list { display: flex; flex-direction: column; gap: 4px; }
.lane-row { display: flex; align-items: center; gap: 8px; background: transparent; border: 0; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--sq-text-2); }
.lane-row:hover { background: var(--sq-hover); }
.lane-row.on { background: var(--sq-accent-bg); color: #fff; }
.swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex: 0 0 auto; }
.lname { flex: 1; text-align: left; }
.lsteps { font-size: 11px; color: var(--sq-text-3); }

.seq-list { overflow-y: auto; max-height: 340px; display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
.seq-head { font-size: 12px; font-weight: 600; color: var(--sq-text); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.seq-steps { display: flex; flex-direction: column; gap: 4px; }
.seq-step { font-size: 12px; color: var(--sq-text-3); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.seq-step b { color: var(--sq-accent); min-width: 14px; }
.seq-step em { font-style: normal; }
.seq-step em.hit { color: #3ddc84; font-weight: 700; }

.raas-missing { text-align: center; padding: 80px 20px; color: var(--sq-text-3); }

/* ── 平板：单列，侧栏落到地图下方 ── */
@media (max-width: 1024px) {
  .raas-layout { grid-template-columns: 1fr; }
  .raas-side { order: 2; }
}

/* ── 手机：底部抽屉 ── */
@media (max-width: 640px) {
  .raas-layer { padding: 12px 12px 80px; }
  .raas-bar { gap: 10px; margin-bottom: 12px; }
  .raas-map-name { font-size: 17px; }
  .raas-layout { gap: 0; }

  .raas-sheet-head {
    display: flex;
    align-items: stretch;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(52px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--sq-card);
    border-top: 1px solid var(--sq-border-strong);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.18);
    z-index: 60;
  }
  .raas-sheet-head button {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--sq-text-3);
    font-size: 14px;
    cursor: pointer;
  }
  .raas-sheet-head .handle { color: var(--sq-accent); font-weight: 700; }
  .raas-sheet-head .chev { font-size: 12px; margin-left: 6px; }

  .raas-side {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 68vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px 12px calc(64px + env(safe-area-inset-bottom));
    background: var(--sq-card);
    border-top: 1px solid var(--sq-border-strong);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.28);
    transform: translateY(100%);
    transition: transform 0.26s ease;
    z-index: 55;
  }
  .raas-layer.sheet-open .raas-side { transform: translateY(0); }
}
</style>
