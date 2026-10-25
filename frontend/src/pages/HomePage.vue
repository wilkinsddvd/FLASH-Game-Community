<template>
  <div class="home-shell">
    <div class="home-main">

    <!-- News -->
    <!-- 功能入口（S5：8 个大图标） -->
    <HomeQuickLinks />

    <div class="card">
      <div class="card-title">{{ t('home.news') }}</div>
      <div class="article-grid" v-if="news.length">
        <div class="article-card" v-for="a in news" :key="a.id" @click="$router.push('/article/' + a.id)">
          <div class="article-cover">
            <img
              v-if="a.cover_image && !brokenArticleCovers.has(a.id)"
              :src="resolveMedia(a.cover_image)"
              :alt="a.title"
              loading="lazy"
              @error="onArticleCoverError(a)"
            />
            <span v-else>📰</span>
          </div>
          <div class="article-body">
            <h3>{{ a.title }}</h3>
            <p>{{ a.summary || t('home.noSummary') }}</p>
            <div class="text-muted mt-16">{{ a.created_at.slice(0, 10) }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="loading" class="article-grid">
        <div v-for="i in 4" :key="'n' + i" class="article-card">
          <div class="article-cover skeleton"></div>
          <div class="article-body">
            <div class="skeleton line w-70"></div>
            <div class="skeleton line w-90 mt-8"></div>
            <div class="skeleton line w-40 mt-8"></div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无资讯" />
    </div>

    <!-- Guides → B站视频 -->
    <div id="videos" class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>▶️ {{ t('home.videos') }}</span>
        <RouterLink to="/guide" class="link">{{ t('home.videosMore') }}</RouterLink>
      </div>
      <div class="video-grid" v-if="videos.length">
        <a v-for="v in videos" :key="v.id" :href="v.url" target="_blank" rel="noopener" class="video-card">
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
      <div v-else-if="loading" class="video-grid">
        <div v-for="i in 4" :key="'v' + i" class="video-card">
          <div class="video-cover skeleton"></div>
          <div class="video-body">
            <div class="skeleton line w-70"></div>
            <div class="skeleton line w-40 mt-8"></div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无视频" />
    </div>

    <!-- Squad 编制 -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>🎖️ {{ t('home.squad') }}</span>
        <RouterLink to="/squad" class="link">{{ t('home.squadGo') }}</RouterLink>
      </div>
      <div class="squad-grid">
        <RouterLink v-for="f in squadFactions" :key="f.code" to="/squad" class="squad-faction" :style="{ '--fc': f.theme }">
          <div class="squad-faction-flag" :style="{ background: f.theme }">
            <img v-if="f.flag_url" :src="f.flag_url" :alt="f.code" />
            <span v-else>{{ f.code.slice(0, 1) }}</span>
          </div>
          <div class="squad-faction-name">{{ f.name }}</div>
          <div class="squad-faction-code">{{ f.code }} · {{ f.rosters.length }} 编制</div>
        </RouterLink>
      </div>
    </div>

    <!-- 基础认证 -->
    <div class="card feature-card" style="--fc:#409eff">
      <div class="feature-inner">
        <div class="feature-emoji">📚</div>
        <div class="feature-info">
          <div class="card-title" style="margin-bottom:6px">{{ t('home.cert') }}</div>
          <p class="text-muted">学习战术手册 QA 文档，参加答题认证。达到 90 分以上即可获得专属勋章 🏅</p>
        </div>
        <el-button type="primary" round @click="$router.push('/cert')">{{ t('home.certGo') }}</el-button>
      </div>
    </div>

    <!-- 留言板 -->
    <div id="board">
      <MessageBoard />
    </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiRequest, resolveMedia } from '../api'
import { FACTIONS } from '../data/squad/factions'
import { loadSquadFactions } from '../data/squad/remote'
import MessageBoard from '../components/MessageBoard.vue'
import HomeQuickLinks from '../components/HomeQuickLinks.vue'
import { useBanners } from '../stores/banners'
import { useI18n } from 'vue-i18n'

const { load: loadBanners } = useBanners()
const { t } = useI18n()
const squadFactions = ref(FACTIONS)

const loading = ref(true)
const news = ref([])
const videos = ref([])

// 记录加载失败的视频封面，回退到图标占位
const brokenCovers = ref(new Set())
function coverOf(v) {
  if (brokenCovers.value.has(v.id)) return ''
  return resolveMedia(v.cover_url)
}
function onCoverError(v) {
  brokenCovers.value = new Set(brokenCovers.value).add(v.id)
}

// 资讯封面加载失败时回退到 📰 占位
const brokenArticleCovers = ref(new Set())
function onArticleCoverError(a) {
  brokenArticleCovers.value = new Set(brokenArticleCovers.value).add(a.id)
}

// ── 留言板（已拆分为独立组件）──

onMounted(async () => {
  try {
    const [, n, v] = await Promise.all([
      loadBanners(),
      apiRequest('/articles?category=news&page_size=4'),
      apiRequest('/videos'),
    ])
    news.value = n
    videos.value = v
  } catch (e) {
    console.error('Home load error:', e)
  } finally {
    loading.value = false
  }
  // Squad 预览：优先使用超管在后台维护的覆盖数据
  try {
    const remote = await loadSquadFactions()
    if (remote) squadFactions.value = remote
  } catch (e) {
    console.error('Squad remote load error:', e)
  }
})

</script>

<style scoped>
.home-shell { display: block; }
.home-main { min-width: 0; }

.squad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
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
.video-cover-fallback { font-size: 40px; }
.video-play {
  position: absolute;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
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
.feature-card {
  background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
  border: 1px solid var(--border-light);
}
.feature-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.feature-emoji { font-size: 36px; }
.feature-info { flex: 1; min-width: 220px; }
.squad-faction {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  text-decoration: none;
  color: var(--text-primary);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.squad-faction:hover {
  transform: translateY(-3px);
  border-color: var(--fc);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.squad-faction-flag {
  width: 52px;
  height: 36px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.squad-faction-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
.squad-faction-name {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
.squad-faction-code {
  font-size: 12px;
  color: var(--text-muted);
}











/* 骨架屏辅助 */
.banner-skeleton { height: 300px; margin-bottom: 24px; }
.line { height: 14px; }
.w-40 { width: 40%; }
.w-70 { width: 70%; }
.w-90 { width: 90%; }
.mt-8 { margin-top: 8px; }
@media (max-width: 480px) {
  .banner-skeleton { height: 180px; }
}

/* ── 反馈卡片 ── */
.feedback-card { position: relative; overflow: visible; }
.feedback-head { display: flex; align-items: center; gap: 14px; }
.fb-emoji { font-size: 34px; }
.fb-msg { flex: 1; min-width: 220px; }
</style>
