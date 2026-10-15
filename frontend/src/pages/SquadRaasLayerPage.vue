<template>
  <div class="raas-layer" v-if="layer" :class="{ 'sheet-open': sheetOpen, 'panels-off': !panelsOpen }">
    <!-- 顶部信息条 -->
    <div class="raas-bar">
      <RouterLink to="/squad/raas" class="raas-back">← 全部地图</RouterLink>
      <div class="raas-title">
        <span class="raas-map-name">{{ mapName }}</span>
        <span class="raas-layer-name">{{ layer.ver.toUpperCase() }}</span>
        <span v-if="layer.community" class="badge cl">社区层</span>
        <span class="badge">{{ layer.size }}</span>
        <span class="badge">{{ lanes }} 条 lane · 双向</span>
      </div>
      <div class="raas-tools">
        <button class="mini" :title="panelsOpen ? '隐藏下方面板，让地图更大' : '显示下方面板'" @click="panelsOpen = !panelsOpen">
          {{ panelsOpen ? '🗛 收起面板' : '▤ 展开面板' }}
        </button>
      </div>
    </div>

    <div class="raas-layout">
      <!-- 地图（PC 也独占整行，面板落到下方） -->
      <div class="raas-mapwrap">
        <RaasMap
          :layer="layer"
          :slug="slug"
          :points="renderedPoints"
          :show-labels="showLabels"
          :show-zones="showZones"
          :dense="densePins"
          @point-click="onPinClick"
          @interact="onMapInteract"
        />
        <div v-if="spawnPending" class="raas-gate">
          第 0 点：先点一个<b>青色圈</b>选你的出生点
        </div>
        <div v-if="hint" class="raas-toast">{{ hint }}</div>

        <div class="raas-legend">
          <span><i class="lg spawn"></i>待选出生点</span>
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

      <!-- 面板区：PC 在地图下方自适应排布 / 移动端底部抽屉 -->
      <aside class="raas-side">
        <div class="panel">
          <div class="panel-head">
            <span>已确认点位（{{ confirmed.length }}）</span>
            <button v-if="confirmed.length" class="mini" @click="reset">重选出生点</button>
          </div>
          <div v-if="!confirmed.length" class="panel-hint">
            先选<b>出生点</b>（第 0 点）：地图上青色圈，或下方气泡二选一。<br />
            选定后按顺序点：第 1 点 = 从你的出生点出发后的第一个点，依此类推。点错顺序会被拦住。
          </div>
          <ol v-else class="confirm-list">
            <li v-for="(ids, i) in confirmed" :key="ids.join(',') + i">
              <span class="idx">{{ i }}</span>
              <span class="cname">{{ nameOf(ids[0]) }}</span>
              <em v-if="ids.length > 1" class="cmulti" :title="ids.join(' / ')">同点 ×{{ ids.length }}</em>
              <span class="cstep">第 {{ i }} 点</span>
              <button class="mini" :title="i === confirmed.length - 1 ? '撤销这一步' : '撤销这一步及之后的记录'" @click="unconfirmAt(i)">✕</button>
            </li>
          </ol>
        </div>

        <div class="panel">
          <div class="panel-head"><span>路线状态</span></div>
          <div v-if="spawnPending" class="stat-sub">还没选出生点。</div>
          <template v-else>
            <div class="stat-row">
              <b :class="{ bad: solved.impossible }">{{ solved.alive }}</b> / {{ solved.total }} 条路线仍然成立
            </div>
            <div class="stat-sub dir-line">
              你的方向：<b>{{ spawnTeam }}</b>（第 0 点）→ {{ endTeam }}（终点）
            </div>
            <div v-if="solved.impossible" class="warn">
              ⚠️ 当前确认组合不存在于任何一条路线，请撤销上一步。
            </div>
            <div v-else-if="done" class="done">✅ 本局点位已确认完毕。</div>
            <div v-else-if="stepNo !== null" class="stat-sub">
              现在该点：<b>第 {{ stepNo }} 点</b>{{ stepNo === 0 ? '（出生点）' : '' }}，共 {{ nextSet.size }} 个候选
            </div>
          </template>
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
                <span class="bubble-gstep">{{ g.stepNo === null ? '—' : '第 ' + g.stepNo + ' 点' }}</span>
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
            <span>进攻路线参考{{ spawnId ? '（当前方向）' : '' }}</span>
            <button class="mini" @click="showRoutes = !showRoutes">{{ showRoutes ? '收起' : '展开' }}</button>
          </div>
          <div v-show="showRoutes" class="lane-list">
            <button v-for="r in laneRows" :key="r.lane"
                    class="lane-row" :class="{ on: activeLane === r.lane }"
                    @click="activeLane = activeLane === r.lane ? '' : r.lane">
              <i class="swatch" :style="{ background: laneColor(r.lane) }"></i>
              <span class="lname">{{ r.lane }}</span>
              <span class="lsteps">{{ r.steps.length - 1 }} 点</span>
            </button>
          </div>
          <div v-show="showRoutes" class="seq-list">
            <div v-for="(r, i) in shownRoutes" :key="i" class="seq-block">
              <div class="seq-head">
                <i class="swatch" :style="{ background: laneColor(r.lane) }"></i>{{ r.lane }}
                <span class="seq-dir">{{ r.dir === 'rev' ? '反向' : '正向' }}</span>
              </div>
              <div class="seq-steps">
                <span v-for="(s, j) in r.steps" :key="j" class="seq-step">
                  <b>{{ j }}</b>
                  <!-- ⚠️ 同一 cluster 里可能有重名 objectName（AlBasrah 就有），key 必须带下标 -->
                  <em v-for="(pt, k) in s.pts" :key="k + '-' + pt.id"
                      :class="{ hit: flatConfirmed.includes(pt.id) }">{{ pt.n }}</em>
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
  displayName, clusterShort, spawnIds, laneCount,
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
/** 每一步确认的是「一组 id」：同一物理点可能挂在多个 cluster（不同 lane 变体），点一次整组确认 */
const confirmed = ref([])
const flatConfirmed = computed(() => confirmed.value.flat())
const groupOf = (id) => confirmed.value.findIndex((g) => g.includes(id))
const activeLane = ref('')
const sheetOpen = ref(false)
const panelsOpen = ref(true)
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

/* ── 路线（双向：同一条 lane 有正向 / 反向两条，取决于你的出生点） ── */
const routeData = computed(() => (layer.value ? buildRoutes(layer.value, { bidirectional: true }) : { routes: [] }))
const routes = computed(() => routeData.value.routes)
const lanes = computed(() => laneCount(routes.value))
const allSpawnIds = computed(() => [...spawnIds(routes.value)])

/** 已确认的第 0 点就是你的出生点；没选之前为 null（= 关卡态） */
const spawnId = computed(() => confirmed.value[0] && confirmed.value[0][0] || null)
const spawnPending = computed(() => !spawnId.value)

const pointMap = computed(() => (layer.value ? pointIndex(layer.value, routes.value, spawnId.value) : new Map()))

/** 点位名显示开关：密图默认关闭（免得糊成一团），可手动开 */
const showLabels = ref(true)
const totalPointCount = computed(() => pointMap.value.size)
watch(totalPointCount, (n) => { showLabels.value = n <= 50 }, { immediate: true })

/** 同点判定的容差（世界坐标）：小于底图短边的 0.2%，屏上约 1~2px */
const coordTol = computed(() => {
  const c = (layer.value && layer.value.corners) || []
  if (c.length < 2) return 0
  const dw = Math.abs(c[1][0] - c[0][0]) || 1
  const dh = Math.abs(c[1][1] - c[0][1]) || 1
  return Math.min(dw, dh) * 0.002
})

/**
 * 点一个位置 = 确认「同一个物理点的全部候选」：
 * 实测 31/39 图层存在同一坐标挂多个 id（不同 lane 的变体），
 * 只确认其中一个会错杀真实 lane，所以整组一起作为一次约束。
 */
function groupWith(p) {
  if (!p || p.base) return [p.id]
  const pm = pointMap.value
  const me = pm.get(p.id)
  if (!me) return [p.id]
  const tol = coordTol.value
  const ids = [...nextSet.value].filter((id) => {
    const q = pm.get(id)
    return q && Math.abs(q.x - me.x) <= tol && Math.abs(q.y - me.y) <= tol
  })
  if (!ids.includes(p.id)) ids.push(p.id)
  return ids.sort()
}

/** 主基地 → 可读标签：Team 1 · USMC（数据来自 layer.teams = [team1, team2] 的默认兵种码） */
function unitShort(unit) { return String(unit || '').split('_')[0] }
function mainTeamLabel(cluster) {
  const teams = (layer.value && layer.value.teams) || []
  const key = String(cluster)
  let idx = -1
  if (/team2/i.test(key)) idx = 1
  else if (/team1/i.test(key)) idx = 0
  if (idx >= 0 && teams[idx]) return `Team ${idx + 1} · ${unitShort(teams[idx])}`
  // 兜底：键里直接写了阵营码（00-USAMain / 100-MILMain / 00-USA Main）
  const raw = key.replace(/\s*(Main|Base)\s*$/i, '').replace(/^\d+[-_ ]*/, '').trim()
  return raw || '主基地'
}
const spawnTeam = computed(() => (spawnId.value ? mainTeamLabel(spawnId.value) : ''))
const endTeam = computed(() => {
  const other = allSpawnIds.value.find((id) => id !== spawnId.value)
  return other ? mainTeamLabel(other) : ''
})

/** 全部点位（含主基地），按 id 去重：同一 objectName 可能挂多个 cluster */
const allPins = computed(() => {
  if (!layer.value) return []
  const seen = new Set()
  const out = []
  const sp = spawnId.value
  Object.entries(layer.value.nodes || {}).forEach(([cluster, o]) => {
    if (o.main) {
      if (seen.has(cluster)) return
      seen.add(cluster)
      if (sp) {
        const isSpawn = cluster === sp
        out.push({
          id: cluster, cluster, n: cluster, x: o.x, y: o.y, r: 0,
          base: isSpawn ? 'start' : 'end',
          label: isSpawn ? BASE_LABEL_START : BASE_LABEL_END,
          team: mainTeamLabel(cluster),
        })
      } else {
        // 关卡态：两个主基地都是「出生点」候选
        out.push({
          id: cluster, cluster, n: cluster, x: o.x, y: o.y, r: 0,
          base: 'main', label: `${BASE_LABEL_START} · ${mainTeamLabel(cluster)}`,
          team: mainTeamLabel(cluster),
        })
      }
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

const constraints = computed(() => confirmed.value.map((ids) => ({ ids })))
const solved = computed(() => (routes.value.length
  ? solveRoutes(routes.value, constraints.value)
  : { alive: 0, total: 0, byId: new Map(), steps: new Map(), survivors: [], impossible: false }))

/** 每条存活路线已确认的最深步；以及「仍可能刷新」「下一步可点」的集合 */
const depths = computed(() => routeDepths(solved.value.survivors, flatConfirmed.value))
const futureSet = computed(() => futureIds(solved.value.survivors, depths.value))
const nextSet = computed(() => nextIds(solved.value.survivors, depths.value))
const stepNo = computed(() => currentStepNo(solved.value.survivors, depths.value))
const done = computed(() => !!confirmed.value.length && !solved.value.impossible && stepNo.value === null)
const picking = computed(() => confirmed.value.length > 0)

/**
 * 地图点位。
 *   关卡态：只显示两个主基地（都可点，选完 = 第 0 点 + 定方向）
 *   选定后：出生点 = 第 0 点；对端主基地只是「终点」标记；
 *           不可能再刷新的点隐藏；后续仍可能刷新的可见（点不动会提示顺序）。
 */
const renderedPoints = computed(() => {
  if (!layer.value) return []
  const sp = spawnId.value
  const next = nextSet.value
  const future = futureSet.value
  const out = []

  // ── 关卡：先选出生点 ──
  if (!sp) {
    allPins.value.filter((p) => p.base === 'main').forEach((p) => {
      const { u, v } = projectPoint(layer.value, p.x, p.y)
      out.push({
        ...p, u, v, cls: 'is-spawn', clickable: true, prob: null, step: 0,
        title: `${p.label} · 第 0 点（选它作为你的出生点）`,
      })
    })
    return out
  }

  allPins.value.forEach((p) => {
    const gi = groupOf(p.id)
    const isConf = gi >= 0
    const isNext = next.has(p.id)
    let cls
    let clickable = false

    if (isConf) {
      // 同一物理点的多个变体只画一个
      if (confirmed.value[gi][0] !== p.id) return
      cls = 'is-confirmed'
    } else if (p.base === 'end') {
      cls = 'is-end'
    } else if (isNext) {
      cls = 'is-next'
      clickable = true
    } else if (future.has(p.id)) {
      cls = 'is-future'
      clickable = true // 点了不给确认，但会提示「请按顺序来」
    } else {
      return // 不可能再刷新 → 直接隐藏
    }

    const { u, v } = projectPoint(layer.value, p.x, p.y)
    const e = solved.value.byId.get(p.id)
    const prob = e && !p.base ? e.probability : null
    out.push({
      ...p, u, v, cls, clickable, prob,
      step: isConf ? gi : 0,
      title: p.base
        ? p.label
        : `${p.label}${prob !== null ? ` · ${Math.round(prob * 100)}%` : ''}`,
    })
  })
  return out
})

/** 密图（后续点很多）时后续点只留细圈 */
const densePins = computed(() => renderedPoints.value.filter((p) => p.cls === 'is-future').length > 120)

/**
 * 气泡：关卡态 = 两个出生点二选一；选定后按步序分组（第 0 点 = 出生点）。
 * 已确认 / 可点 / 后续用颜色区分。
 */
const bubbleGroups = computed(() => {
  if (!layer.value) return []
  const kw = search.value.trim().toLowerCase()
  const next = nextSet.value
  const future = futureSet.value
  const pickingNow = picking.value

  // ── 关卡：先选出生点 ──
  if (!spawnId.value) {
    const items = allPins.value
      .filter((p) => p.base === 'main')
      .filter((p) => !kw || p.label.toLowerCase().includes(kw))
      .map((p) => ({
        id: p.id, label: p.label, base: true, prob: null,
        confirmed: false, clickable: true, step: 0,
        title: `${p.label}（第 0 点）`,
      }))
    return items.length
      ? [{ cluster: '__spawn__', label: '先选你的出生点', stepNo: 0, order: -1, items }]
      : []
  }

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
    const gi = groupOf(p.id)
    const isConf = gi >= 0
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
    const atStep = stepOf.get(p.cluster)
    groups.get(p.cluster).items.push({
      id: p.id, label: p.base ? p.label : `${p.label}`,
      base: !!p.base,
      prob: e ? e.probability : null,
      confirmed: isConf,
      clickable: isNext,
      step: isConf ? gi : 0,
      title: p.base
        ? `${p.label}（第 0 点）`
        : `${p.label}${e ? ` · ${Math.round(e.probability * 100)}%` : ''}${atStep !== undefined ? ` · 最早第 ${atStep} 点` : ''}`,
    })
  })

  const arr = [...groups.values()]
  arr.forEach((g) => {
    g.items.sort((a, b) => (b.prob ?? -1) - (a.prob ?? -1) || a.label.localeCompare(b.label))
  })
  arr.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  return arr
})

/** 面板用路线：选定出生点后只留你这个方向（否则正反两向都列） */
const panelRoutes = computed(() => {
  const list = routes.value.map((r, i) => ({ ...r, index: i }))
  const sp = spawnId.value
  return sp ? list.filter((r) => r.steps[0] && r.steps[0].ids[0] === sp) : list
})
const laneRows = computed(() => {
  const seen = new Set()
  const out = []
  panelRoutes.value.forEach((r) => {
    if (seen.has(r.lane)) return
    seen.add(r.lane)
    out.push(r)
  })
  return out
})
const shownRoutes = computed(() => {
  const name = activeLane.value
  return panelRoutes.value.filter((r) => !name || r.lane === name)
})

const LANE_COLORS = ['#ff5c5c', '#4ea8ff', '#ffd23f', '#3ddc84', '#c084fc', '#ff9f45', '#5eead4', '#f472b6']
function laneColor(name) {
  const i = laneRows.value.findIndex((r) => r.lane === name)
  return LANE_COLORS[(i < 0 ? 0 : i) % LANE_COLORS.length]
}
function nameOf(id) {
  const p = pointMap.value.get(id)
  if (!p) return id
  return p.base ? p.n : displayName(p.cluster, p.n)
}

/** 点一个点位：关卡态只能选出生点；之后只有「下一步」允许 */
function tryConfirm(p) {
  if (groupOf(p.id) >= 0) {
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
      : `请按顺序来：现在该点第 ${n} 点${n === 0 ? '（出生点）' : ''}`)
    return
  }
  const ids = groupWith(p)
  confirmed.value.push(ids)
  if (confirmed.value.length === 1) {
    flash(`出生点已选：第 0 点 · ${p.team || p.label} → 接着点第 1 点`)
  } else if (ids.length > 1) {
    flash(`已确认：第 ${confirmed.value.length - 1} 点 · 同一位置的 ${ids.length} 个候选一起锁定`)
  }
}

function onPinClick(p) { tryConfirm(p) }
function unconfirmAt(i) {
  const removed = confirmed.value.length - i
  confirmed.value = confirmed.value.slice(0, i)
  if (i === 0) flash('已重选出生点，请重新选出生点')
  else if (removed > 1) flash(`已撤销第 ${i} 点及其之后的 ${removed - 1} 条记录`)
}
function reset() { confirmed.value = [] }
function onMapInteract() { if (sheetOpen.value) sheetOpen.value = false }

watch(layerName, () => { confirmed.value = []; activeLane.value = ''; search.value = ''; hint.value = '' })
</script>

<style scoped>
.raas-layer { max-width: 1400px; margin: 0 auto; padding: 20px 16px 48px; }

.raas-bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.raas-back { font-size: 13px; color: var(--sq-accent); text-decoration: none; }
.raas-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.raas-map-name { font-size: 20px; font-weight: 700; color: var(--sq-text); }
.raas-layer-name { font-size: 13px; font-weight: 700; letter-spacing: 1px; color: var(--sq-accent); }
.badge { font-size: 11px; color: var(--sq-text-3); border: 1px solid var(--sq-border-strong); padding: 2px 9px; border-radius: 12px; }
.badge.cl { color: #d9a13b; border-color: #b98b2f; }
.raas-tools { margin-left: auto; display: flex; gap: 8px; }

/* 单列：地图在上，面板在下（PC 不再被侧栏挤压） */
.raas-layout { display: flex; flex-direction: column; gap: 16px; }
.raas-mapwrap { position: relative; width: min(100%, calc(100vh - 190px)); margin: 0 auto; min-width: 0; }
.raas-layer.panels-off .raas-mapwrap { width: min(100%, calc(100vh - 130px)); }
.raas-side { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; align-items: start; }

.raas-gate {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  background: rgba(6, 40, 46, 0.92);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.6);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12.5px;
  z-index: 8;
  pointer-events: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  white-space: nowrap;
}
.raas-gate b { color: #7cf0ff; }

.raas-toast {
  position: absolute;
  left: 50%;
  top: 52px;
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
.lg.spawn { background: #22d3ee; box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.35); }
.lg.confirm { background: #3ddc84; }
.lg.next { background: #ffd23f; }
.lg.future { background: #8b98a8; }
.lg.base { background: #22d3ee; border-radius: 3px; }
.lg.end { background: transparent; border: 2px dashed #94a3b8; border-radius: 3px; box-sizing: border-box; }
.lg-toggle { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; }

/* 抽屉把手：桌面隐藏 */
.raas-sheet-head { display: none; }

.panel { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 10px; padding: 12px 14px; }
.panel.grow { display: flex; flex-direction: column; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; color: var(--sq-text); margin-bottom: 10px; }
.panel-hint { font-size: 12px; line-height: 1.8; color: var(--sq-text-3); }
.panel-hint b { color: var(--sq-accent); }
.mini { font-size: 11px; background: transparent; border: 1px solid var(--sq-border-strong); color: var(--sq-text-3); border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.mini:hover { border-color: var(--sq-accent); color: var(--sq-text); }
.mini-input { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--sq-border); background: var(--sq-input); color: var(--sq-text); outline: none; min-width: 0; flex: 1; }

.confirm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.confirm-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sq-text-2); }
.idx { width: 18px; height: 18px; border-radius: 50%; background: #3ddc84; color: #06210f; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.cname { flex: 1; }
.cmulti { font-style: normal; font-size: 10px; color: #22d3ee; border: 1px solid rgba(34, 211, 238, 0.5); border-radius: 8px; padding: 0 6px; white-space: nowrap; }
.cstep { font-size: 11px; color: var(--sq-text-3); white-space: nowrap; }

.stat-row { font-size: 13px; color: var(--sq-text-3); }
.stat-row b { font-size: 20px; color: #3ddc84; margin-right: 4px; }
.stat-row b.bad { color: #ff5c5c; }
.stat-sub { margin-top: 6px; font-size: 12px; color: var(--sq-text-3); }
.stat-sub b { color: #ffd23f; }
.dir-line { color: #22d3ee; }
.dir-line b { color: #7cf0ff; }
.warn { margin-top: 8px; font-size: 12px; color: #ff9f45; line-height: 1.7; }
.done { margin-top: 8px; font-size: 12px; color: #3ddc84; }

/* ── 气泡 ── */
.bubble-cloud { overflow-y: auto; max-height: 420px; display: flex; flex-direction: column; gap: 12px; padding-right: 2px; }
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

.seq-list { overflow-y: auto; max-height: 300px; display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
.seq-head { font-size: 12px; font-weight: 600; color: var(--sq-text); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.seq-dir { font-size: 10px; font-weight: 400; color: var(--sq-text-3); border: 1px solid var(--sq-border-strong); border-radius: 8px; padding: 0 6px; }
.seq-steps { display: flex; flex-direction: column; gap: 4px; }
.seq-step { font-size: 12px; color: var(--sq-text-3); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.seq-step b { color: var(--sq-accent); min-width: 14px; }
.seq-step em { font-style: normal; }
.seq-step em.hit { color: #3ddc84; font-weight: 700; }

.raas-missing { text-align: center; padding: 80px 20px; color: var(--sq-text-3); }

/* ── 手机：地图占满宽度，面板落成底部抽屉 ── */
@media (max-width: 640px) {
  .raas-layer { padding: 12px 12px 80px; }
  .raas-bar { gap: 10px; margin-bottom: 12px; }
  .raas-map-name { font-size: 17px; }
  .raas-tools { margin-left: 0; }
  .raas-mapwrap, .raas-layer.panels-off .raas-mapwrap { width: 100%; }
  .raas-layout { gap: 0; }
  .raas-gate { top: 8px; font-size: 11.5px; padding: 6px 10px; }
  .raas-toast { top: 44px; }

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
    grid-template-columns: 1fr;
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
