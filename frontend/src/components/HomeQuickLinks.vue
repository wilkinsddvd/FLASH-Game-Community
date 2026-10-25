<template>
  <nav class="quick-grid" aria-label="功能入口">
    <RouterLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="quick-card"
      :aria-label="t('home.quick.' + item.key + '.title') + ' / ' + t('home.quick.' + item.key + '.en') + ': ' + t('home.quick.' + item.key + '.desc')"
    >
      <span class="quick-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor"
             stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <template v-for="(d, i) in item.paths" :key="i">
            <path :d="d" />
          </template>
          <circle v-for="(c, i) in item.circles || []" :key="'c' + i" :cx="c[0]" :cy="c[1]" :r="c[2]" />
        </svg>
      </span>
      <span class="quick-text">
        <span class="quick-title">
          {{ t('home.quick.' + item.key + '.title') }}
          <span v-if="showEn(item.key)" class="quick-en">{{ t('home.quick.' + item.key + '.en') }}</span>
        </span>
        <span class="quick-desc">{{ t('home.quick.' + item.key + '.desc') }}</span>
      </span>
    </RouterLink>
  </nav>
</template>

<script setup>
/**
 * 首页功能入口（S5）
 * 图标全部内联 SVG（44px，currentColor 描边，跟随暗/亮主题），不新增图片资源。
 * 英文副标先写在这里，S6 接入 vue-i18n 后整体搬到 locale 词典。
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/** 英文模式下中文名和英文副标会重复，就不再显示副标 */
function showEn(key) {
  return t('home.quick.' + key + '.title') !== t('home.quick.' + key + '.en')
}

const items = [
  {
    key: 'roster',
    to: '/squad',
    paths: ['M12 3l7 3v5.5c0 4-2.9 7.4-7 8.5-4.1-1.1-7-4.5-7-8.5V6l7-3z', 'M9.2 12.1l2 2 3.8-4'],
  },
  {
    key: 'points',
    to: '/squad/points',
    paths: ['M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2v-13z', 'M9 4.5v13', 'M15 6.5v13'],
  },
  {
    key: 'vehicles',
    to: '/squad/vehicles',
    paths: ['M3 16V8h9l4 3h3a2 2 0 012 2v3h-2', 'M7 16h8', 'M3 16h1'],
    circles: [[7.5, 16.5, 1.6], [16.5, 16.5, 1.6]],
  },
  {
    key: 'fire',
    to: '/squad/fire-control',
    paths: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4'],
    circles: [[12, 12, 5.2], [12, 12, 1.2]],
  },
  {
    key: 'cert',
    to: '/cert',
    paths: ['M7 4h10v6a5 5 0 01-10 0V4z', 'M7 6H5a2 2 0 002 2', 'M17 6h2a2 2 0 01-2 2', 'M10 20h4', 'M12 15v5'],
  },
  {
    key: 'guide',
    to: '/guide',
    paths: ['M4 5.5A2.5 2.5 0 016.5 3H19v15H6.5A2.5 2.5 0 004 20.5v-15z', 'M8 7h7', 'M8 10.5h5'],
  },
  {
    key: 'videos',
    to: '/home#videos',
    paths: ['M3 6.5h18v11H3z'],
    circles: [[12, 12, 3.2]],
  },
  {
    key: 'community',
    to: '/forum',
    paths: ['M4 5h16v10H9l-5 4V5z', 'M8.5 9.5h7', 'M8.5 12h4'],
  },
]
</script>

<style scoped>
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.quick-card {
  --accent: var(--text-link);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: var(--text-primary);
  transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
}
.quick-card:hover,
.quick-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--text-link);
  box-shadow: 0 6px 20px rgba(64, 158, 255, .18), 0 0 0 1px rgba(64, 158, 255, .28);
  outline: none;
}
.quick-card:focus-visible { box-shadow: 0 0 0 2px var(--text-link); }

.quick-icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--text-link);
}
.quick-icon svg { display: block; }

.quick-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.quick-title {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 15px; font-weight: 700; color: var(--text-primary);
}
.quick-en {
  font-size: 11px; font-weight: 600; letter-spacing: .3px;
  color: var(--text-muted); text-transform: uppercase;
}
.quick-desc {
  font-size: 12px; line-height: 1.5; color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 暗色：描边用亮一点的主题蓝，保证 AA 对比度 */
[data-theme="dark"] .quick-icon { color: #66b1ff; }

/* 断点：1920/1440 → 4×2；992–1440 → 3 列；≤768 → 2 列；<480 → 2 列紧凑 */
@media (max-width: 1440px) {
  .quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .quick-card { padding: 12px; gap: 10px; }
  .quick-icon { width: 36px; height: 36px; }
  .quick-icon svg { width: 36px; height: 36px; }
  .quick-desc { display: none; }
}
@media (max-width: 480px) {
  .quick-grid { gap: 8px; }
  .quick-card { padding: 10px; }
  .quick-title { font-size: 13.5px; gap: 5px; }
  .quick-en { font-size: 9.5px; }
  .quick-icon { width: 30px; height: 30px; }
  .quick-icon svg { width: 30px; height: 30px; }
}
</style>
