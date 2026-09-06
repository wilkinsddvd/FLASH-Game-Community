<template>
  <div>
    <!-- Banner -->
    <div class="banner-carousel" v-if="banners.length">
      <el-carousel height="300px" indicator-position="inside">
        <el-carousel-item v-for="b in banners" :key="b.id">
          <a :href="b.link_url || '#'" target="_blank">
            <div class="banner-slide" :style="{ backgroundImage: `url(${b.image_url})` }">
              <h2>{{ b.title }}</h2>
            </div>
          </a>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div v-else-if="loading" class="banner-carousel skeleton banner-skeleton"></div>

    <!-- News -->
    <div class="card">
      <div class="card-title">最新资讯</div>
      <div class="article-grid" v-if="news.length">
        <div class="article-card" v-for="a in news" :key="a.id">
          <div class="article-cover">📰</div>
          <div class="article-body">
            <h3>{{ a.title }}</h3>
            <p>{{ a.summary || '暂无摘要' }}</p>
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
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>▶️ B站视频</span>
        <RouterLink to="/guide" class="link">查看更多 →</RouterLink>
      </div>
      <div class="video-grid" v-if="videos.length">
        <a v-for="v in videos" :key="v.id" :href="v.url" target="_blank" rel="noopener" class="video-card">
          <div class="video-cover">
            <img v-if="v.cover_url" :src="v.cover_url" :alt="v.title" />
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

    <!-- 基础认证 -->
    <div class="card feature-card" style="--fc:#409eff">
      <div class="feature-inner">
        <div class="feature-emoji">📚</div>
        <div class="feature-info">
          <div class="card-title" style="margin-bottom:6px">基础认证</div>
          <p class="text-muted">学习战术手册 QA 文档，参加答题认证。达到 90 分以上即可获得专属勋章 🏅</p>
        </div>
        <el-button type="primary" round @click="$router.push('/cert')">前往认证 →</el-button>
      </div>
    </div>

    <!-- 反馈 · 点赞 -->
    <div class="card feedback-card">
      <div class="feedback-head">
        <div class="fb-emoji">💛</div>
        <div class="fb-msg">
          <div class="card-title" style="margin-bottom:6px">反馈</div>
          <p class="text-muted">感谢你使用本网站！如果觉得还不错，就给我们点个赞吧～</p>
        </div>
      </div>

      <div class="like-zone">
        <button class="like-btn" :class="{ 'is-liked': burst }" :disabled="burst" @click="handleLike">
          <span class="like-icon">👍</span>
        </button>
        <span class="like-hint">点个赞吧</span>
        <span v-for="(p, i) in particles" :key="i" class="like-particle" :style="p.style">{{ p.icon }}</span>
      </div>

      <transition name="fb-toast">
        <div v-if="thanksVisible" class="fb-toast">感谢你的喜欢与支持</div>
      </transition>

      <div class="feedback-sub">
        使用不满意，点此<el-link type="primary" @click="$router.push('/feedback')">反馈</el-link>
      </div>
    </div>

    <!-- Squad 编制 -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>🎖️ Squad 编制</span>
        <RouterLink to="/squad" class="link">进入编制查询 →</RouterLink>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiRequest } from '../api'
import { FACTIONS } from '../data/squad/factions'
import { loadSquadFactions } from '../data/squad/remote'

const squadFactions = ref(FACTIONS)

const loading = ref(true)
const banners = ref([])
const news = ref([])
const videos = ref([])

// ── 点赞特效 ──
const burst = ref(false)
const particles = ref([])
const thanksVisible = ref(false)
let burstTimer = null
let thanksTimer = null

function handleLike() {
  if (burst.value) return
  burst.value = true
  const icons = ['✨', '💛', '⭐', '❤️', '🌟']
  particles.value = Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2
    const dist = 46 + Math.random() * 40
    return {
      icon: icons[Math.floor(Math.random() * icons.length)],
      style: {
        left: '50%',
        top: '50%',
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist}px`,
      },
    }
  })
  thanksVisible.value = true
  clearTimeout(burstTimer)
  clearTimeout(thanksTimer)
  burstTimer = setTimeout(() => {
    burst.value = false
    particles.value = []
  }, 900)
  thanksTimer = setTimeout(() => {
    thanksVisible.value = false
  }, 3000)
}

onMounted(async () => {
  try {
    const [b, n, v] = await Promise.all([
      apiRequest('/banners'),
      apiRequest('/articles?category=news&page_size=4'),
      apiRequest('/videos'),
    ])
    banners.value = b
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

onUnmounted(() => {
  clearTimeout(burstTimer)
  clearTimeout(thanksTimer)
})
</script>

<style scoped>
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

/* ── 反馈 · 点赞区 ── */
.feedback-card { position: relative; overflow: visible; }
.feedback-head { display: flex; align-items: center; gap: 14px; }
.fb-emoji { font-size: 34px; }
.fb-msg { flex: 1; min-width: 220px; }
.like-zone {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 6px 0 4px 48px;
  min-height: 60px;
}
.like-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #ffd666, #ff9c1a);
  box-shadow: 0 4px 12px rgba(255, 156, 26, 0.35);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-btn:hover { transform: scale(1.08); box-shadow: 0 6px 18px rgba(255, 156, 26, 0.5); }
.like-btn:disabled { cursor: default; }
.like-btn.is-liked { animation: like-pop 0.5s ease; }
.like-icon { font-size: 28px; line-height: 1; }
@keyframes like-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.25) rotate(-8deg); }
  70% { transform: scale(0.95) rotate(4deg); }
  100% { transform: scale(1); }
}
.like-hint { font-size: 13px; color: var(--text-muted); }
.like-particle {
  position: absolute;
  pointer-events: none;
  font-size: 16px;
  animation: fly-away 0.85s ease-out forwards;
}
@keyframes fly-away {
  0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.15); opacity: 0; }
}
.fb-toast {
  position: absolute;
  top: -14px;
  right: 16px;
  background: linear-gradient(135deg, #ffd666, #ff9c1a);
  color: #7a4a00;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 14px rgba(255, 156, 26, 0.4);
  white-space: nowrap;
}
.fb-toast-enter-active, .fb-toast-leave-active { transition: opacity 0.35s, transform 0.35s; }
.fb-toast-enter-from, .fb-toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.9); }
.feedback-sub {
  margin: 10px 0 0 48px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
