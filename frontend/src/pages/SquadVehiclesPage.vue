<template>
  <!-- ══════════ 阵营选择页 ══════════ -->
  <div v-if="!factionCode" class="veh-picker">
    <div class="veh-hero">
      <div class="hero-title">
        <span class="hero-logo">🚛</span>
        <div>
          <h1>SQUAD 载具信息</h1>
          <p>选择一个阵营，查看该阵营的全部载具、武器与各编制票数</p>
        </div>
      </div>
      <div class="hero-meta">
        <span>🌍 {{ totals.factions }} 阵营</span>
        <span>📋 {{ totals.rosters }} 编制</span>
        <span>🚗 {{ totals.models }} 型号</span>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="pickerSearch" class="search-input" type="text"
             placeholder="🔍 搜索阵营，如：USMC、俄罗斯、中国…" />
      <span class="hit-count">{{ pickerFactions.length }} 个阵营</span>
    </div>

    <div class="fac-picker-grid">
      <RouterLink
        v-for="f in pickerFactions"
        :key="f.code"
        :to="`/squad/vehicles/${f.code}`"
        class="fac-pick-card"
        :style="{ '--fc': f.theme }"
      >
        <div class="fac-pick-flag">
          <img v-if="f.flag_url" :src="f.flag_url" :alt="f.code" loading="lazy" />
          <span v-else>{{ f.code.slice(0, 1) }}</span>
        </div>
        <div class="fac-pick-body">
          <div class="fac-pick-code">{{ f.code }}</div>
          <div class="fac-pick-name">{{ f.name }}</div>
          <div class="fac-pick-meta">
            <span>📋 {{ f.rosterCount }} 编制</span>
            <span>🚗 {{ f.modelCount }} 型号</span>
          </div>
        </div>
        <span class="fac-pick-arrow">→</span>
      </RouterLink>
    </div>

    <div v-if="!pickerFactions.length" class="empty-state">没有匹配的阵营</div>

    <div class="foot-note">
      ℹ️ 载具图片与部分资料来源于
      <a href="https://squad.fandom.com/wiki/Vehicles" target="_blank" rel="noopener">Squad Wiki</a>，
      采用 CC BY-SA 4.0 许可。
    </div>
  </div>

  <!-- ══════════ 单阵营载具页 ══════════ -->
  <div v-else-if="currentFaction" class="squad-veh">
    <div class="crumb-bar">
      <RouterLink to="/squad/vehicles" class="crumb-link">← 全部阵营</RouterLink>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">{{ currentFaction.code }} {{ currentFaction.name }}</span>
    </div>

    <div class="veh-hero fac-hero" :style="{ '--fc': currentFaction.theme }">
      <div class="hero-title">
        <button type="button" class="hero-flag" :title="currentFaction.name">
          <img v-if="currentFaction.flag_url" :src="currentFaction.flag_url" :alt="currentFaction.code" />
          <span v-else>{{ currentFaction.code.slice(0, 1) }}</span>
        </button>
        <div>
          <h1>{{ currentFaction.code }} · {{ currentFaction.name }}</h1>
          <p>该阵营全部载具 · 悬停看大图 / 武器 / 各编制票数</p>
        </div>
      </div>
      <div class="hero-meta">
        <span>📋 {{ currentFaction.rosterCount }} 编制</span>
        <span>🚗 {{ currentFaction.modelCount }} 型号</span>
      </div>
    </div>

    <!-- 左：类别筛选（sticky） + 右：载具网格 -->
    <div class="veh-body">
    <aside class="veh-side">
    <div class="cat-strip">
      <button class="cat-chip" :class="{ on: classFilter === 'all' }" @click="classFilter = 'all'">
        🗂️ 全部
      </button>
      <button v-for="c in classChips" :key="c.cls" class="cat-chip"
              :class="{ on: classFilter === c.cls }"
              @click="classFilter = classFilter === c.cls ? 'all' : c.cls">
        {{ c.icon }} {{ c.label }} <b>{{ c.count }}</b>
      </button>
      <button v-if="unclassifiedCount" class="cat-chip" :class="{ on: classFilter === '__none__' }"
              @click="classFilter = classFilter === '__none__' ? 'all' : '__none__'">
        🚗 未分类 <b>{{ unclassifiedCount }}</b>
      </button>
    </div>

    <!-- 搜索 -->
    <div class="toolbar">
      <input v-model="search" class="search-input" type="text"
             placeholder="🔍 搜索载具名 / 类型，如：M1A1、坦克…" />
      <span class="hit-count">{{ hitCount }} 型号</span>
    </div>
    </aside>

    <!-- 分组 -->
    <div v-if="visibleGroups.length" class="fac-list">
      <section class="fac-card">
        <div v-for="g in visibleGroups" :key="g.cls || '__none__'" class="fac-cat">
          <div class="fac-cat-head">
            <span>{{ classIcon(g.cls) }} {{ g.cls || '未分类' }}</span>
            <span class="fc-count">{{ g.cards.length }} 型号</span>
          </div>
          <div class="veh-grid">
            <article v-for="c in g.cards" :key="c.name" class="veh-card" tabindex="0"
                     @mouseenter="onEnter($event, c, currentFaction)"
                     @mouseleave="onLeave"
                     @focus="onFocus($event, c, currentFaction)"
                     @blur="onLeave"
                     @click="openSheet(c, currentFaction)"
                     @keydown.enter.prevent="openSheet(c, currentFaction)">
              <div class="veh-thumb">
                <img v-if="c.icon_url" :src="c.icon_url" :alt="c.name" loading="lazy" />
                <span v-else class="thumb-fallback">{{ classIcon(c.cls) }}</span>
              </div>
              <div class="veh-body">
                <div class="veh-name">{{ c.name }}</div>
                <div class="veh-tags">
                  <span class="tag tag-fac">{{ currentFaction.code }}</span>
                  <span v-if="c.cls" class="tag tag-cls">{{ c.cls }}</span>
                </div>
                <div class="ticket-lines" v-if="c.ticketRows.length">
                  <template v-if="c.ticketsUniform">
                    <span class="ticket-line">票数 {{ c.uniformTicket }}</span>
                  </template>
                  <template v-else>
                    <span v-for="t in c.ticketRows" :key="t.roster + '|' + t.tickets" class="ticket-line">
                      {{ t.roster }} 票数：{{ t.tickets }}
                    </span>
                  </template>
                </div>
                <div class="ticket-lines muted" v-else>票数 —</div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="empty-state">没有匹配的载具（试试换个关键词或清掉筛选）</div>
    </div><!-- /veh-body -->

    <div class="foot-note">
      ℹ️ 数据来源：各阵营编制（{{ totals.rosters }} 份 · {{ totals.models }} 个载具名称）。票数/复活按编制逐一展示，不做合并。<br />
      载具图片与部分资料来源于 <a href="https://squad.fandom.com/wiki/Vehicles" target="_blank" rel="noopener">Squad Wiki</a>，采用 CC BY-SA 4.0 许可。
    </div>
  </div>

  <div v-else class="squad-veh">
    <div class="empty-state">未找到阵营「{{ factionCode }}」</div>
    <RouterLink to="/squad/vehicles" class="link">← 返回全部阵营</RouterLink>
  </div>

  <!-- 桌面悬停浮层 -->
  <Teleport to="body">
    <div v-if="hover" class="veh-pop" :style="popStyle"
         @mouseenter="cancelClose" @mouseleave="scheduleClose">
      <VehicleDetail :card="hover.card" :faction="hover.faction" />
    </div>
  </Teleport>

  <!-- 移动端 / 点击详情抽屉 -->
  <Teleport to="body">
    <div v-if="sheet" class="sheet-mask" @click.self="closeSheet">
      <div class="sheet-panel">
        <div class="sheet-bar">
          <span>载具详情</span>
          <button type="button" class="sheet-close" @click="closeSheet">✕</button>
        </div>
        <div class="sheet-content">
          <VehicleDetail :card="sheet.card" :faction="sheet.faction" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { FACTIONS } from '../data/squad/factions'
import { loadSquadConfig } from '../data/squad/remote'
import { VEHICLE_CLASS_ORDER, VEHICLE_CLASS_META, classIcon } from '../data/squad/vehicle-class'
import { buildFactionCards } from '../data/squad/vehicle-view'
import VehicleDetail from '../components/VehicleDetail.vue'

const route = useRoute()
const factions = ref(FACTIONS)

const factionCode = computed(() => String(route.params.faction || '').toUpperCase())
const data = computed(() => buildFactionCards(factions.value))
const totals = computed(() => data.value.totals)
const currentFaction = computed(() =>
  data.value.factions.find((f) => f.code === factionCode.value) || null
)

/* ── 阵营选择页 ── */
const pickerSearch = ref('')
const pickerFactions = computed(() => {
  const kw = pickerSearch.value.trim().toLowerCase()
  if (!kw) return data.value.factions
  return data.value.factions.filter((f) =>
    [f.code, f.name].join(' ').toLowerCase().includes(kw)
  )
})

/* ── 单阵营页 ── */
const search = ref('')
const classFilter = ref('all')

watch(() => route.params.faction, () => {
  search.value = ''
  classFilter.value = 'all'
  hover.value = null
  closeSheet()
})

const classCounts = computed(() => {
  const map = new Map()
  for (const c of currentFaction.value?.cards || []) {
    const key = c.cls || '__none__'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
})

const classChips = computed(() =>
  VEHICLE_CLASS_ORDER.map((cls) => ({
    cls,
    label: cls,
    icon: VEHICLE_CLASS_META[cls]?.icon || '🚗',
    count: classCounts.value.get(cls) || 0,
  })).filter((c) => c.count > 0)
)

const unclassifiedCount = computed(() => classCounts.value.get('__none__') || 0)

function matchSearch(c, kw) {
  if (!kw) return true
  return [c.name, c.type, c.cls || '', ...(c.aliases || [])].join(' ').toLowerCase().includes(kw)
}

function matchClass(c) {
  if (classFilter.value === 'all') return true
  if (classFilter.value === '__none__') return !c.cls
  return c.cls === classFilter.value
}

const visibleGroups = computed(() => {
  if (!currentFaction.value) return []
  const kw = search.value.trim().toLowerCase()
  return currentFaction.value.groups
    .map((g) => ({
      ...g,
      cards: g.cards.filter((c) => matchClass(c) && matchSearch(c, kw)),
    }))
    .filter((g) => g.cards.length)
})

const hitCount = computed(() =>
  visibleGroups.value.reduce((s, g) => s + g.cards.length, 0)
)

/* ── 悬停浮层 ── */
const hover = ref(null)
let enterTimer = null
let closeTimer = null
const POP_W = 400
const POP_H = 560

function showPop(el, card, faction) {
  const r = el.getBoundingClientRect()
  let left = Math.min(Math.max(12, r.left), window.innerWidth - POP_W - 12)
  let top = r.bottom + 8
  if (top + POP_H > window.innerHeight - 12) top = Math.max(12, r.top - POP_H - 8)
  hover.value = { card, faction, left, top }
}

function onEnter(e, card, faction) {
  clearTimeout(enterTimer)
  clearTimeout(closeTimer)
  const el = e.currentTarget
  enterTimer = setTimeout(() => showPop(el, card, faction), 120)
}

function onFocus(e, card, faction) {
  clearTimeout(closeTimer)
  showPop(e.currentTarget, card, faction)
}

function scheduleClose() {
  clearTimeout(enterTimer)
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => { hover.value = null }, 150)
}

function onLeave() {
  clearTimeout(enterTimer)
  scheduleClose()
}

function cancelClose() {
  clearTimeout(closeTimer)
}

const popStyle = computed(() => hover.value
  ? { left: `${hover.value.left}px`, top: `${hover.value.top}px`, width: `${POP_W}px` }
  : {})

/* ── 点击/移动端抽屉 ── */
const sheet = ref(null)

function openSheet(card, faction) {
  hover.value = null
  sheet.value = { card, faction }
  document.body.style.overflow = 'hidden'
}

function closeSheet() {
  sheet.value = null
  document.body.style.overflow = ''
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    closeSheet()
    hover.value = null
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  const cfg = await loadSquadConfig()
  if (cfg && cfg.factions && cfg.factions.length) factions.value = cfg.factions
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(enterTimer)
  clearTimeout(closeTimer)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ── 阵营选择页 ── */
.veh-picker { padding: 20px 0 40px; }
/* 左筛选 260 + 右网格（1920 下 4–5 列） */
.veh-body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.veh-side { position: sticky; top: 84px; }
.veh-side .cat-strip { flex-direction: column; align-items: stretch; margin-bottom: 12px; }
.veh-side .cat-chip { justify-content: space-between; }
.veh-side .toolbar { flex-direction: column; align-items: stretch; gap: 6px; }
@media (max-width: 1240px) {
  .veh-body { grid-template-columns: minmax(0, 1fr); }
  .veh-side { position: static; }
  .veh-side .cat-strip { flex-direction: row; flex-wrap: wrap; }
  .veh-side .toolbar { flex-direction: row; align-items: center; }
}
.fac-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.fac-pick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: var(--sq-card);
  border: 1px solid var(--sq-border);
  border-left: 4px solid var(--fc);
  border-radius: 12px;
  text-decoration: none;
  color: var(--sq-text);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.fac-pick-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sq-shadow);
  border-color: var(--fc);
}
.fac-pick-flag {
  width: 104px;
  height: 68px;
  flex: 0 0 104px;
  border-radius: 8px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--sq-hover);
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  text-shadow: 0 1px 4px rgba(0,0,0,.45);
}
.fac-pick-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fac-pick-body { flex: 1; min-width: 0; }
.fac-pick-code { font-size: 15px; font-weight: 800; letter-spacing: .5px; color: var(--fc); }
.fac-pick-name { font-size: 13px; color: var(--sq-text-2); margin-top: 2px; }
.fac-pick-meta { display: flex; gap: 10px; margin-top: 8px; font-size: 11.5px; color: var(--sq-text-3); }
.fac-pick-arrow { color: var(--sq-text-3); font-size: 18px; }
.fac-pick-card:hover .fac-pick-arrow { color: var(--fc); }

/* ── 单阵营页 ── */
.squad-veh { padding: 20px 0 40px; }

.crumb-bar {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sq-text-3);
  margin-bottom: 14px;
}
.crumb-link { color: var(--sq-accent); text-decoration: none; }
.crumb-link:hover { text-decoration: underline; }
.crumb-sep { color: var(--sq-border-strong); }
.crumb-current { color: var(--sq-text); font-weight: 600; }

/* 页头 */
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
.fac-hero { border-left: 4px solid var(--fc); }
.hero-title { display: flex; align-items: center; gap: 16px; }
.hero-logo { font-size: 34px; }
.hero-flag {
  width: 104px; height: 68px; flex: 0 0 104px;
  border-radius: 8px; overflow: hidden; border: 0; padding: 0;
  display: grid; place-items: center; cursor: default;
  background: var(--sq-hover); color: #fff; font-size: 26px; font-weight: 800;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}
.hero-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
.veh-hero h1 { margin: 0; font-size: 22px; color: var(--sq-hero-text); letter-spacing: 0.5px; }
.veh-hero p { margin: 4px 0 0; font-size: 13px; color: var(--sq-hero-sub); }
.hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-meta span {
  font-size: 12px; color: var(--sq-text-2); background: var(--sq-meta-bg);
  border: 1px solid var(--sq-meta-border); border-radius: 14px; padding: 4px 12px;
}

/* 类别条 */
.cat-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.cat-chip {
  font-size: 12px; padding: 6px 12px; border-radius: 14px; border: 1px solid var(--sq-border);
  background: var(--sq-card); color: var(--sq-text-2); cursor: pointer; transition: all .15s;
}
.cat-chip b { color: var(--sq-accent); margin-left: 4px; }
.cat-chip:hover { border-color: var(--sq-accent); color: var(--sq-text); }
.cat-chip.on { background: var(--sq-accent-bg); border-color: var(--sq-accent-border); color: #fff; }
.cat-chip.on b { color: #fff; }

/* 工具栏 */
.toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.search-input {
  flex: 1; min-width: 220px; font-size: 13px; padding: 9px 13px; border-radius: 8px;
  border: 1px solid var(--sq-border); background: var(--sq-input); color: var(--sq-text); outline: none;
}
.search-input:focus { border-color: var(--sq-accent); }
.hit-count { font-size: 12px; color: var(--sq-text-3); white-space: nowrap; }

/* 阵营卡片 */
.fac-list { display: flex; flex-direction: column; gap: 16px; }
.fac-card { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; overflow: hidden; }
.fac-cat { padding: 12px 18px 4px; }
.fac-cat-head {
  font-size: 12.5px; font-weight: 700; color: var(--sq-text); display: flex;
  align-items: center; gap: 8px; margin-bottom: 9px;
}
.fc-count { font-weight: 400; font-size: 11px; color: var(--sq-text-3); }

/* 大图标卡片 */
.veh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; padding-bottom: 10px; }
.veh-card {
  display: flex; gap: 12px; align-items: center; padding: 10px;
  background: var(--sq-card-alt); border: 1px solid var(--sq-border-subtle);
  border-radius: 10px; cursor: pointer; transition: border-color .15s, transform .15s;
  outline: none;
}
.veh-card:hover, .veh-card:focus-visible { border-color: var(--sq-accent); transform: translateY(-1px); }
.veh-thumb {
  width: 120px; height: 84px; flex: 0 0 120px; display: flex; align-items: center;
  justify-content: center; background: var(--sq-hover); border-radius: 8px; overflow: hidden;
}
.veh-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
.thumb-fallback { font-size: 30px; }
.veh-body { flex: 1; min-width: 0; }
.veh-name { font-size: 13px; font-weight: 700; color: var(--sq-text); line-height: 1.35; }
.veh-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
.tag { font-size: 10px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--sq-border); white-space: nowrap; }
.tag-fac { color: var(--sq-accent); background: var(--sq-accent-bg); }
.tag-cls { color: var(--sq-text-2); background: var(--sq-chip); }
.ticket-lines { margin-top: 6px; display: flex; flex-direction: column; gap: 1px; }
.ticket-line { font-size: 10.5px; line-height: 1.45; color: var(--sq-text-3); }
.ticket-lines.muted { color: var(--sq-text-3); }

.empty-state {
  border: 1px dashed var(--sq-border-strong); border-radius: 10px;
  padding: 46px 16px; text-align: center; color: var(--sq-text-3); font-size: 13px;
}

.foot-note {
  margin-top: 18px; font-size: 12px; line-height: 1.9; color: var(--sq-text-3);
  border-top: 1px dashed var(--sq-border-strong); padding-top: 12px;
}
.foot-note a { color: var(--sq-accent); }

/* 浮层 */
.veh-pop {
  position: fixed; z-index: 3000; max-height: 82vh; overflow: auto;
  background: var(--sq-card); border: 1px solid var(--sq-border-strong);
  border-radius: 12px; box-shadow: 0 14px 40px rgba(0,0,0,.45); padding: 12px;
}

/* 抽屉 */
.sheet-mask {
  position: fixed; inset: 0; z-index: 3100; background: rgba(0,0,0,.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet-panel {
  width: 100%; max-width: 560px; max-height: 88vh; background: var(--sq-card);
  border-radius: 14px 14px 0 0; border: 1px solid var(--sq-border-strong);
  display: flex; flex-direction: column;
}
.sheet-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--sq-border); font-size: 13px; font-weight: 700;
  color: var(--sq-text);
}
.sheet-close {
  border: 0; background: transparent; color: var(--sq-text-2); font-size: 16px; cursor: pointer;
  padding: 2px 6px;
}
.sheet-content { padding: 12px 14px 22px; overflow: auto; }

@media (max-width: 640px) {
  .veh-picker { padding: 14px 12px 60px; }
  .fac-picker-grid { grid-template-columns: 1fr; }
  .fac-pick-card { padding: 14px; }
  .fac-pick-flag { width: 84px; height: 56px; flex-basis: 84px; }
  .squad-veh { padding: 14px 12px 60px; }
  .veh-hero { padding: 16px; }
  .veh-hero h1 { font-size: 18px; }
  .hero-logo { font-size: 26px; }
  .hero-flag { width: 84px; height: 56px; flex-basis: 84px; }
  .hero-meta span { font-size: 11px; padding: 3px 9px; }
  .fac-cat { padding: 10px 12px 2px; }
  .veh-grid { grid-template-columns: 1fr; }
  .veh-card { align-items: flex-start; }
  .veh-thumb { width: 96px; height: 72px; flex-basis: 96px; }
}
</style>
