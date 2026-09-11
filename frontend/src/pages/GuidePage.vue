<template>
  <div>
    <h2 class="page-title">▶️ 视频攻略</h2>

    <div v-for="grp in groups" :key="grp.key" class="guide-section">
      <div class="guide-section-title">
        <span class="gs-icon">{{ grp.icon }}</span>
        <span>{{ grp.label }}</span>
        <span class="gs-count">{{ grp.videos.length }} 个视频</span>
      </div>

      <div class="video-grid" v-if="grp.videos.length">
        <a v-for="v in grp.videos" :key="v.id" :href="v.url" target="_blank" rel="noopener" class="video-card">
          <div class="video-cover">
            <img v-if="v.cover_url" :src="v.cover_url" :alt="v.title" referrerpolicy="no-referrer" @error="onCoverError(v)" />
            <span v-else class="video-cover-fallback">🎬</span>
            <span class="video-play">▶</span>
          </div>
          <div class="video-body">
            <h3>{{ v.title }}</h3>
            <div class="text-muted mt-8">{{ v.bvid }}</div>
          </div>
        </a>
      </div>
      <el-empty v-else :description="`暂无${grp.label}视频`" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '../api'

const videos = ref([])

const GROUPS = [
  { key: 'beginner', label: '新手入门', icon: '🌱' },
  { key: 'advanced', label: '进阶指南', icon: '🚀' },
]

function levelOf(v) {
  return v.level === 'advanced' ? 'advanced' : 'beginner'
}

const groups = computed(() =>
  GROUPS.map((g) => ({ ...g, videos: videos.value.filter((v) => levelOf(v) === g.key) }))
)

function onCoverError(v) {
  // B站封面防盗链或失效时回退到图标占位
  v.cover_url = ''
}

onMounted(async () => {
  try { videos.value = await apiRequest('/videos') }
  catch (e) { console.error(e) }
})
</script>

<style scoped>
.guide-section { margin-bottom: 28px; }
.guide-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 4px 0 14px;
  padding-left: 10px;
  border-left: 4px solid var(--primary, #409eff);
}
.gs-icon { font-size: 18px; }
.gs-count { font-size: 12px; font-weight: 400; color: var(--text-muted); }
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.video-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  color: var(--text-primary);
  transition: transform 0.2s, box-shadow 0.2s;
}
.video-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.video-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.video-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.video-cover-fallback { font-size: 44px; }
.video-play {
  position: absolute;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  transition: transform 0.2s;
}
.video-card:hover .video-play { transform: scale(1.15); }
.video-body { padding: 10px 12px 12px; }
.video-body h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
