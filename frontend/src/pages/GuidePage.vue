<template>
  <div>
    <h2 class="page-title">▶️ 视频攻略</h2>

    <!-- 检索工具栏 -->
    <div class="guide-toolbar">
      <input
        v-model="search"
        class="search-input"
        type="text"
        placeholder="🔍 搜索视频标题或 BV 号，如：新手、坦克、BV1xx…"
      />
      <div class="type-filters">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="type-filter-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>
    </div>

    <template v-if="videos.length">
      <div v-for="grp in groups" :key="grp.key" class="guide-section">
        <div class="guide-section-title">
          <span class="gs-icon">{{ grp.icon }}</span>
          <span>{{ grp.label }}</span>
          <span class="gs-count">{{ grp.videos.length }} 个视频</span>
        </div>

        <div class="video-grid" v-if="grp.videos.length">
          <a v-for="v in grp.videos" :key="v.id" :href="v.url" target="_blank" rel="noopener" class="video-card">
            <div class="video-cover">
              <img
                v-if="coverOf(v)"
                :src="coverOf(v)"
                :alt="v.title"
                referrerpolicy="no-referrer"
                loading="lazy"
                @error="onCoverError(v)"
              />
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

      <el-empty v-if="!filteredVideos.length" description="没有找到匹配的视频，换个关键词试试" />
    </template>

    <el-empty v-else description="暂无视频" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiRequest, resolveMedia } from '../api'

const videos = ref([])
const search = ref('')
const activeTab = ref('all')
// 记录加载失败的封面，避免直接篡改原始数据
const brokenCovers = ref(new Set())

const GROUPS = [
  { key: 'beginner', label: '新手入门', icon: '🌱' },
  { key: 'advanced', label: '进阶指南', icon: '🚀' },
]

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'beginner', label: '🌱 新手入门' },
  { key: 'advanced', label: '🚀 进阶指南' },
]

function levelOf(v) {
  return v.level === 'advanced' ? 'advanced' : 'beginner'
}

/** 关键词过滤：标题 / BV 号 */
const filteredVideos = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return videos.value.filter((v) => {
    if (activeTab.value !== 'all' && levelOf(v) !== activeTab.value) return false
    if (!kw) return true
    return (
      String(v.title || '').toLowerCase().includes(kw) ||
      String(v.bvid || '').toLowerCase().includes(kw)
    )
  })
})

const groups = computed(() =>
  GROUPS.filter((g) => activeTab.value === 'all' || activeTab.value === g.key).map((g) => ({
    ...g,
    videos: filteredVideos.value.filter((v) => levelOf(v) === g.key),
  }))
)

function coverOf(v) {
  if (brokenCovers.value.has(v.id)) return ''
  return resolveMedia(v.cover_url)
}

function onCoverError(v) {
  // 封面 404 / 防盗链失败：记下来，回退到图标占位（不动原始数据）
  brokenCovers.value = new Set(brokenCovers.value).add(v.id)
}

onMounted(async () => {
  try { videos.value = await apiRequest('/videos') }
  catch (e) { console.error(e) }
})
</script>

<style scoped>
.guide-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--primary, #409eff); }
.search-input::placeholder { color: var(--text-muted); }
.type-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.type-filter-btn {
  font-size: 13px;
  padding: 6px 16px;
  border-radius: 18px;
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.type-filter-btn:hover { color: var(--text-primary); }
.type-filter-btn.active {
  background: var(--primary, #409eff);
  color: #fff;
  border-color: var(--primary, #409eff);
}

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

@media (max-width: 640px) {
  .video-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
}
</style>
