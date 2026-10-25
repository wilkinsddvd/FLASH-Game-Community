<template>
  <div class="roster-page" v-if="data">
    <!-- ══ 面包屑 / 编制概览（P0）══ -->
    <div class="crumb-bar">
      <RouterLink to="/squad" class="crumb-link">← SQUAD 编制</RouterLink>
      <span class="crumb-sep">/</span>
      <span>{{ data.faction.name }}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">{{ data.roster.name }}</span>
    </div>

    <div class="overview-card" :style="{ '--faction-theme': data.faction.theme }">
      <div class="ov-flag">
        <img v-if="data.faction.flag_url" :src="data.faction.flag_url" :alt="data.faction.code + ' 旗帜'" />
        <span v-else>{{ data.faction.code.slice(0, 1) }}</span>
      </div>
      <div class="ov-info">
        <div class="ov-tags">
          <span class="tag faction-tag">{{ data.faction.code }} · {{ data.faction.name }}</span>
          <span class="tag type-tag">
            <img v-if="data.roster.type_icon" :src="data.roster.type_icon" class="tag-icon" alt="" />
            {{ data.roster.type }}
          </span>
          <span class="tag type-tag-alt">{{ data.roster.type_key }}</span>
        </div>
        <h1 class="ov-name">{{ data.roster.name }}</h1>
        <p v-if="data.faction.intro" class="ov-intro">{{ data.faction.intro }}</p>
      </div>
      <div class="ov-anchor-nav">
        <a href="#vehicles" class="anchor-btn">🚛 载具配置</a>
        <a href="#tactics" class="anchor-btn">📐 编制特性</a>
        <a href="#traits" class="anchor-btn">🎖 阵营特色</a>
        <a href="#deployables" class="anchor-btn">🏗 前哨基地部署物</a>
        <a href="#abilities" class="anchor-btn">📡 指挥官技能</a>
      </div>
    </div>

    <!-- ══ 载具配置表（P0）══ -->
    <section id="vehicles" class="block">
      <div class="block-head">
        <h2>🚛 载具配置</h2>
        <div class="block-tools">
          <div class="filter-group">
            <button class="filter-btn" :class="{ active: vehicleFilter === 'all' }"
                    @click="vehicleFilter = 'all'">
              🗂️ 全部
            </button>
            <button v-for="c in vehicleClasses" :key="c.cls"
                    class="filter-btn" :class="{ active: vehicleFilter === c.cls }"
                    @click="vehicleFilter = vehicleFilter === c.cls ? 'all' : c.cls">
              {{ c.icon }} {{ c.label }} <b class="filter-count">{{ c.count }}</b>
            </button>
          </div>
          <select v-model="vehicleSort" class="sort-select">
            <option value="default">默认排序</option>
            <option value="tickets-desc">票数 ↓ 高到低</option>
            <option value="tickets-asc">票数 ↑ 低到高</option>
          </select>
        </div>
      </div>

      <p class="table-scroll-hint">← 左右滑动查看完整表格 →</p>
      <div class="table-wrap">
        <table class="roster-table">
          <thead>
            <tr>
              <th>载具名称</th>
              <th>类型</th>
              <th>数量</th>
              <th class="num-col" @click="cycleSort('tickets')">票数
                <span class="sort-hint">{{ sortMark('tickets') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="g in vehicleGroups" :key="g.key">
              <tr class="group-row">
                <td colspan="4">
                  <span class="group-icon">{{ g.icon }}</span>
                  <span class="group-name">{{ g.label }}</span>
                  <span class="group-count">{{ g.vehicles.length }} 型号</span>
                </td>
              </tr>
              <tr v-for="(v, vi) in g.vehicles" :key="g.key + '|' + v.name + '|' + vi"
                  class="veh-row"
                  tabindex="0"
                  @mouseenter="showTip($event, v)"
                  @mouseleave="scheduleHideTip"
                  @focus="showTip($event, v)"
                  @blur="scheduleHideTip"
                  @keydown.enter.prevent="openDetail(v)"
                  @keydown.esc="hideTip"
                  @click="onRowClick($event, v)">
                <td class="veh-name">
                  <img v-if="vehicleImg(v)" :src="vehicleImg(v)" class="veh-icon" :alt="v.name" loading="lazy" />
                  <span v-else class="veh-cat-icon">{{ classIcon(v.cls) }}</span>
                  {{ v.name }}
                </td>
                <td><span class="veh-type">{{ v.type }}</span></td>
                <td class="num-col"><b>{{ v.count }}</b></td>
                <td class="num-col">
                  <span class="ticket-badge" :style="{ background: ticketsLevel(v.tickets).color }">
                    {{ v.tickets }}
                  </span>
                  <span class="ticket-level" :style="{ color: ticketsLevel(v.tickets).color }">
                    {{ ticketsLevel(v.tickets).label }}
                  </span>
                </td>
              </tr>
            </template>
            <tr v-if="!filteredVehicles.length">
              <td colspan="4" class="empty-cell">该分类下暂无载具</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="legend">
        <span>票数：<i class="dot" style="background:#ff4d4f"></i> ≥10 高价值</span>
        <span><i class="dot" style="background:#fa8c16"></i> 5-9 中等</span>
        <span><i class="dot" style="background:#52c41a"></i> 1-4 低</span>
      </div>
    </section>

    <!-- 载具浮窗（悬停/聚焦）：视口夹取 + 靠右/靠下自动翻转 -->
    <Teleport to="body">
      <transition name="vtip">
        <div v-if="tip.visible" ref="tipEl" class="veh-tip" :style="tipStyle"
             @mouseenter="cancelHideTip" @mouseleave="scheduleHideTip">
          <RosterVehicleTip :vehicle="tip.vehicle" @open="openDetail" />
        </div>
      </transition>
    </Teleport>

    <!-- 载具完整资料（点击行 / 浮窗底部按钮 / 触屏单击） -->
    <Teleport to="body">
      <div v-if="detail" class="sheet-mask" @click.self="closeDetail">
        <div class="sheet-panel">
          <div class="sheet-bar">
            <span>载具详情</span>
            <button type="button" class="sheet-close" @click="closeDetail">✕</button>
          </div>
          <div class="sheet-content">
            <VehicleDetail :card="detail.card" :faction="detail.faction" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ 编制特性（P1）+ 阵营特色（P1）══ -->
    <div class="two-col">
      <section id="tactics" class="block">
        <h2 class="block-title">📐 编制特性</h2>
        <div class="tactics-body">
          <div class="tactic-item">
            <span class="tactic-label">优势</span>
            <ul class="tactic-list good">
              <li v-for="s in data.roster.tactics.strengths" :key="s">✔ {{ s }}</li>
            </ul>
          </div>
          <div class="tactic-item">
            <span class="tactic-label">劣势</span>
            <ul class="tactic-list bad">
              <li v-for="w in data.roster.tactics.weaknesses" :key="w">✘ {{ w }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 阵营特色：没特色的编制也保留本栏，显示「无特色」 -->
      <section id="traits" class="block">
        <h2 class="block-title">🎖 阵营特色</h2>
        <ul v-if="traits.length" class="traits-list">
          <li v-for="(t, i) in traits" :key="'tr' + i">
            <span class="trait-icon">✦</span><span class="trait-text">{{ t }}</span>
          </li>
        </ul>
        <div v-else class="empty-cell">无特色</div>
      </section>
    </div>

    <!-- ══ 前哨基地部署物（P1）+ 指挥官技能（P1）══ -->
    <div class="two-col">
      <section id="deployables" class="block">
        <h2 class="block-title">🏗 前哨基地部署物</h2>
        <ul v-if="deployables.length" class="deploy-list">
          <li v-for="(d, i) in deployables" :key="'dp' + i">
            <span class="deploy-icon">🔧</span><span class="deploy-text">{{ d }}</span>
          </li>
        </ul>
        <div v-else class="empty-cell">未配置</div>
      </section>

      <section id="abilities" class="block">
        <h2 class="block-title">📡 指挥官技能</h2>
        <div class="abilities-body">
          <div class="ability-item" v-for="a in data.roster.commander_abilities" :key="a">
            <span class="ability-icon">🛰️</span>
            <span class="ability-name">{{ a }}</span>
          </div>
          <div v-if="!data.roster.commander_abilities.length" class="empty-cell">该编制无指挥官支援技能</div>
        </div>
      </section>
    </div>

    <!-- ══ 页面导航（P2）══ -->
    <section class="block nav-block">
      <h2 class="block-title">🧭 其他编制</h2>
      <div class="nav-cols">
        <div class="nav-col" v-for="f in factions" :key="f.code">
          <div class="nav-faction" :style="{ color: f.theme }">
            <img v-if="f.flag_url" :src="f.flag_url" class="nav-flag" :alt="f.code" />
            {{ f.code }} {{ f.name }}
          </div>
          <RouterLink v-for="r in f.rosters" :key="r.key"
                      :to="`/squad/${f.code}/${r.key}`"
                      class="nav-roster" :class="{ current: f.code === data.faction.code && r.key === data.roster.key }">
            {{ r.name }} <span class="nav-type">({{ r.type }})</span>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="not-found">
    <h2>❌ 未找到该编制</h2>
    <RouterLink to="/squad" class="back-link">← 返回编制列表</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { FACTIONS, VEHICLE_CATEGORIES, ticketsLevel, fmtTime } from '../data/squad/factions'
import { loadSquadConfig } from '../data/squad/remote'
import { vehicleImageFor, isGenericOnly } from '../data/squad/vehicle-images'
import { classifyVehicle, VEHICLE_CLASS_ORDER, VEHICLE_CLASS_META, classIcon } from '../data/squad/vehicle-class'
import RosterVehicleTip from '../components/RosterVehicleTip.vue'
import VehicleDetail from '../components/VehicleDetail.vue'

const route = useRoute()

// 生效数据：优先后端覆盖（超管维护），否则静态
const factions = ref(FACTIONS)
const vehicleCategories = ref(VEHICLE_CATEGORIES)
const data = ref(null)
/** 阵营特色 / 前哨基地部署物（后端数据可能还没这两个字段，兜底空数组） */
const traits = computed(() => (data.value?.roster?.traits || []))
const deployables = computed(() => (data.value?.roster?.deployables || []))
const vehicleFilter = ref('all')
const vehicleSort = ref('default')

// ── 载具浮窗（S2）──
const tipEl = ref(null)
const tip = ref({ visible: false, left: 0, top: 0, width: 0, maxH: 0, vehicle: null })
let tipAnchor = null
let showTimer = null
let hideTimer = null
/** 触屏 / 无悬停设备：跳过浮窗，单击直接开详情 */
const coarsePointer = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(hover: none), (pointer: coarse)')
  : { matches: false }

const detail = ref(null)

function tipWidth() {
  const vw = window.innerWidth
  if (vw < 768) return Math.min(300, vw - 24)
  return Math.min(420, vw - 24)
}

function vehicleImg(v) {
  if (!v || isGenericOnly(v.name)) return ''
  return vehicleImageFor(v.name) || v.icon_url || ''
}

// 路由变化时加载对应编制
function load() {
  const faction = factions.value.find((f) => f.code === route.params.faction)
  const roster = faction?.rosters.find((r) => r.key === route.params.roster) || null
  data.value = faction && roster ? { faction, roster } : null
  vehicleFilter.value = 'all'
  vehicleSort.value = 'default'
  hideTip()
}
watch(() => route.params, load, { immediate: true })

// ── 15 类分类（严格按当前编制自己的载具）──
const classifiedVehicles = computed(() => {
  if (!data.value) return []
  return data.value.roster.vehicles.map((v) => ({
    ...v,
    cls: classifyVehicle(v.name, data.value.faction.code, v.type, v.category),
  }))
})

const vehicleClasses = computed(() => {
  const counts = new Map()
  for (const v of classifiedVehicles.value) {
    const key = v.cls || '__none__'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const out = VEHICLE_CLASS_ORDER
    .filter((cls) => counts.get(cls))
    .map((cls) => ({ cls, label: cls, icon: VEHICLE_CLASS_META[cls]?.icon || '🚗', count: counts.get(cls) }))
  if (counts.get('__none__')) {
    out.push({ cls: '__none__', label: '未分类', icon: '🚗', count: counts.get('__none__') })
  }
  return out
})

// ── 载具分组 + 筛选 + 排序 ──
const vehicleGroups = computed(() => {
  if (!data.value) return []
  const sort = vehicleSort.value
  const groups = []

  for (const cls of [...VEHICLE_CLASS_ORDER, '']) {
    if (vehicleFilter.value !== 'all' && vehicleFilter.value !== (cls || '__none__')) continue
    let list = classifiedVehicles.value.filter((v) => (v.cls || '') === cls)
    if (!list.length) continue
    if (sort === 'tickets-desc') list = list.slice().sort((a, b) => b.tickets - a.tickets)
    else if (sort === 'tickets-asc') list = list.slice().sort((a, b) => a.tickets - b.tickets)
    groups.push({
      key: cls || '__none__',
      label: cls || '未分类',
      icon: cls ? (VEHICLE_CLASS_META[cls]?.icon || '🚗') : '🚗',
      vehicles: list,
    })
  }
  return groups
})

const filteredVehicles = computed(() => vehicleGroups.value.flatMap((g) => g.vehicles))

// 表头点击排序（循环：升序 → 降序 → 默认）
const headerSort = ref({ key: null, dir: null })
function cycleSort(key) {
  const dirs = [null, 'asc', 'desc']
  const cur = headerSort.value.key === key ? headerSort.value.dir : null
  const next = dirs[(dirs.indexOf(cur) + 1) % dirs.length]
  headerSort.value = { key, dir: next }
  if (next === null) { vehicleSort.value = 'default'; return }
  vehicleSort.value = `${key}-${next}`
}
function sortMark(key) {
  if (headerSort.value.key !== key || !headerSort.value.dir) return '↕'
  return headerSort.value.dir === 'asc' ? '↑' : '↓'
}

// ── 浮窗定位 ──
const GAP = 10
const MARGIN = 12

/** 视口夹取 + 靠右溢出翻左、靠下溢出翻上；浮窗比视口还高时贴顶内部滚动 */
function placeTip() {
  if (!tipAnchor) return
  const el = tipEl.value
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = el ? el.offsetWidth : tipWidth()
  const h = el ? el.offsetHeight : 320
  const maxH = vh - MARGIN * 2
  const a = tipAnchor

  const clampX = (x) => Math.min(Math.max(MARGIN, x), Math.max(MARGIN, vw - w - MARGIN))
  const clampY = (y) => Math.min(Math.max(MARGIN, y), Math.max(MARGIN, vh - h - MARGIN))
  /** 候选位置必须整块在视口内，且不能压住正在看的这一行（否则行点不到） */
  const hitsRow = (x, y) =>
    x < a.right && x + w > a.left && y < a.bottom && y + h > a.top
  const fits = (x, y) =>
    x >= MARGIN - 0.5 && x + w <= vw - MARGIN + 0.5 &&
    y >= MARGIN - 0.5 && y + h <= vh - MARGIN + 0.5

  const candidates = [
    [a.right + GAP, a.top],            // 右侧
    [a.left - w - GAP, a.top],         // 左侧
    [a.right + GAP, a.bottom + GAP],   // 右下
    [a.left - w - GAP, a.bottom + GAP],// 左下
    [clampX(a.right + GAP), a.bottom + GAP], // 正下方（夹取 x）
    [clampX(a.right + GAP), a.top - h - GAP],// 正上方（夹取 x）
    [clampX(a.right + GAP), a.bottom + GAP],
  ]

  let left = null
  let top = null
  for (const [cx, cy] of candidates) {
    const x = clampX(cx)
    const y = clampY(cy)
    if (fits(x, y) && !hitsRow(x, y)) { left = x; top = y; break }
  }
  if (left === null) {
    // 实在放不下（浮窗比视口还高）：贴左上，允许压住行，内部滚动
    left = clampX(a.right + GAP)
    top = MARGIN
  }

  tip.value = {
    ...tip.value,
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(w),
    maxH: Math.round(maxH),
  }
}

function showTip(e, v) {
  if (coarsePointer.matches) return
  clearTimeout(hideTimer)
  clearTimeout(showTimer)
  const anchorEl = e.currentTarget
  showTimer = setTimeout(() => {
    const r = anchorEl.getBoundingClientRect()
    tipAnchor = { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    tip.value = { visible: true, left: 0, top: 0, width: tipWidth(), maxH: 0, vehicle: v }
    nextTick(placeTip)
  }, 110)
}

function scheduleHideTip() {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { tip.value.visible = false }, 160)
}
function cancelHideTip() {
  clearTimeout(hideTimer)
}
function hideTip() {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  tip.value.visible = false
}

const tipStyle = computed(() => ({
  left: `${tip.value.left}px`,
  top: `${tip.value.top}px`,
  width: `${tip.value.width}px`,
  maxHeight: tip.value.maxH ? `${tip.value.maxH}px` : 'none',
}))

// ── 载具详情（点击行 / 浮窗按钮 / 触屏单击）──
function onRowClick(e, v) {
  // 浮窗里的按钮自己处理
  if (e.target.closest('.vtip-more')) return
  openDetail(v)
}

function openDetail(v) {
  if (!data.value) return
  hideTip()
  detail.value = {
    faction: data.value.faction,
    card: {
      name: v.name,
      cls: v.cls,
      type: v.type,
      category: v.category,
      icon_url: vehicleImg(v),
      cls_key: v.cls,
      entries: [{
        rosterName: data.value.roster.name,
        rosterKey: data.value.roster.key,
        tickets: v.tickets ?? null,
        respawn_time: v.respawn_time ?? null,
        initial_delay: v.initial_delay ?? null,
        count: v.count ?? null,
      }],
      notes: v.note ? [v.note] : [],
    },
  }
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  detail.value = null
  document.body.style.overflow = ''
}

// ── 锚点平滑滚动（事件委托） ──
function onDocClick(e) {
  const anchor = e.target.closest('.anchor-btn')
  if (anchor?.getAttribute('href')?.startsWith('#')) {
    e.preventDefault()
    document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' })
  }
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (detail.value) { closeDetail(); return }
  hideTip()
}
function onViewportChange() {
  if (tip.value.visible) hideTip()
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
  const cfg = await loadSquadConfig()
  if (cfg) {
    factions.value = cfg.factions
    if (cfg.vehicleCategories && Object.keys(cfg.vehicleCategories).length) {
      vehicleCategories.value = { all: { label: '全部', icon: '🗂️' }, ...cfg.vehicleCategories }
    }
  }
  load()
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ═══════ 军事硬核风格（亮/暗双主题，跟随站点 data-theme） ═══════ */
.roster-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 48px;
  color: var(--sq-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
}

/* ── 面包屑 ── */
.crumb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sq-text-3);
  margin-bottom: 16px;
}
.crumb-link { color: var(--sq-accent); text-decoration: none; }
.crumb-link:hover { text-decoration: underline; }
.crumb-sep { color: var(--sq-border-strong); }
.crumb-current { color: var(--sq-text); font-weight: 600; }

/* ── 编制概览 ── */
.overview-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: var(--sq-hero-grad);
  border: 1px solid var(--sq-border);
  border-left: 4px solid var(--faction-theme);
  border-radius: 10px;
  padding: 24px 28px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.ov-flag {
  width: 64px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.ov-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ov-info { flex: 1; min-width: 260px; }
.ov-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; align-items: center; }
.tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tag-icon { width: 16px; height: 16px; }
.faction-tag { color: var(--faction-theme); border-color: var(--faction-theme); background: var(--sq-hover); }
.type-tag { color: var(--sq-text-2); border-color: var(--sq-border-strong); background: var(--sq-hover); }
.type-tag-alt { color: var(--sq-text-3); border-color: var(--sq-border); font-family: 'SF Mono', Consolas, monospace; }
.ov-name { font-size: 26px; color: var(--sq-hero-text); letter-spacing: 1px; margin-bottom: 8px; }
.ov-intro { font-size: 13px; color: var(--sq-hero-sub); line-height: 1.7; max-width: 640px; margin-top: 6px; opacity: .88; }
.ov-anchor-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  align-self: center;
}
.anchor-btn {
  font-size: 13px;
  color: var(--sq-text-2);
  background: var(--sq-hover);
  border: 1px solid var(--sq-border-strong);
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.anchor-btn:hover { background: var(--faction-theme); color: #fff; border-color: var(--faction-theme); }

/* ── 区块通用 ── */
.block {
  background: var(--sq-card);
  border: 1px solid var(--sq-border);
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 24px;
}
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.block-head h2, .block-title {
  font-size: 18px;
  color: var(--sq-text);
  letter-spacing: 1px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.block-title { margin-bottom: 14px; }

/* ── 筛选 + 排序 ── */
.block-tools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid var(--sq-border-strong);
  background: transparent;
  color: var(--sq-text-3);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover { color: var(--sq-text); border-color: var(--sq-border-strong); }
.filter-btn.active {
  background: var(--sq-accent-bg);
  color: #fff;
  border-color: var(--sq-accent-border);
}
.filter-count { opacity: .75; font-size: 11px; margin-left: 2px; }
.sort-select {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--sq-border-strong);
  background: var(--sq-input);
  color: var(--sq-text-2);
  cursor: pointer;
  outline: none;
}

/* ── 表格 ── */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
/* 仅小屏显示（提示表格需横向滑动） */
.table-scroll-hint { display: none; }
.roster-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 640px;
}
.roster-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid var(--sq-border-strong);
  color: var(--sq-text-3);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.roster-table th.num-col { cursor: pointer; user-select: none; }
.roster-table th.num-col:hover { color: var(--sq-accent); }
.sort-hint { font-size: 11px; color: var(--sq-accent); }
.roster-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--sq-border-subtle);
}
.roster-table tbody tr:hover { background: var(--sq-hover); }
.roster-table .group-row td {
  background: var(--sq-hover);
  border-top: 1px solid var(--sq-border);
  border-bottom: 1px solid var(--sq-border);
  padding: 8px 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sq-text);
}
.roster-table .group-row:first-child td { border-top: 0; }
.group-icon { margin-right: 6px; }
.group-name { letter-spacing: .3px; }
.group-count { margin-left: 10px; font-weight: 400; font-size: 11px; color: var(--sq-text-3); }
.veh-name { font-weight: 600; color: var(--sq-text); display: flex; align-items: center; gap: 8px; }
.veh-icon {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--sq-border);
  background: var(--sq-input);
  flex-shrink: 0;
}
.veh-cat-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.veh-type {
  font-size: 12px;
  color: var(--sq-text-3);
  border: 1px solid var(--sq-border-strong);
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.num-col { text-align: center; white-space: nowrap; }
.muted { color: var(--sq-text-3); }



.ticket-badge {
  display: inline-block;
  min-width: 28px;
  padding: 1px 6px;
  border-radius: 4px;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  text-align: center;
}
.ticket-level { font-size: 11px; margin-left: 6px; }
.empty-cell { text-align: center; color: var(--sq-text-3); padding: 24px; }
.legend {
  margin-top: 12px;
  font-size: 12px;
  color: var(--sq-text-3);
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
.sep { color: var(--sq-border-strong); }

/* ── 载具浮窗（S2）── */
.veh-tip {
  position: fixed;
  z-index: 3000;
  overflow: hidden auto;
  border-radius: 12px;
  pointer-events: auto;
  will-change: left, top;
}
.vtip-enter-active, .vtip-leave-active { transition: opacity .14s ease, transform .14s ease; }
.vtip-enter-from, .vtip-leave-to { opacity: 0; transform: translateY(2px); }

/* 可点的载具行 */
.veh-row { cursor: pointer; }
.veh-row:focus-visible {
  outline: 2px solid var(--sq-accent);
  outline-offset: -2px;
}

/* 载具详情抽屉 */
.sheet-mask {
  position: fixed; inset: 0; z-index: 3100; background: rgba(0, 0, 0, .55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet-panel {
  width: 100%; max-width: 560px; max-height: 88vh; background: var(--sq-card);
  border-radius: 14px 14px 0 0; border: 1px solid var(--sq-border-strong);
  display: flex; flex-direction: column;
}
.sheet-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--sq-border);
  font-size: 13px; font-weight: 700; color: var(--sq-text);
}
.sheet-close {
  border: 0; background: transparent; color: var(--sq-text-2); font-size: 16px;
  cursor: pointer; padding: 2px 6px;
}
.sheet-content { padding: 12px 14px 22px; overflow: auto; }

@media (max-width: 767px) {
  .sheet-panel { max-width: none; border-radius: 14px 14px 0 0; }
}



















.mono { font-family: 'SF Mono', Consolas, monospace; }


/* ── 双栏（特性 + 技能） ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.tactics-body, .abilities-body { display: flex; flex-direction: column; gap: 12px; }
/* 阵营特色 / 前哨基地部署物 */
.traits-list, .deploy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.traits-list li, .deploy-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 13px;
  background: var(--sq-card-alt);
  border: 1px solid var(--sq-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--sq-text);
  line-height: 1.5;
}
.trait-icon { color: #d9a13b; flex-shrink: 0; }
.deploy-icon { flex-shrink: 0; opacity: 0.85; }
.trait-text, .deploy-text { min-width: 0; }
.tactic-item { display: flex; gap: 12px; font-size: 14px; }
.tactic-label {
  width: 68px;
  flex-shrink: 0;
  color: var(--sq-text-3);
  font-size: 13px;
  padding-top: 2px;
}
.tactic-val { color: var(--sq-text); }
.tactic-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.tactic-list.good li { color: var(--sq-good); }
.tactic-list.bad li { color: var(--sq-bad); }
.ability-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--sq-card-alt);
  border: 1px solid var(--sq-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--sq-text);
}
.ability-icon { font-size: 16px; }

/* ── 底部导航 ── */
.nav-cols {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.nav-faction {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-flag { width: 22px; height: 15px; border-radius: 2px; object-fit: cover; }
.nav-roster {
  display: block;
  font-size: 13px;
  color: var(--sq-text-3);
  text-decoration: none;
  padding: 4px 0 4px 8px;
  border-left: 2px solid var(--sq-border);
  margin-bottom: 4px;
  transition: all 0.15s;
}
.nav-roster:hover { color: var(--sq-accent); border-left-color: var(--sq-accent); padding-left: 12px; }
.nav-roster.current { color: var(--sq-text); border-left-color: var(--sq-accent); background: var(--sq-current-bg); }
.nav-type { color: var(--sq-text-3); font-size: 12px; }

/* ── 未找到 ── */
.not-found { text-align: center; padding: 80px 20px; color: var(--sq-text-3); }
.not-found h2 { color: var(--sq-bad); margin-bottom: 16px; }
.back-link { color: var(--sq-accent); text-decoration: none; }

/* ── 响应式 ── */
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
  .ov-anchor-nav { width: 100%; }
}
@media (max-width: 768px) {
  .overview-card { padding: 18px; }
  .ov-name { font-size: 21px; }
  .block { padding: 16px; }
  .table-scroll-hint {
    display: block;
    margin: 0 0 6px;
    text-align: right;
    font-size: 12px;
    color: var(--sq-text-3);
  }
  .sort-hint { font-size: 12px; }
}
</style>
