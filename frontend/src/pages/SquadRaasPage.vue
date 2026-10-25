<template>
  <div class="raas-page">
    <RouterLink to="/squad/points" class="raas-back-link">← 点位推测</RouterLink>
    <!-- 页头 -->
    <div class="raas-hero">
      <div class="raas-hero-inner">
        <div class="raas-hero-title">
          <span class="raas-logo">🗺️</span>
          <div>
            <h1>{{ modeMeta.title }}</h1>
            <p>{{ modeMeta.subtitle }}</p>
          </div>
        </div>
        <div class="raas-hero-meta">
          <span>{{ maps.length }} 张地图</span>
          <span>🎯 {{ totalLayers }} 个图层</span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="raas-toolbar">
      <input v-model="search" class="raas-search" type="text"
             placeholder="🔍 搜索地图名称，如：Mutaha、Narva…" />
      <label class="raas-check">
        <input type="checkbox" v-model="onlyMulti" />
        只看多版本地图
      </label>
      <label class="raas-check">
        <input type="checkbox" v-model="hideCommunity" />
        隐藏社区层
      </label>
    </div>

    <!-- 地图卡片墙 -->
    <div class="raas-grid">
      <div v-for="m in filteredMaps" :key="m.key" class="raas-card">
        <RouterLink class="raas-card-thumb" :to="`/squad/points/${mode}/${m.layers[0]}`">
          <img :src="thumbUrl(m.slug)" :alt="m.name" loading="lazy" />
          <span class="raas-card-size">{{ m.size }}</span>
        </RouterLink>
        <div class="raas-card-body">
          <div class="raas-card-name">{{ m.name }}</div>
          <div class="raas-ver-list">
            <RouterLink v-for="l in visibleLayers(m)" :key="l"
                        class="raas-ver-chip" :class="{ cl: isCommunity(l) }"
                        :to="`/squad/points/${mode}/${l}`">
              {{ verLabel(l) }}
              <span v-if="isCommunity(l)" class="cl-tag">社区</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!filteredMaps.length" class="raas-empty">
      <p>😕 没有匹配的地图</p>
      <button class="raas-reset" @click="search = ''; onlyMulti = false; hideCommunity = false">重置筛选</button>
    </div>

    <p class="raas-footnote">
      底图与点位数据来源：<a href="https://squadmaps.com" target="_blank" rel="noopener noreferrer">SquadMaps</a>（MIT）·
      仅供社区查询使用，游戏内容版权归 Offworld Industries 所有。
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { RAAS_MAPS, RAAS_LAYERS } from '../data/squad/raas-data'
import { INVASION_MAPS, INVASION_LAYERS } from '../data/squad/invasion-data'

const route = useRoute()
const mode = computed(() => String(route.params.mode || '').toLowerCase())
const isInvasion = computed(() => mode.value === 'invasion')
const isRaas = computed(() => mode.value === 'raas')
const validMode = computed(() => isInvasion.value || isRaas.value)
const sourceMaps = computed(() => (!validMode.value ? [] : (isInvasion.value ? INVASION_MAPS : RAAS_MAPS)))
const sourceLayers = computed(() => (!validMode.value ? {} : (isInvasion.value ? INVASION_LAYERS : RAAS_LAYERS)))
const modeMeta = computed(() => isInvasion.value
  ? {
      title: 'Invasion 点位推测',
      subtitle: '《战术小队》Invasion 模式 · 进攻方路线推测（防守方点位不展示）',
    }
  : !isRaas.value
  ? { title: '未知模式', subtitle: '请选择 RAAS 或 Invasion' }
  : {
      title: 'RAAS 点位推测',
      subtitle: '《战术小队》RAAS 模式 · 选出生点 / 进攻路线与点位刷新预测',
    })

const search = ref('')
const onlyMulti = ref(false)
const hideCommunity = ref(false)

const maps = computed(() =>
  sourceMaps.value.map((m) => ({ ...m, layers: m.layers.filter((l) => sourceLayers.value[l]) }))
    .filter((m) => m.layers.length)
)

const totalLayers = computed(() => maps.value.reduce((n, m) => n + m.layers.length, 0))

function isCommunity(raw) {
  return /_CL$/.test(raw)
}
function verLabel(raw) {
  const l = sourceLayers.value[raw]
  return (l && l.ver) ? l.ver.toUpperCase() : raw.split('_').pop()
}
function visibleLayers(m) {
  return hideCommunity.value ? m.layers.filter((l) => !isCommunity(l)) : m.layers
}
function thumbUrl(slug) {
  return `/squad-assets/raas/thumbs/${slug}.webp`
}

const filteredMaps = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return maps.value
    .map((m) => ({ ...m, layers: visibleLayers(m) }))
    .filter((m) => m.layers.length)
    .filter((m) => (!onlyMulti.value || m.layers.length > 1))
    .filter((m) => !kw || m.name.toLowerCase().includes(kw) || m.key.toLowerCase().includes(kw))
})
</script>

<style scoped>
.raas-page { padding: 20px 0 40px; }
.raas-back-link { display: inline-block; margin-bottom: 12px; font-size: 13px; color: var(--sq-accent); text-decoration: none; }
.raas-back-link:hover { text-decoration: underline; }

.raas-hero {
  background: var(--sq-hero-grad);
  border: 1px solid var(--sq-border);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
}
.raas-hero-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.raas-hero-title { display: flex; align-items: center; gap: 16px; }
.raas-logo { font-size: 40px; }
.raas-hero h1 { font-size: 26px; letter-spacing: 2px; color: var(--sq-hero-text); }
.raas-hero p { color: var(--sq-hero-sub); font-size: 14px; margin-top: 4px; }
.raas-hero-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--sq-hero-sub); }
.raas-hero-meta span {
  background: var(--sq-meta-bg); border: 1px solid var(--sq-meta-border);
  padding: 4px 12px; border-radius: 20px;
}

.raas-toolbar { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 22px; }
.raas-search {
  flex: 1; min-width: 240px; padding: 11px 16px; border-radius: 8px;
  border: 1px solid var(--sq-border); background: var(--sq-input);
  color: var(--sq-text); font-size: 14px; outline: none;
}
.raas-search:focus { border-color: var(--sq-accent); }
.raas-check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--sq-text-3); cursor: pointer; user-select: none; }

.raas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

.raas-card {
  background: var(--sq-card); border: 1px solid var(--sq-border);
  border-radius: 10px; overflow: hidden; transition: transform .2s, box-shadow .2s;
}
.raas-card:hover { transform: translateY(-3px); box-shadow: var(--sq-shadow); }
.raas-card-thumb { position: relative; display: block; aspect-ratio: 1 / 1; background: #0e1116; }
.raas-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.raas-card-size {
  position: absolute; right: 8px; bottom: 8px; font-size: 11px;
  background: rgba(0,0,0,.62); color: #fff; padding: 2px 8px; border-radius: 10px;
}
.raas-card-body { padding: 12px 14px 14px; }
.raas-card-name { font-size: 16px; font-weight: 700; color: var(--sq-text); margin-bottom: 10px; }
.raas-ver-list { display: flex; gap: 8px; flex-wrap: wrap; }
.raas-ver-chip {
  font-size: 12px; padding: 4px 10px; border-radius: 14px;
  border: 1px solid var(--sq-accent-border); color: var(--sq-accent);
  background: transparent; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
  transition: all .15s;
}
.raas-ver-chip:hover { background: var(--sq-accent-bg); color: #fff; }
.raas-ver-chip.cl { border-color: #b98b2f; color: #d9a13b; }
.raas-ver-chip.cl:hover { background: #7a5a14; color: #fff; }
.cl-tag { font-size: 10px; opacity: .85; }

.raas-empty { text-align: center; padding: 48px 20px; color: var(--sq-text-3); }
.raas-reset {
  margin-top: 14px; padding: 8px 20px; border-radius: 6px;
  border: 1px solid var(--sq-accent-border); background: transparent;
  color: var(--sq-accent); cursor: pointer; font-size: 13px;
}
.raas-footnote { margin-top: 32px; font-size: 12px; color: var(--sq-text-3); line-height: 1.8; }
.raas-footnote a { color: var(--sq-accent); }

@media (max-width: 768px) {
  .raas-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
  .raas-hero { padding: 20px; }
  .raas-hero-inner { flex-direction: column; align-items: flex-start; }
}
</style>
