<template>
  <div class="vd">
    <div class="vd-cover">
      <img v-if="card.icon_url" :src="card.icon_url" :alt="card.name" />
      <span v-else class="vd-cover-fallback">{{ classIcon(card.cls) }}</span>
    </div>

    <div class="vd-head">
      <h3>{{ card.name }}</h3>
      <div class="vd-tags">
        <span class="tag tag-fac">{{ faction.code }}</span>
        <span v-if="card.cls" class="tag tag-cls">{{ card.cls }}</span>
      </div>
      <div class="vd-type">{{ card.type || '未标注类型' }}</div>
    </div>

    <div class="vd-block">
      <div class="vd-title">🔫 武器配置</div>
      <div v-if="spec && spec.armaments && spec.armaments.length" class="vd-arms">
        <div v-for="(a, i) in spec.armaments" :key="i" class="vd-arm">
          <div class="vd-arm-main">
            <span class="vd-arm-name">{{ a.name }}</span>
            <span class="vd-arm-ammo" v-if="a.ammo !== null && a.ammo !== undefined">{{ a.ammo }} 发</span>
            <span class="vd-arm-ammo muted" v-else>—</span>
          </div>
          <div class="vd-arm-meta" v-if="a.detail || a.type">{{ a.type || '' }}<template v-if="a.detail"> · {{ a.detail }}</template></div>
        </div>
      </div>
      <div v-else-if="spec && spec.unarmed" class="vd-empty">该载具无武装</div>
      <div v-else class="vd-empty">武器/弹药数据补充中</div>
    </div>

    <div class="vd-block">
      <div class="vd-title">🎟️ 票数 / 复活（按编制）</div>
      <div class="vd-table-wrap">
        <table class="vd-table">
          <thead>
            <tr><th>编制</th><th>票数</th><th>复活</th><th>初始延迟</th></tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in card.entries" :key="i">
              <td class="vd-roster">{{ e.rosterName }}</td>
              <td>{{ e.tickets ?? '—' }}</td>
              <td>{{ e.respawn_time !== null ? fmtTime(e.respawn_time) : '—' }}</td>
              <td>{{ e.initial_delay !== null ? fmtTime(e.initial_delay) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="card.notes && card.notes.length" class="vd-block">
      <div class="vd-title">📝 备注</div>
      <div class="vd-note">{{ card.notes.join('；') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmtTime } from '../data/squad/factions'
import { classIcon } from '../data/squad/vehicle-class'
import { getVehicleSpec } from '../data/squad/vehicle-specs'

const props = defineProps({
  card: { type: Object, required: true },
  faction: { type: Object, required: true },
})
const spec = computed(() => getVehicleSpec(props.card.name))
</script>

<style scoped>
.vd { color: var(--sq-text, #e8e8e8); }
.vd-cover {
  height: 230px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sq-card-alt, #1c1f24);
  border-radius: 10px;
  overflow: hidden;
}
.vd-cover img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
.vd-cover-fallback { font-size: 64px; }
.vd-head { padding: 12px 2px 4px; }
.vd-head h3 { margin: 0 0 6px; font-size: 18px; color: var(--sq-text, #fff); }
.vd-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { font-size: 11px; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--sq-border, #333); }
.tag-fac { color: var(--sq-accent, #4ea1ff); background: var(--sq-accent-bg, rgba(78,161,255,.12)); }
.tag-cls { color: var(--sq-text-2, #c9c9c9); background: var(--sq-card-alt, #1c1f24); }
.vd-type { margin-top: 6px; font-size: 12px; color: var(--sq-text-3, #999); }
.vd-block { margin-top: 14px; }
.vd-title { font-size: 12.5px; font-weight: 700; color: var(--sq-text, #fff); margin-bottom: 7px; }
.vd-arms { display: flex; flex-direction: column; gap: 6px; }
.vd-arm { background: var(--sq-card-alt, #1c1f24); border-radius: 7px; padding: 7px 9px; }
.vd-arm-main { display: flex; justify-content: space-between; gap: 8px; font-size: 12.5px; }
.vd-arm-name { color: var(--sq-text, #fff); font-weight: 600; }
.vd-arm-ammo { color: var(--sq-accent, #4ea1ff); font-weight: 700; white-space: nowrap; }
.vd-arm-ammo.muted { color: var(--sq-text-3, #999); }
.vd-arm-meta { margin-top: 3px; font-size: 11px; color: var(--sq-text-3, #999); }
.vd-empty { font-size: 12px; color: var(--sq-text-3, #999); padding: 8px 10px; background: var(--sq-card-alt, #1c1f24); border-radius: 7px; }
.vd-table-wrap { max-height: 220px; overflow: auto; border-radius: 7px; }
.vd-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.vd-table th { text-align: left; color: var(--sq-text-3, #999); font-weight: 600; padding: 5px 7px; background: var(--sq-card-alt, #1c1f24); position: sticky; top: 0; }
.vd-table td { padding: 5px 7px; border-top: 1px solid var(--sq-border-subtle, #262a30); color: var(--sq-text-2, #ccc); }
.vd-roster { color: var(--sq-text, #eee); }
.vd-note { font-size: 12px; line-height: 1.7; color: var(--sq-text-2, #ccc); }
</style>
