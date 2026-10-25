<template>
  <div class="vtip" role="dialog" :aria-label="vehicle.name">
    <div class="vtip-cover">
      <img v-if="img" :src="img" class="vtip-img" :alt="vehicle.name" />
      <span v-else class="vtip-img vtip-img-fallback">{{ classIcon(vehicle.cls) }}</span>
      <span v-if="imageNote" class="vtip-badge" :class="imageStatus">{{ imageNote }}</span>
    </div>

    <div class="vtip-head">
      <span class="vtip-name">{{ vehicle.name }}</span>
      <span v-if="vehicle.cls" class="vtip-cls">{{ vehicle.cls }}</span>
    </div>

    <dl class="vtip-rows">
      <div class="vtip-row"><dt>类型</dt><dd>{{ vehicle.type || '—' }}</dd></div>
      <div class="vtip-row"><dt>数量</dt><dd>{{ vehicle.count ?? '—' }}</dd></div>
      <div class="vtip-row">
        <dt>票数</dt>
        <dd><span class="vtip-ticket" :style="{ color: ticketColor }">{{ vehicle.tickets ?? '—' }}</span></dd>
      </div>
      <div class="vtip-row"><dt>重生</dt><dd>{{ fmt(vehicle.respawn_time) }}</dd></div>
      <div class="vtip-row"><dt>初始延迟</dt><dd>{{ fmt(vehicle.initial_delay) }}</dd></div>
    </dl>

    <p v-if="vehicle.note" class="vtip-note">{{ vehicle.note }}</p>

    <button type="button" class="vtip-more" @click="$emit('open', vehicle)">
      查看完整资料 →
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmtTime } from '../data/squad/factions'
import { classIcon } from '../data/squad/vehicle-class'
import { vehicleImageFor, isGenericOnly, vehicleImageStatus, vehicleImageNote } from '../data/squad/vehicle-images'

const props = defineProps({
  vehicle: { type: Object, required: true },
})
defineEmits(['open'])

const img = computed(() => {
  const v = props.vehicle
  if (!v || isGenericOnly(v.name)) return ''
  return vehicleImageFor(v.name) || v.icon_url || ''
})
const imageStatus = computed(() => vehicleImageStatus(props.vehicle.name))
const imageNote = computed(() => vehicleImageNote(props.vehicle.name))

const ticketColor = computed(() => {
  const t = props.vehicle.tickets
  if (t === null || t === undefined) return 'var(--sq-text-3)'
  if (t >= 10) return '#ff4d4f'
  if (t >= 5) return '#fa8c16'
  return '#52c41a'
})

function fmt(sec) {
  if (sec === null || sec === undefined || sec === '') return '—'
  return fmtTime(sec)
}
</script>

<style scoped>
.vtip {
  background: var(--sq-card, #171a1f);
  border: 1px solid var(--sq-border-strong, #333);
  border-left: 3px solid var(--faction-theme, var(--sq-accent, #4ea1ff));
  border-radius: 12px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, .5);
  padding: 12px 14px 10px;
  color: var(--sq-text, #e8e8e8);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden auto;
  overscroll-behavior: contain;
}

/* 图片：完整显示，绝不裁切 */
.vtip-cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sq-input, #1c1f24);
  border-radius: 8px;
  overflow: hidden;
  min-height: 96px;
}
/* 等比显示：宽高都由图片自身比例决定，绝不裁切也不留黑边 */
.vtip-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: min(46vh, 320px);
  object-fit: contain;
  object-position: center;
}
.vtip-img-fallback {
  display: flex; align-items: center; justify-content: center;
  font-size: 44px; height: 110px;
}
.vtip-badge {
  position: absolute; left: 8px; bottom: 8px;
  font-size: 10px; line-height: 1.4; padding: 2px 8px; border-radius: 999px;
  color: #fff; background: rgba(0, 0, 0, .62);
}
.vtip-badge.same-chassis { background: rgba(183, 121, 31, .92); }
.vtip-badge.missing { background: rgba(197, 48, 48, .92); }

.vtip-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.vtip-name { font-size: 15px; font-weight: 700; color: var(--sq-text, #fff); }
.vtip-cls {
  font-size: 10.5px; padding: 1px 8px; border-radius: 999px;
  color: var(--sq-text-2, #c9c9c9); background: var(--sq-chip, #232830);
  border: 1px solid var(--sq-border, #2f353d);
}

.vtip-rows { margin: 0; display: flex; flex-direction: column; gap: 3px; }
.vtip-row { display: flex; justify-content: space-between; gap: 14px; }
.vtip-row dt { color: var(--sq-text-3, #999); margin: 0; }
.vtip-row dd { margin: 0; color: var(--sq-text, #eee); font-weight: 600; }
.vtip-ticket { font-weight: 800; }

.vtip-note {
  margin: 0; padding-top: 7px; border-top: 1px dashed var(--sq-border, #2f353d);
  color: var(--sq-accent, #4ea1ff); font-size: 12px; line-height: 1.6;
}

.vtip-more {
  margin-top: 2px;
  width: 100%;
  border: 1px solid var(--sq-border-strong, #333);
  background: var(--sq-chip, #232830);
  color: var(--sq-accent, #4ea1ff);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.vtip-more:hover, .vtip-more:focus-visible {
  border-color: var(--sq-accent, #4ea1ff);
  background: var(--sq-hover, #262c34);
}
</style>
