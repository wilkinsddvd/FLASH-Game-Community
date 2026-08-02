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
        <p class="ov-desc">{{ data.roster.description }}</p>
      </div>
      <div class="ov-anchor-nav">
        <a href="#vehicles" class="anchor-btn">🚛 载具配置</a>
        <a href="#kits" class="anchor-btn">🎒 特装装备</a>
        <a href="#tactics" class="anchor-btn">📐 编制特性</a>
        <a href="#abilities" class="anchor-btn">📡 指挥官技能</a>
      </div>
    </div>

    <!-- ══ 载具配置表（P0）══ -->
    <section id="vehicles" class="block">
      <div class="block-head">
        <h2>🚛 载具配置</h2>
        <div class="block-tools">
          <div class="filter-group">
            <button v-for="(cat, key) in VEHICLE_CATEGORIES" :key="key"
                    class="filter-btn" :class="{ active: vehicleFilter === key }"
                    @click="vehicleFilter = key">
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>
          <select v-model="vehicleSort" class="sort-select">
            <option value="default">默认排序</option>
            <option value="tickets-desc">票数 ↓ 高到低</option>
            <option value="tickets-asc">票数 ↑ 低到高</option>
            <option value="respawn-desc">复活时间 ↓ 长到短</option>
            <option value="respawn-asc">复活时间 ↑ 短到长</option>
          </select>
        </div>
      </div>

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
              <th class="num-col" @click="cycleSort('respawn')">复活时间
                <span class="sort-hint">{{ sortMark('respawn') }}</span>
              </th>
              <th class="num-col">初始延迟</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in filteredVehicles" :key="v.name"
                @mouseenter="showTip($event, v)"
                @mousemove="moveTip($event)"
                @mouseleave="hideTip">
              <td class="veh-name">
                <img v-if="v.icon_url" :src="v.icon_url" class="veh-icon" :alt="v.name" loading="lazy" />
                <span v-else class="veh-cat-icon">{{ catIcon(v.category) }}</span>
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
              <td class="num-col" :style="{ color: respawnLevel(v.respawn_time).color }">
                {{ fmtTime(v.respawn_time) }}
              </td>
              <td class="num-col muted">{{ fmtTime(v.initial_delay) }}</td>
            </tr>
            <tr v-if="!filteredVehicles.length">
              <td colspan="6" class="empty-cell">该分类下暂无载具</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="legend">
        <span>票数：<i class="dot" style="background:#ff4d4f"></i> ≥10 高价值</span>
        <span><i class="dot" style="background:#fa8c16"></i> 5-9 中等</span>
        <span><i class="dot" style="background:#52c41a"></i> 1-4 低</span>
        <span class="sep">|</span>
        <span>复活：<i class="dot" style="background:#52c41a"></i> 短</span>
        <span><i class="dot" style="background:#faad14"></i> 中</span>
        <span><i class="dot" style="background:#ff4d4f"></i> 长</span>
      </div>
    </section>

    <!-- 自定义 Tooltip -->
    <transition name="tip">
      <div v-if="tip.visible" class="custom-tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
        <img v-if="tip.vehicle.icon_url" :src="tip.vehicle.icon_url" class="tip-img" :alt="tip.vehicle.name" />
        <div class="tip-title">{{ tip.vehicle.name }}</div>
        <div class="tip-row"><span>类型</span><b>{{ tip.vehicle.type }}</b></div>
        <div class="tip-row"><span>数量</span><b>{{ tip.vehicle.count }}</b></div>
        <div class="tip-row"><span>票数</span><b :style="{ color: ticketsLevel(tip.vehicle.tickets).color }">{{ tip.vehicle.tickets }}</b></div>
        <div class="tip-row"><span>复活</span><b :style="{ color: respawnLevel(tip.vehicle.respawn_time).color }">{{ fmtTime(tip.vehicle.respawn_time) }}</b></div>
        <div class="tip-row" v-if="tip.vehicle.initial_delay"><span>初始延迟</span><b>{{ fmtTime(tip.vehicle.initial_delay) }}</b></div>
        <div class="tip-note" v-if="tip.vehicle.note">{{ tip.vehicle.note }}</div>
      </div>
    </transition>

    <!-- ══ 特装装备表（P0）══ -->
    <section id="kits" class="block">
      <div class="block-head">
        <h2>🎒 特装装备</h2>
        <button class="collapse-all" @click="toggleAll">
          {{ allExpanded ? '全部折叠 ▴' : '全部展开 ▾' }}
        </button>
      </div>

      <div class="kit-list">
        <div class="kit-card" v-for="(k, idx) in data.roster.specialist_kits" :key="k.name">
          <div class="kit-head" @click="toggleKit(idx)">
            <div class="kit-title">
              <span class="kit-name">{{ k.name }}</span>
              <span class="kit-type">{{ k.type }}</span>
            </div>
            <div class="kit-meta">
              <span class="kit-limit">👥 限 {{ k.limit }} 人</span>
              <span class="kit-arrow" :class="{ open: expanded[idx] }">▾</span>
            </div>
          </div>
          <div class="kit-body" v-show="expanded[idx]">
            <div class="kit-row">
              <span class="kit-label">主武器</span><span class="kit-val mono">{{ k.primary }}</span>
            </div>
            <div class="kit-row">
              <span class="kit-label">副武器</span><span class="kit-val mono">{{ k.secondary }}</span>
            </div>
            <div class="kit-row">
              <span class="kit-label">装备</span>
              <span class="kit-val">
                <span class="gear-chip" v-for="g in k.gear" :key="g">{{ g }}</span>
              </span>
            </div>
            <div class="kit-row" v-if="k.special">
              <span class="kit-label">特殊装备</span>
              <span class="kit-val special">⭐ {{ k.special }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ 编制特性（P1）+ 指挥官技能（P1）══ -->
    <div class="two-col">
      <section id="tactics" class="block">
        <h2 class="block-title">📐 编制特性</h2>
        <div class="tactics-body">
          <div class="tactic-item">
            <span class="tactic-label">战术定位</span>
            <span class="tactic-val">{{ data.roster.tactics.role }}</span>
          </div>
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
        <div class="nav-col" v-for="f in FACTIONS" :key="f.code">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  FACTIONS, VEHICLE_CATEGORIES,
  findRoster, ticketsLevel, respawnLevel, fmtTime,
} from '../data/squad/factions'

const route = useRoute()

const data = ref(null)
const vehicleFilter = ref('all')
const vehicleSort = ref('default')
const expanded = ref([])
const allExpanded = ref(false)

// 自定义 Tooltip 状态
const tip = ref({ visible: false, x: 0, y: 0, vehicle: null })

// 路由变化时加载对应编制
function load() {
  const found = findRoster(route.params.faction, route.params.roster)
  data.value = found ? { faction: found.faction, roster: found.roster } : null
  expanded.value = []
  allExpanded.value = false
  vehicleFilter.value = 'all'
  vehicleSort.value = 'default'
  hideTip()
}
watch(() => route.params, load, { immediate: true })

// ── 载具分类图标 ──
function catIcon(cat) {
  return VEHICLE_CATEGORIES[cat]?.icon || '🚗'
}

// ── 载具筛选 + 排序 ──
const filteredVehicles = computed(() => {
  if (!data.value) return []
  let list = data.value.roster.vehicles.slice()
  if (vehicleFilter.value !== 'all') {
    list = list.filter((v) => v.category === vehicleFilter.value)
  }
  const sort = vehicleSort.value
  if (sort === 'tickets-desc') list.sort((a, b) => b.tickets - a.tickets)
  else if (sort === 'tickets-asc') list.sort((a, b) => a.tickets - b.tickets)
  else if (sort === 'respawn-desc') list.sort((a, b) => b.respawn_time - a.respawn_time)
  else if (sort === 'respawn-asc') list.sort((a, b) => a.respawn_time - b.respawn_time)
  return list
})

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

// ── Tooltip ──
function showTip(e, v) {
  tip.value = { visible: true, x: e.clientX + 14, y: e.clientY + 14, vehicle: v }
}
function moveTip(e) {
  if (tip.value.visible) {
    tip.value.x = e.clientX + 14
    tip.value.y = e.clientY + 14
  }
}
function hideTip() {
  tip.value.visible = false
}

// ── 特装折叠 ──
function toggleKit(idx) {
  expanded.value[idx] = !expanded.value[idx]
  allExpanded.value = expanded.value.every(Boolean) && expanded.value.length > 0
}
function toggleAll() {
  allExpanded.value = !allExpanded.value
  data.value.roster.specialist_kits.forEach((_, i) => {
    expanded.value[i] = allExpanded.value
  })
}

// ── 锚点平滑滚动（事件委托） ──
function onDocClick(e) {
  const anchor = e.target.closest('.anchor-btn')
  if (anchor?.getAttribute('href')?.startsWith('#')) {
    e.preventDefault()
    document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
/* ═══════ 军事硬核深色风格 ═══════ */
.roster-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 48px;
  color: #d8d8e4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
}

/* ── 面包屑 ── */
.crumb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #88889e;
  margin-bottom: 16px;
}
.crumb-link { color: #66b1ff; text-decoration: none; }
.crumb-link:hover { text-decoration: underline; }
.crumb-sep { color: #44445a; }
.crumb-current { color: #d8d8e4; font-weight: 600; }

/* ── 编制概览 ── */
.overview-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: linear-gradient(135deg, #1a1a2e 0%, #151a22 60%, #0f1419 100%);
  border: 1px solid #2a2a3e;
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
.faction-tag { color: var(--faction-theme); border-color: var(--faction-theme); background: rgba(255,255,255,0.03); }
.type-tag { color: #e0e0ec; border-color: #3a3a52; background: rgba(255,255,255,0.04); }
.type-tag-alt { color: #88889e; border-color: #2a2a3e; font-family: 'SF Mono', Consolas, monospace; }
.ov-name { font-size: 26px; color: #fff; letter-spacing: 1px; margin-bottom: 8px; }
.ov-desc { font-size: 14px; color: #9a9ab0; line-height: 1.7; max-width: 640px; }
.ov-anchor-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  align-self: center;
}
.anchor-btn {
  font-size: 13px;
  color: #b8b8cc;
  background: rgba(255,255,255,0.05);
  border: 1px solid #33334c;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.anchor-btn:hover { background: var(--faction-theme); color: #fff; border-color: var(--faction-theme); }

/* ── 区块通用 ── */
.block {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
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
  color: #fff;
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
  border: 1px solid #33334c;
  background: transparent;
  color: #9a9ab0;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover { color: #d8d8e4; border-color: #55556e; }
.filter-btn.active {
  background: #2f5d8a;
  color: #fff;
  border-color: #4a8bc7;
}
.sort-select {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #33334c;
  background: #12121f;
  color: #b8b8cc;
  cursor: pointer;
  outline: none;
}

/* ── 表格 ── */
.table-wrap { overflow-x: auto; }
.roster-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 640px;
}
.roster-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #33334c;
  color: #9a9ab0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.roster-table th.num-col { cursor: pointer; user-select: none; }
.roster-table th.num-col:hover { color: #66b1ff; }
.sort-hint { font-size: 11px; color: #66b1ff; }
.roster-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #232338;
}
.roster-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.veh-name { font-weight: 600; color: #e8e8f2; display: flex; align-items: center; gap: 8px; }
.veh-icon {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #2a2a3e;
  background: #12121f;
  flex-shrink: 0;
}
.veh-cat-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.veh-type {
  font-size: 12px;
  color: #9a9ab0;
  border: 1px solid #33334c;
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.num-col { text-align: center; white-space: nowrap; }
.muted { color: #66667e; }
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
.empty-cell { text-align: center; color: #66667e; padding: 24px; }
.legend {
  margin-top: 12px;
  font-size: 12px;
  color: #88889e;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
.sep { color: #33334c; }

/* ── 自定义 Tooltip ── */
.custom-tip {
  position: fixed;
  z-index: 999;
  background: #0f1419;
  border: 1px solid #3a3a52;
  border-left: 3px solid var(--faction-theme, #66b1ff);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 220px;
  max-width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  font-size: 13px;
}
.tip-img {
  width: 100%;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2a2a3e;
  margin-bottom: 8px;
  background: #12121f;
}
.tip-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #2a2a3e;
}
.tip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 3px 0;
  color: #9a9ab0;
}
.tip-row b { color: #e8e8f2; font-weight: 600; }
.tip-note {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #2a2a3e;
  color: #66b1ff;
  font-size: 12px;
}
.tip-enter-active, .tip-leave-active { transition: opacity 0.15s; }
.tip-enter-from, .tip-leave-to { opacity: 0; }

/* ── 特装卡片 ── */
.collapse-all {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #33334c;
  background: transparent;
  color: #9a9ab0;
  cursor: pointer;
}
.collapse-all:hover { color: #fff; border-color: #66b1ff; }
.kit-list { display: flex; flex-direction: column; gap: 10px; }
.kit-card {
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  overflow: hidden;
  background: #16162a;
}
.kit-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.kit-head:hover { background: rgba(255,255,255,0.04); }
.kit-title { display: flex; align-items: center; gap: 10px; }
.kit-name { font-size: 15px; font-weight: 700; color: #e8e8f2; }
.kit-type {
  font-size: 12px;
  color: #66b1ff;
  border: 1px solid #2f5d8a;
  padding: 1px 8px;
  border-radius: 10px;
}
.kit-meta { display: flex; align-items: center; gap: 14px; }
.kit-limit { font-size: 12px; color: #9a9ab0; }
.kit-arrow { color: #66667e; transition: transform 0.2s; }
.kit-arrow.open { transform: rotate(180deg); }
.kit-body {
  padding: 4px 16px 14px;
  border-top: 1px dashed #2a2a3e;
  background: rgba(0,0,0,0.2);
}
.kit-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
  flex-wrap: wrap;
}
.kit-label {
  width: 68px;
  flex-shrink: 0;
  color: #88889e;
  font-size: 13px;
  padding-top: 2px;
}
.kit-val { color: #d8d8e4; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.kit-val.special { color: #faad14; font-weight: 600; }
.mono { font-family: 'SF Mono', Consolas, monospace; }
.gear-chip {
  font-size: 12px;
  background: #232338;
  border: 1px solid #33334c;
  padding: 2px 10px;
  border-radius: 4px;
  color: #b8b8cc;
}

/* ── 双栏（特性 + 技能） ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.tactics-body, .abilities-body { display: flex; flex-direction: column; gap: 12px; }
.tactic-item { display: flex; gap: 12px; font-size: 14px; }
.tactic-label {
  width: 68px;
  flex-shrink: 0;
  color: #88889e;
  font-size: 13px;
  padding-top: 2px;
}
.tactic-val { color: #d8d8e4; }
.tactic-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.tactic-list.good li { color: #95d39a; }
.tactic-list.bad li { color: #e08a8a; }
.ability-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #16162a;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  font-size: 14px;
  color: #d8d8e4;
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
  color: #9a9ab0;
  text-decoration: none;
  padding: 4px 0 4px 8px;
  border-left: 2px solid #2a2a3e;
  margin-bottom: 4px;
  transition: all 0.15s;
}
.nav-roster:hover { color: #66b1ff; border-left-color: #66b1ff; padding-left: 12px; }
.nav-roster.current { color: #fff; border-left-color: #66b1ff; background: rgba(102,177,255,0.06); }
.nav-type { color: #55556e; font-size: 12px; }

/* ── 未找到 ── */
.not-found { text-align: center; padding: 80px 20px; color: #9a9ab0; }
.not-found h2 { color: #e08a8a; margin-bottom: 16px; }
.back-link { color: #66b1ff; text-decoration: none; }

/* ── 响应式 ── */
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
  .ov-anchor-nav { width: 100%; }
}
@media (max-width: 768px) {
  .overview-card { padding: 18px; }
  .ov-name { font-size: 21px; }
  .block { padding: 16px; }
  .kit-row { flex-direction: column; gap: 4px; }
}
</style>
