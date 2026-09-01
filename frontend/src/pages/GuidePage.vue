<template>
  <div>
    <h2 class="page-title">▶️ 视频攻略</h2>
    <p class="text-muted">精选 B站视频攻略，点击卡片跳转观看（新窗口打开）</p>

    <div class="video-grid" v-if="videos.length">
      <a v-for="v in videos" :key="v.id" :href="v.url" target="_blank" rel="noopener" class="video-card">
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
    <el-empty v-else description="暂无视频" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'

const videos = ref([])

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
