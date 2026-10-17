<template>
  <div class="squad-veh">
    <!-- 页头 -->
    <div class="veh-hero">
      <div class="hero-title">
        <span class="hero-logo">🚛</span>
        <div>
          <h1>SQUAD 载具信息</h1>
          <p>按阵营查看载具 · 悬停看大图 / 武器 / 各编制票数</p>
        </div>
      </div>
      <div class="hero-meta">
        <span>🌍 {{ totals.factions }} 阵营</span>
        <span>📋 {{ totals.rosters }} 编制</span>
        <span>🚗 {{ totals.models }} 型号</span>
      </div>
    </div>

    <!-- 类别筛选 -->
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

    <!-- 搜索 / 统计 -->
    <div class="toolbar">
      <input v-model="search" class="search-input" type="text"
             placeholder="🔍 搜索载具名 / 类型 / 阵营，如：M1A1、坦克、USMC…" />
      <span class="hit-count">{{ hitCount }} 型号</span>
    </div>

    <!-- 阵营快捷筛选 -->
    <div class="fac-filters">
      <button class="fac-chip" :class="{ on: facFilter === 'all' }" @click="facFilter = 'all'">全部阵营</button>
      <button v-for="f in data.factions" :key="f.code" class="fac-chip"
              :class="{ on: facFilter === f.code }"
              :title="f.name"
              @click="facFilter = facFilter === f.code ? 'all' : f.code">
        <img v-if="f.flag_url" :src="f.flag_url" class="fac-chip-flag" :alt="f.code" />
        {{ f.code }}
      </button>
    </div>

    <!-- 按阵营 -->
    <div v-if="visibleFactions.length" class="fac-list">
      <section v-for="f in visibleFactions" :key="f.code" class="fac-card">
        <div class="fac-head">
          <button v-if="f.flag_url" type="button" class="fac-flag-btn"
                  :title="`查看 ${f.name} 的各类载具`"
                  @click="focusFaction(f.code)">
            <img :src="f.flag_url" class="fac-flag" :alt="f.code" />
          </button>
          <div class="fac-id">
            <span class="fac-code">{{ f.code }}</span>
            <span class="fac-name">{{ f.name }}</span>
          </div>
          <div class="fac-stats">
            <span>📋 {{ f.rosterCount }} 编制</span>
            <span>🚗 {{ f.modelCount }} 型号</span>
          </div>
        </div>

        <div v-for="g in f.groups" :key="g.cls || '__none__'" class="fac-cat">
          <div class="fac-cat-head">
            <span>{{ classIcon(g.cls) }} {{ g.cls || '未分类' }}</span>
            <span class="fc-count">{{ g.cards.length }} 型号</span>
          </div>
          <div class="veh-grid">
            <article v-for="c in g.cards" :key="c.name" class="veh-card" tabindex="0"
                     @mouseenter="onEnter($event, c, f)"
                     @mouseleave="onLeave"
                     @focus="onFocus($event, c, f)"
                     @blur="onLeave"
                     @click="openSheet(c, f)"
                     @keydown.enter.prevent="openSheet(c, f)">
              <div class="veh-thumb">
                <img v-if="c.icon_url" :src="c.icon_url" :alt="c.name" loading="lazy" />
                <span v-else class="thumb-fallback">{{ classIcon(c.cls) }}</span>
              </div>
              <div class="veh-body">
                <div class="veh-name">{{ c.name }}</div>
                <div class="veh-tags">
                  <span class="tag tag-fac">{{ f.code }}</span>
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

    <div class="foot-note">
      ℹ️ 数据来源：各阵营编制（{{ totals.rosters }} 份 · {{ totals.models }} 个载具名称）。票数/复活按编制逐一展示，不做合并。<br />
      载具图片与部分资料来源于 <a href="https://squad.fandom.com/wiki/Vehicles" target="_blank" rel="noopener">Squad Wiki</a>，采用 CC BY-SA 4.0 许可。
    </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { FACTIONS } from '../data/squad/factions'
import { loadSquadConfig } from '../data/squad/remote'
import { VEHICLE_CLASS_ORDER, VEHICLE_CLASS_META, classIcon } from '../data/squad/vehicle-class'
import { buildFactionCards } from '../data/squad/vehicle-view'
import VehicleDetail from '../components/VehicleDetail.vue'

const factions = ref(FACTIONS)
const search = ref('')
const classFilter = ref('all')
const facFilter = ref('all')

const data = computed(() => buildFactionCards(factions.value))
const totals = computed(() => data.value.totals)

const classCounts = computed(() => {
  const map = new Map()
  for (const f of data.value.factions) {
    for (const c of f.cards) {
      const key = c.cls || '__none__'
      map.set(key, (map.get(key) || 0) + 1)
    }
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

function matchSearch(c, f, kw) {
  if (!kw) return true
  return [c.name, c.type, c.cls || '', f.code, f.name, ...(c.aliases || [])].join(' ').toLowerCase().includes(kw)
}

function matchClass(c) {
  if (classFilter.value === 'all') return true
  if (classFilter.value === '__none__') return !c.cls
  return c.cls === classFilter.value
}

function focusFaction(code) {
  facFilter.value = code
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const visibleFactions = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return data.value.factions
    .filter((f) => facFilter.value === 'all' || f.code === facFilter.value)
    .map((f) => {
      const groups = f.groups
        .map((g) => ({ ...g, cards: g.cards.filter((c) => matchClass(c) && matchSearch(c, f, kw)) }))
        .filter((g) => g.cards.length)
      return {
        ...f,
        groups,
        modelCount: groups.reduce((s, g) => s + g.cards.length, 0),
      }
    })
    .filter((f) => f.groups.length)
})

const hitCount = computed(() => visibleFactions.value.reduce((s, f) => s + f.modelCount, 0))

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
.squad-veh { max-width: 1360px; margin: 0 auto; padding: 24px 16px 48px; }

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
.hero-title { display: flex; align-items: center; gap: 16px; }
.hero-logo { font-size: 34px; }
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

/* 阵营筛选 */
.fac-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.fac-chip {
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 11px;
  border-radius: 14px; border: 1px solid var(--sq-border); background: var(--sq-card);
  color: var(--sq-text-2); cursor: pointer;
}
.fac-chip:hover { border-color: var(--sq-accent); }
.fac-chip.on { background: var(--sq-accent-bg); border-color: var(--sq-accent-border); color: #fff; font-weight: 700; }
.fac-chip-flag { width: 18px; height: 12px; border-radius: 2px; object-fit: cover; }

/* 阵营卡片 */
.fac-list { display: flex; flex-direction: column; gap: 16px; }
.fac-card { background: var(--sq-card); border: 1px solid var(--sq-border); border-radius: 12px; overflow: hidden; }
.fac-head {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  border-bottom: 1px solid var(--sq-border);
  background: linear-gradient(90deg, var(--sq-hover), transparent);
}
.fac-flag-btn {
  border: 0; background: transparent; padding: 0; cursor: pointer; flex: 0 0 auto;
  border-radius: 8px; transition: transform .15s, box-shadow .15s;
}
.fac-flag-btn:hover, .fac-flag-btn:focus-visible {
  transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.35); outline: none;
}
.fac-flag { width: 96px; height: 64px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,.25); display: block; }
.fac-id { display: flex; flex-direction: column; gap: 2px; }
.fac-code { font-size: 15px; font-weight: 800; color: var(--sq-text); letter-spacing: .5px; }
.fac-name { font-size: 12px; color: var(--sq-text-3); }
.fac-stats { margin-left: auto; display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--sq-text-2); }

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
  .squad-veh { padding: 14px 12px 60px; }
  .veh-hero { padding: 16px; }
  .veh-hero h1 { font-size: 18px; }
  .hero-logo { font-size: 26px; }
  .hero-meta span { font-size: 11px; padding: 3px 9px; }
  .fac-head { padding: 12px 14px; }
  .fac-flag { width: 72px; height: 48px; }
  .fac-cat { padding: 10px 12px 2px; }
  .fac-stats { margin-left: 0; width: 100%; }
  .veh-grid { grid-template-columns: 1fr; }
  .veh-card { align-items: flex-start; }
  .veh-thumb { width: 96px; height: 72px; flex-basis: 96px; }
}
</style>
