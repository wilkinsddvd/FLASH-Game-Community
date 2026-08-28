<template>
  <div class="squad-page">
    <!-- 页头 -->
    <div class="squad-hero">
      <div class="squad-hero-inner">
        <div class="squad-hero-title">
          <span class="squad-logo">🎖️</span>
          <div>
            <h1>SQUAD 阵营编制</h1>
            <p>《战术小队》各阵营编制 · 载具配置 / 票数</p>
          </div>
        </div>
        <div class="squad-hero-meta">
          <span>🏳️ {{ FACTIONS.length }} 个阵营</span>
          <span>📋 {{ totalRosters }} 种编制</span>
        </div>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="toolbar">
      <input v-model="search" class="search-input" type="text"
             placeholder="🔍 搜索阵营 / 编制名称，如：USMC、机械化、坦克旅…" />
      <div class="type-filters">
        <button v-for="(label, key) in BG_TYPE_LABELS" :key="key"
                class="type-filter-btn" :class="{ active: typeFilter === key }"
                @click="toggleTypeFilter(key)">
          {{ label }}
        </button>
        <button v-if="typeFilter" class="type-filter-clear" @click="typeFilter = ''">✕ 清除</button>
      </div>
    </div>

    <!-- 阵营列表 -->
    <div class="faction-list">
      <div class="faction-card" v-for="f in filteredFactions" :key="f.code"
           :style="{ '--faction-theme': f.theme }">
        <div class="faction-header">
          <div class="faction-flag">
            <img v-if="f.flag_url" :src="f.flag_url" :alt="f.code + ' 旗帜'" />
            <span v-else>{{ f.code.slice(0, 1) }}</span>
          </div>
          <div class="faction-id">
            <div class="faction-name">{{ f.name }}</div>
            <div class="faction-code">{{ f.code }}</div>
          </div>
        </div>
        <div class="roster-list">
          <RouterLink v-for="r in f.rosters" :key="r.key"
                      :to="`/squad/${f.code}/${r.key}`"
                      class="roster-item">
            <img v-if="r.type_icon" :src="r.type_icon" class="roster-type-img" :alt="r.type" :title="r.type" />
            <span v-else class="roster-type-icon">{{ r.type }}</span>
            <span class="roster-name">{{ r.name }}</span>
            <span class="roster-type">{{ r.type }}</span>
            <span class="roster-arrow">→</span>
          </RouterLink>
          <div v-if="!f.rosters.length" class="roster-empty">无匹配编制</div>
        </div>
        <div class="faction-stats">
          <span>{{ f.rosters.length }} 个编制</span>
          <span>{{ totalVehicles(f) }} 类载具</span>
        </div>
      </div>
    </div>

    <div v-if="!filteredFactions.length" class="no-result">
      <p>😕 没有找到匹配的阵营或编制</p>
      <button class="reset-btn" @click="search = ''; typeFilter = ''">重置筛选</button>
    </div>

    <div class="squad-footer-note">
      <p>📌 数据来源：SQUAD编制 文档 / 游戏内编制选择界面</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FACTIONS, BG_TYPE_LABELS } from '../data/squad/factions'

const search = ref('')
const typeFilter = ref('')

const totalRosters = computed(() =>
  FACTIONS.reduce((sum, f) => sum + f.rosters.length, 0)
)

const filteredFactions = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return FACTIONS.map((f) => {
    let rosters = f.rosters
    if (typeFilter.value) {
      rosters = rosters.filter((r) => r.type_key === typeFilter.value)
    }
    if (kw) {
      rosters = rosters.filter((r) =>
        r.name.toLowerCase().includes(kw) ||
        r.type.toLowerCase().includes(kw) ||
        r.key.includes(kw)
      )
    }
    return { ...f, rosters }
  }).filter((f) => {
    if (!kw && !typeFilter.value) return true
    if (f.rosters.length) return true
    // 阵营名/代号匹配时也展示（即使无匹配编制）
    return kw && (f.name.toLowerCase().includes(kw) || f.code.toLowerCase().includes(kw))
  })
})

function toggleTypeFilter(key) {
  typeFilter.value = typeFilter.value === key ? '' : key
}

function totalVehicles(f) {
  const set = new Set()
  f.rosters.forEach((r) => r.vehicles.forEach((v) => set.add(v.name)))
  return set.size
}
</script>

<style scoped>
.squad-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

/* ── 页头 ── */
.squad-hero {
  background: var(--sq-hero-grad);
  border: 1px solid var(--sq-border);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
  color: var(--sq-hero-text);
}
.squad-hero-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.squad-hero-title { display: flex; align-items: center; gap: 16px; }
.squad-logo { font-size: 40px; }
.squad-hero h1 {
  font-size: 26px;
  letter-spacing: 2px;
  color: var(--sq-hero-text);
}
.squad-hero p { color: var(--sq-hero-sub); font-size: 14px; margin-top: 4px; }
.squad-hero-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--sq-hero-sub);
}
.squad-hero-meta span {
  background: var(--sq-meta-bg);
  border: 1px solid var(--sq-meta-border);
  padding: 4px 12px;
  border-radius: 20px;
}
.data-warn { color: #faad14 !important; border-color: rgba(250, 173, 20, 0.4) !important; }

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--sq-border);
  background: var(--sq-input);
  color: var(--sq-text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--sq-accent); }
.search-input::placeholder { color: var(--sq-text-3); }
.type-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.type-filter-btn {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 16px;
  border: 1px solid var(--sq-border);
  background: transparent;
  color: var(--sq-text-3);
  cursor: pointer;
  transition: all 0.15s;
}
.type-filter-btn:hover { color: var(--sq-text); border-color: var(--sq-border-strong); }
.type-filter-btn.active {
  background: var(--sq-accent-bg);
  color: #fff;
  border-color: var(--sq-accent-border);
}
.type-filter-clear {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid rgba(224, 138, 138, 0.5);
  background: transparent;
  color: var(--sq-bad);
  cursor: pointer;
}

/* ── 阵营卡片 ── */
.faction-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}
.faction-card {
  background: var(--sq-card);
  border: 1px solid var(--sq-border);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.faction-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sq-shadow);
}
.faction-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--sq-border);
  background: linear-gradient(90deg, var(--sq-hover), transparent);
}
.faction-flag {
  width: 52px;
  height: 36px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
.faction-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
.faction-name { font-size: 17px; font-weight: 700; color: var(--sq-text); }
.faction-code {
  font-size: 12px;
  color: var(--faction-theme);
  font-weight: 700;
  letter-spacing: 2px;
  margin-top: 2px;
}

.roster-list { padding: 8px 12px; }
.roster-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  color: var(--sq-text-2);
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s;
}
.roster-item:hover { background: var(--sq-hover); }
.roster-type-img {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}
.roster-type-icon {
  width: 52px;
  font-size: 12px;
  color: var(--sq-text-3);
  flex-shrink: 0;
}
.roster-name { flex: 1; font-weight: 500; }
.roster-type {
  font-size: 12px;
  color: var(--sq-text-3);
  border: 1px solid var(--sq-border-strong);
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.roster-arrow { color: var(--sq-text-3); transition: color 0.15s, transform 0.15s; }
.roster-item:hover .roster-arrow { color: var(--sq-accent); transform: translateX(3px); }
.roster-empty { padding: 12px; text-align: center; color: var(--sq-text-3); font-size: 13px; }

.faction-stats {
  display: flex;
  gap: 16px;
  padding: 10px 20px;
  border-top: 1px solid var(--sq-border);
  font-size: 12px;
  color: var(--sq-text-3);
}

.no-result {
  text-align: center;
  padding: 48px 20px;
  color: var(--sq-text-3);
}
.no-result p { margin-bottom: 16px; }
.reset-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid var(--sq-accent-border);
  background: transparent;
  color: var(--sq-accent);
  cursor: pointer;
  font-size: 13px;
}
.reset-btn:hover { background: var(--sq-accent-bg); color: #fff; }

.squad-footer-note {
  margin-top: 32px;
  text-align: center;
  color: var(--sq-text-3);
  font-size: 12px;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .faction-list { grid-template-columns: 1fr; }
  .squad-hero { padding: 20px; }
  .squad-hero-inner { flex-direction: column; align-items: flex-start; }
}
</style>
