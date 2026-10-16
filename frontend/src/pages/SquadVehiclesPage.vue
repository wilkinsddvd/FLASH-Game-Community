<template>
  <div class="squad-veh">
    <!-- 页头 -->
    <div class="veh-hero">
      <div class="hero-title">
        <span class="hero-logo">🚛</span>
        <div>
          <h1>SQUAD 载具信息</h1>
          <p>按 {{ totals.rosters }} 份编制统计 · 各阵营载具型号 / 数量 / 票数 / 复活时间</p>
        </div>
      </div>
      <div class="hero-meta">
        <span>🌍 {{ totals.factions }} 阵营</span>
        <span>📋 {{ totals.rosters }} 编制</span>
        <span>🚗 {{ totals.uniqueVehicles }} 型号</span>
        <span>🧮 {{ totals.entries }} 条配置</span>
        <span>🏁 共 {{ totals.totalUnits }} 台</span>
      </div>
    </div>

    <!-- 类别总览（点一下筛选） -->
    <div class="cat-strip">
      <button class="cat-chip" :class="{ on: catFilter === 'all' }" @click="catFilter = 'all'">
        🗂️ 全部 <b>{{ totals.uniqueVehicles }}</b>
      </button>
      <button v-for="c in catRows" :key="c.key" class="cat-chip"
              :class="{ on: catFilter === c.key }"
              :title="`${c.label}：${c.unique} 型号 / ${c.entries} 条配置 / ${c.totalUnits} 台`"
              @click="catFilter = catFilter === c.key ? 'all' : c.key">
        {{ c.icon }} {{ c.label }} <b>{{ c.unique }}</b>
      </button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <input v-model="search" class="search-input" type="text"
             placeholder="🔍 搜索载具名 / 类型，如：M1A1、坦克、橡皮艇…" />
      <div class="view-switch">
        <button :class="{ on: view === 'vehicle' }" @click="view = 'vehicle'">🚗 按载具</button>
        <button :class="{ on: view === 'faction' }" @click="view = 'faction'">🌍 按阵营</button>
      </div>
      <select v-model="sort" class="sort-select">
        <option value="default">{{ view === 'vehicle' ? '默认排序（类别 → 台数）' : '默认排序（类别 → 台数）' }}</option>
        <option value="units-desc">总台数 ↓</option>
        <option value="tickets-desc">票数 ↓</option>
        <option value="respawn-desc">复活时间 ↓</option>
        <option value="appear-desc">出现次数 ↓</option>
        <option value="name-asc">名称 A→Z</option>
      </select>
      <span class="hit-count">{{ hitCount }} 项</span>
    </div>

    <!-- 阵营筛选 -->
    <div class="fac-filters">
      <button class="fac-chip" :class="{ on: facFilter === 'all' }" @click="facFilter = 'all'">全部阵营</button>
      <button v-for="f in factions" :key="f.code" class="fac-chip"
              :class="{ on: facFilter === f.code }"
              :title="f.name"
              @click="facFilter = facFilter === f.code ? 'all' : f.code">
        <img v-if="f.flag_url" :src="f.flag_url" class="fac-chip-flag" :alt="f.code" />
        {{ f.code }}
      </button>
    </div>

    <!-- ══ 视图 A：按载具 ══ -->
    <section v-if="view === 'vehicle'" class="block">
      <div class="table-wrap">
        <table class="veh-table">
          <thead>
            <tr>
              <th>载具</th>
              <th>类别</th>
              <th>类型</th>
              <th class="num">票数</th>
              <th class="num">复活</th>
              <th class="num">初始延迟</th>
              <th class="num">出现范围</th>
              <th class="num">总台数</th>
              <th class="num"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="v in vehicleRows" :key="v.key">
              <tr class="veh-row" :class="{ open: openKey === v.key }" @click="openKey = openKey === v.key ? '' : v.key">
                <td class="cell-name">
                  <img v-if="v.icon_url" :src="v.icon_url" class="veh-icon" :alt="v.name" loading="lazy" />
                  <span v-else class="veh-cat-icon">{{ v.catIcon }}</span>
                  <span class="veh-name-text">{{ v.name }}</span>
                </td>
                <td><span class="cat-badge">{{ v.catIcon }} {{ v.catLabel }}</span></td>
                <td class="cell-type">{{ v.type }}</td>
                <td class="num">
                  <span v-if="v.tickets !== null" class="ticket-badge" :style="{ background: ticketsLevel(v.tickets).color }">{{ v.tickets }}</span>
                  <span v-else class="dash">—</span>
                  <span v-if="v.ticketsMixed" class="mixed-star" :title="`不同编制里票数不一致：${v.ticketsVariants.join(' / ')}`">*</span>
                </td>
                <td class="num">{{ v.respawn_time !== null ? fmtTime(v.respawn_time) : '—' }}
                  <span v-if="v.respawnMixed" class="mixed-star" :title="`不同编制里复活时间不一致：${v.respawnVariants.map(fmtTime).join(' / ')}`">*</span>
                </td>
                <td class="num">{{ v.initial_delay !== null ? fmtTime(v.initial_delay) : '—' }}</td>
                <td class="num appear">{{ v.factionCount }} 阵营 · {{ v.rosterCount }} 编制</td>
                <td class="num"><b>{{ v.totalUnits }}</b> 台</td>
                <td class="num chev">{{ openKey === v.key ? '▾' : '▸' }}</td>
              </tr>
              <tr v-if="openKey === v.key" class="detail-row">
                <td colspan="9">
                  <div class="detail">
                    <div v-if="v.notes.length" class="detail-line">📝 {{ v.notes.join('；') }}</div>
                    <div v-if="v.countMixed" class="detail-line warn">
                      ⚠️ 同名载具在不同编制里数量不一致：{{ v.countVariants.join(' / ') }} 台 —— 下表逐编制列出实际数量。
                    </div>
                    <div class="detail-list">
                      <RouterLink v-for="(e, i) in v.entries" :key="i"
                                  :to="`/squad/${e.faction}/${e.rosterKey}`" class="detail-item">
                        <span class="dl-fac">{{ e.faction }}</span>
                        <span class="dl-roster">{{ e.rosterName }}</span>
                        <span class="dl-roster-type">{{ e.rosterType }}</span>
                        <span class="dl-meta">×{{ e.count }} · 票 {{ e.tickets }} · 复活 {{ e.respawn_time !== null ? fmtTime(e.respawn_time) : '—' }}</span>
                      </RouterLink>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!vehicleRows.length">
              <td colspan="9" class="empty-cell">没有匹配的载具（试试换个关键词或清掉筛选）</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ══ 视图 B：按阵营 ══ -->
    <section v-else class="fac-list">
      <div v-for="f in facRows" :key="f.code" class="fac-card">
        <div class="fac-head">
          <img v-if="f.flag_url" :src="f.flag_url" class="fac-flag" :alt="f.code" />
          <div class="fac-id">
            <span class="fac-code">{{ f.code }}</span>
            <span class="fac-name">{{ f.name }}</span>
          </div>
          <div class="fac-stats">
            <span>📋 {{ f.rosterCount }} 编制</span>
            <span>🚗 {{ f.uniqueCount }} 型号</span>
            <span>🏁 共 {{ f.totalUnits }} 台</span>
          </div>
        </div>
        <div v-for="c in f.categories" :key="c.key" class="fac-cat">
          <div class="fac-cat-head">
            {{ c.icon }} {{ c.label }}
            <span class="fc-count">{{ c.items.length }} 型号 · {{ c.units }} 台</span>
          </div>
          <div class="fac-items">
            <div v-for="it in c.items" :key="it.key" class="fac-item"
                 :title="`${it.name}｜${it.rosters.join('、')}`">
              <img v-if="it.icon_url" :src="it.icon_url" class="fi-icon" :alt="it.name" loading="lazy" />
              <span v-else class="fi-icon emoji">{{ c.icon }}</span>
              <span class="fi-name">{{ it.name }}</span>
              <span class="fi-type">{{ it.type }}</span>
              <span class="fi-count">×{{ it.count }}<i v-if="it.countVariants.length > 1" class="mixed-star" :title="`不同编制里数量不一致：${it.countVariants.join(' / ')}`">*</i></span>
              <span class="ticket-badge" :style="{ background: ticketsLevel(it.tickets).color }">{{ it.tickets }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!facRows.length" class="empty-cell big">没有匹配的阵营 / 载具</div>
    </section>

    <div class="foot-note">
      ℹ️ 数据来源：各阵营编制（{{ totals.rosters }} 份 · {{ totals.entries }} 条载具配置），后台改动编制后本页自动跟着变。<br />
      票数 = 该载具被摧毁时己方扣除的票数；复活 = 摧毁后重新刷新的等待时间；初始延迟 = 开局首次刷新等待。缺失的数值显示「—」（数据里就是没写）。<br />
      带 <span class="mixed-star">*</span> 表示同名载具在不同编制里数量/票数/复活时间不一致（点开「按载具」视图的行可看逐编制明细）。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FACTIONS, VEHICLE_CATEGORIES, ticketsLevel, fmtTime } from '../data/squad/factions'
import { loadSquadConfig } from '../data/squad/remote'
import { buildVehicleStats } from '../data/squad/vehicle-stats'

const factions = ref(FACTIONS)
/** 类别字典（后台可覆盖）—— 仅供 categoryMeta 用，页面列表走 stats.categories */
const catDict = ref(VEHICLE_CATEGORIES)

const view = ref('vehicle')
const search = ref('')
const catFilter = ref('all')
const facFilter = ref('all')
const sort = ref('default')
const openKey = ref('')

const stats = computed(() => buildVehicleStats(factions.value, catDict.value))
const totals = computed(() => stats.value.totals)
const catRows = computed(() => stats.value.categories)
const vehicleList = computed(() => stats.value.byVehicle)
const facList = computed(() => stats.value.byFaction)

// ── 过滤：关键词（名称 / 类型 / 类别名 / 阵营码）──
function matchKw(v, kw) {
  if (!kw) return true
  const hay = [v.name, v.type, v.catLabel, ...(v.factions || [])].join(' ').toLowerCase()
  return hay.includes(kw)
}
function matchFac(v, code) {
  return code === 'all' || (v.factions || []).includes(code)
}

// ── 视图 A：按载具 ──
const vehicleRows = computed(() => {
  const kw = search.value.trim().toLowerCase()
  let list = vehicleList.value.filter((v) => (catFilter.value === 'all' || v.category === catFilter.value)
    && matchKw(v, kw) && matchFac(v, facFilter.value))
  const s = sort.value
  if (s === 'units-desc') list = [...list].sort((a, b) => b.totalUnits - a.totalUnits)
  else if (s === 'tickets-desc') list = [...list].sort((a, b) => (b.tickets ?? -1) - (a.tickets ?? -1))
  else if (s === 'respawn-desc') list = [...list].sort((a, b) => (b.respawn_time ?? -1) - (a.respawn_time ?? -1))
  else if (s === 'appear-desc') list = [...list].sort((a, b) => b.rosterCount - a.rosterCount)
  else if (s === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  return list
})

// ── 视图 B：按阵营（同样吃类别 + 关键词 + 阵营筛选）──
const facRows = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return facList.value
    .filter((f) => facFilter.value === 'all' || f.code === facFilter.value)
    .map((f) => {
      const cats = f.categories
        .filter((c) => catFilter.value === 'all' || c.key === catFilter.value)
        .map((c) => {
          let items = c.items.filter((it) => !kw || [it.name, it.type, c.label].join(' ').toLowerCase().includes(kw))
          const s = sort.value
          if (s === 'tickets-desc') items = [...items].sort((a, b) => (b.tickets ?? -1) - (a.tickets ?? -1))
          else if (s === 'respawn-desc') items = [...items].sort((a, b) => (b.respawn_time ?? -1) - (a.respawn_time ?? -1))
          else if (s === 'name-asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
          else if (s === 'appear-desc') items = [...items].sort((a, b) => b.rosters.length - a.rosters.length)
          return { ...c, items, units: items.reduce((s2, it) => s2 + it.units, 0) }
        })
        .filter((c) => c.items.length)
      return {
        ...f,
        categories: cats,
        uniqueCount: cats.reduce((s, c) => s + c.items.length, 0),
        totalUnits: cats.reduce((s, c) => s + c.units, 0),
      }
    })
    .filter((f) => f.categories.length)
})

const hitCount = computed(() => (view.value === 'vehicle'
  ? vehicleRows.value.length
  : facRows.value.reduce((s, f) => s + f.categories.reduce((s2, c) => s2 + c.items.length, 0), 0)))

onMounted(async () => {
  const cfg = await loadSquadConfig()
  if (cfg) {
    factions.value = cfg.factions
    if (cfg.vehicleCategories && Object.keys(cfg.vehicleCategories).length) {
      catDict.value = { all: { label: '全部', icon: '🗂️' }, ...cfg.vehicleCategories }
    }
  }
})
</script>

<style scoped>
.squad-veh { max-width: 1360px; margin: 0 auto; padding: 24px 16px 48px; }

/* ── 页头 ── */
.veh-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  background: var(--sq-hero-grad);
  border: 1px solid var(--sq-border);
  border-radius: 12px;
  padding: 22px 26px;
  margin-bottom: 18px;
}
.hero-title { display: flex; align-items: center; gap: 16px; }
.hero-logo { font-size: 34px; }
.veh-hero h1 { margin: 0; font-size: 22px; color: var(--sq-hero-text); letter-spacing: 0.5px; }
.veh-hero p { margin: 4px 0 0; font-size: 13px; color: var(--sq-hero-sub); }
.hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-meta span {
  font-size: 12px;
  color: var(--sq-text-2);
  background: var(--sq-meta-bg);
  border: 1px solid var(--sq-meta-border);
  border-radius: 14px;
  padding: 4px 12px;
}

/* ── 类别条 ── */
.cat-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.cat-chip {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 14px;
  border: 1px solid var(--sq-border);
  background: var(--sq-card);
  color: var(--sq-text-2);
  cursor: pointer;
  transition: all 0.15s;
}
.cat-chip b { color: var(--sq-accent); margin-left: 4px; }
.cat-chip:hover { border-color: var(--sq-accent); color: var(--sq-text); }
.cat-chip.on { background: var(--sq-accent-bg); border-color: var(--sq-accent-border); color: #fff; }
.cat-chip.on b { color: #fff; }

/* ── 工具栏 ── */
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.search-input {
  flex: 1;
  min-width: 220px;
  font-size: 13px;
  padding: 9px 13px;
  border-radius: 8px;
  border: 1px solid var(--sq-border);
  background: var(--sq-input);
  color: var(--sq-text);
  outline: none;
}
.search-input:focus { border-color: var(--sq-accent); }
.view-switch { display: inline-flex; border: 1px solid var(--sq-border-strong); border-radius: 8px; overflow: hidden; }
.view-switch button {
  font-size: 12.5px;
  padding: 8px 14px;
  border: 0;
  background: transparent;
  color: var(--sq-text-3);
  cursor: pointer;
}
.view-switch button + button { border-left: 1px solid var(--sq-border-strong); }
.view-switch button.on { background: var(--sq-accent-bg); color: #fff; font-weight: 700; }
.sort-select {
  font-size: 12.5px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--sq-border);
  background: var(--sq-input);
  color: var(--sq-text);
}
.hit-count { font-size: 12px; color: var(--sq-text-3); }

/* ── 阵营筛选 ── */
.fac-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.fac-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 14px;
  border: 1px solid var(--sq-border);
  background: var(--sq-card);
  color: var(--sq-text-2);
  cursor: pointer;
}
.fac-chip:hover { border-color: var(--sq-accent); }
.fac-chip.on { background: var(--sq-accent-bg); border-color: var(--sq-accent-border); color: #fff; font-weight: 700; }
.fac-chip-flag { width: 18px; height: 12px; border-radius: 2px; object-fit: cover; }

/* ── 表格（按载具）── */
.block { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 10px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.veh-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.veh-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--sq-text-3);
  background: var(--sq-card-alt);
  padding: 10px 12px;
  border-bottom: 1px solid var(--sq-border);
  white-space: nowrap;
}
.veh-table td { padding: 9px 12px; border-bottom: 1px solid var(--sq-border-subtle); color: var(--sq-text-2); vertical-align: middle; }
.veh-table .num { text-align: right; white-space: nowrap; }
.veh-row { cursor: pointer; }
.veh-row:hover { background: var(--sq-hover); }
.veh-row.open { background: var(--sq-current-bg); }
.cell-name { display: flex; align-items: center; gap: 8px; color: var(--sq-text); font-weight: 600; }
.veh-icon { width: 30px; height: 20px; object-fit: contain; flex: 0 0 auto; }
.veh-cat-icon { font-size: 15px; }
.cell-type { color: var(--sq-text-3); font-size: 12px; white-space: nowrap; }
.cat-badge {
  display: inline-block;
  font-size: 11px;
  color: var(--sq-text-2);
  background: var(--sq-chip);
  border-radius: 10px;
  padding: 2px 9px;
  white-space: nowrap;
}
.ticket-badge {
  display: inline-block;
  min-width: 24px;
  text-align: center;
  font-size: 11.5px;
  font-weight: 700;
  color: #fff;
  border-radius: 8px;
  padding: 1px 6px;
}
.mixed-star { color: #e6a23c; font-style: normal; margin-left: 3px; cursor: help; }
.dash { color: var(--sq-text-3); }
.appear { color: var(--sq-text-3); font-size: 12px; }
.chev { color: var(--sq-text-3); }
.empty-cell { text-align: center; padding: 40px 16px; color: var(--sq-text-3); font-size: 13px; }
.empty-cell.big { border: 1px dashed var(--sq-border-strong); border-radius: 10px; }

/* ── 展开明细 ── */
.detail-row td { background: var(--sq-card-alt); padding: 12px 14px 16px; }
.detail { display: flex; flex-direction: column; gap: 8px; }
.detail-line { font-size: 12px; color: var(--sq-text-3); }
.detail-line.warn { color: #e6a23c; }
.detail-list { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--sq-text-2);
  text-decoration: none;
  padding: 4px 6px;
  border-radius: 6px;
}
.detail-item:hover { background: var(--sq-hover); }
.dl-fac { font-weight: 700; color: var(--sq-accent); min-width: 58px; }
.dl-roster { flex: 1; color: var(--sq-text); }
.dl-roster-type { font-size: 11px; color: var(--sq-text-3); }
.dl-meta { font-size: 11.5px; color: var(--sq-text-3); white-space: nowrap; }

/* ── 阵营卡片（按阵营）── */
.fac-list { display: flex; flex-direction: column; gap: 16px; }
.fac-card { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; overflow: hidden; }
.fac-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--sq-border);
  background: linear-gradient(90deg, var(--sq-hover), transparent);
}
.fac-flag { width: 44px; height: 30px; border-radius: 4px; object-fit: cover; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25); }
.fac-id { display: flex; flex-direction: column; gap: 2px; }
.fac-code { font-size: 15px; font-weight: 800; color: var(--sq-text); letter-spacing: 0.5px; }
.fac-name { font-size: 12px; color: var(--sq-text-3); }
.fac-stats { margin-left: auto; display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--sq-text-2); }
.fac-cat { padding: 12px 18px 4px; }
.fac-cat-head {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sq-text);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.fc-count { font-weight: 400; font-size: 11px; color: var(--sq-text-3); }
.fac-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 6px; padding-bottom: 8px; }
.fac-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  background: var(--sq-card-alt);
  border: 1px solid var(--sq-border-subtle);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--sq-text-2);
}
.fi-icon { width: 28px; height: 18px; object-fit: contain; flex: 0 0 auto; }
.fi-icon.emoji { font-size: 14px; width: auto; }
.fi-name { color: var(--sq-text); font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fi-type { font-size: 11px; color: var(--sq-text-3); white-space: nowrap; }
.fi-count { font-size: 12px; color: var(--sq-accent); font-weight: 700; white-space: nowrap; }

.foot-note {
  margin-top: 18px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--sq-text-3);
  border-top: 1px dashed var(--sq-border-strong);
  padding-top: 12px;
}

@media (max-width: 640px) {
  .squad-veh { padding: 14px 12px 60px; }
  .veh-hero { padding: 16px 16px; }
  .veh-hero h1 { font-size: 18px; }
  .hero-logo { font-size: 26px; }
  .hero-meta span { font-size: 11px; padding: 3px 9px; }
  .fac-items { grid-template-columns: 1fr; }
  .fac-stats { margin-left: 0; width: 100%; }
}
</style>
