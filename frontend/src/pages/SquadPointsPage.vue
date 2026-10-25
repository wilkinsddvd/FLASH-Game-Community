<template>
  <div class="points-home">
    <div class="points-hero">
      <div class="points-hero-title">
        <span class="points-logo">🧭</span>
        <div>
          <h1>点位推测</h1>
          <p>先选择游戏模式，再选择地图与图层</p>
        </div>
      </div>
      <div class="points-hero-meta">
        <span>🗺️ {{ modeCards.length }} 种模式</span>
        <span>📌 {{ totalLayers }} 个图层</span>
      </div>
    </div>

    <div class="mode-grid">
      <RouterLink
        v-for="m in modeCards"
        :key="m.key"
        :to="`/squad/points/${m.key}`"
        class="mode-card"
        :style="{ '--mc': m.color }"
      >
        <div class="mode-icon">{{ m.icon }}</div>
        <div class="mode-body">
          <div class="mode-name">{{ m.label }}</div>
          <div class="mode-desc">{{ m.desc }}</div>
          <div class="mode-meta">
            <span>🗺️ {{ m.mapCount }} 张地图</span>
            <span>📌 {{ m.layerCount }} 个图层</span>
            <span v-if="m.multiLane">🔀 {{ m.multiLane }} 个多路线图层</span>
          </div>
        </div>
        <span class="mode-arrow">→</span>
      </RouterLink>
    </div>

    <div class="points-tip">
      <b>怎么用：</b>
      选择模式 → 选择地图 → 进入图层后，按你在游戏里实际看到的点位逐个确认，
      工具会自动收窄可能的进攻路线。
    </div>

    <p class="points-footnote">
      底图与点位数据来源：<a href="https://squadmaps.com" target="_blank" rel="noopener noreferrer">SquadMaps</a>（MIT）·
      仅供社区查询使用，游戏内容版权归 Offworld Industries 所有。
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RAAS_MAPS, RAAS_LAYERS } from '../data/squad/raas-data'
import { INVASION_MAPS, INVASION_LAYERS } from '../data/squad/invasion-data'

const raasLayers = Object.keys(RAAS_LAYERS).length
const invasionLayers = Object.keys(INVASION_LAYERS).length
const invasionMulti = Object.values(INVASION_LAYERS).filter((l) => (l.lanes || []).length > 1).length

const modeCards = computed(() => [
  {
    key: 'raas',
    label: 'RAAS',
    icon: '🔀',
    color: '#4ea8ff',
    desc: '随机 lane：选出生点后，按实际看到的点位逐步推测路线',
    mapCount: RAAS_MAPS.length,
    layerCount: raasLayers,
    multiLane: raasLayers,
  },
  {
    key: 'invasion',
    label: 'Invasion',
    icon: '⚔️',
    color: '#f0a04b',
    desc: '进攻方路线推测：进攻方出生点固定，只需按看到的点位逐步确认',
    mapCount: INVASION_MAPS.length,
    layerCount: invasionLayers,
    multiLane: invasionMulti,
  },
])

const totalLayers = computed(() => raasLayers + invasionLayers)
</script>

<style scoped>
.points-home { padding: 20px 0 40px; }

.points-hero {
  background: var(--sq-hero-grad);
  border: 1px solid var(--sq-border);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.points-hero-title { display: flex; align-items: center; gap: 16px; }
.points-logo { font-size: 40px; }
.points-hero h1 { font-size: 26px; letter-spacing: 2px; color: var(--sq-hero-text); margin: 0; }
.points-hero p { color: var(--sq-hero-sub); font-size: 14px; margin: 4px 0 0; }
.points-hero-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--sq-hero-sub); }
.points-hero-meta span {
  background: var(--sq-meta-bg); border: 1px solid var(--sq-meta-border);
  padding: 4px 12px; border-radius: 20px;
}

.mode-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; }
.mode-card {
  display: flex; align-items: center; gap: 18px;
  padding: 24px 24px 22px;
  background: var(--sq-card);
  border: 1px solid var(--sq-border);
  border-left: 4px solid var(--mc);
  border-radius: 12px;
  text-decoration: none;
  color: var(--sq-text);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.mode-card:hover { transform: translateY(-3px); box-shadow: var(--sq-shadow); border-color: var(--mc); }
.mode-icon {
  width: 64px; height: 64px; flex: 0 0 64px; border-radius: 16px;
  display: grid; place-items: center; font-size: 32px;
  background: color-mix(in srgb, var(--mc) 18%, var(--sq-card));
  border: 1px solid color-mix(in srgb, var(--mc) 40%, var(--sq-border));
}
.mode-body { flex: 1; min-width: 0; }
.mode-name { font-size: 20px; font-weight: 800; letter-spacing: .5px; color: var(--mc); }
.mode-desc { margin-top: 6px; font-size: 13px; line-height: 1.65; color: var(--sq-text-2); }
.mode-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; font-size: 11.5px; color: var(--sq-text-3); }
.mode-arrow { font-size: 22px; color: var(--sq-text-3); }
.mode-card:hover .mode-arrow { color: var(--mc); }

.points-tip {
  margin-top: 22px; padding: 14px 18px; border-radius: 10px;
  background: var(--sq-card); border: 1px dashed var(--sq-border-strong);
  font-size: 13px; line-height: 1.8; color: var(--sq-text-2);
}
.points-tip b { color: var(--sq-text); }
.points-footnote { margin-top: 28px; font-size: 12px; color: var(--sq-text-3); line-height: 1.8; }
.points-footnote a { color: var(--sq-accent); }

@media (max-width: 640px) {
  .points-home { padding: 14px 12px 60px; }
  .points-hero { padding: 20px; }
  .points-hero h1 { font-size: 22px; }
  .mode-grid { grid-template-columns: 1fr; }
  .mode-card { padding: 18px; }
}
</style>
