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

    <!-- Guides -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>热门攻略</span>
        <RouterLink to="/guide" class="link">查看更多 →</RouterLink>
      </div>
      <div class="article-grid" v-if="guides.length">
        <div class="article-card" v-for="a in guides" :key="a.id">
          <div class="article-cover">🎮</div>
          <div class="article-body">
            <h3>{{ a.title }}</h3>
            <p>{{ a.summary || '暂无摘要' }}</p>
            <div class="text-muted mt-16">{{ a.created_at.slice(0, 10) }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="loading" class="article-grid">
        <div v-for="i in 4" :key="'g' + i" class="article-card">
          <div class="article-cover skeleton"></div>
          <div class="article-body">
            <div class="skeleton line w-70"></div>
            <div class="skeleton line w-90 mt-8"></div>
            <div class="skeleton line w-40 mt-8"></div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无攻略" />
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

    <!-- Squad 单兵武器 -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>🔫 Squad 单兵武器</span>
        <RouterLink to="/squad" class="link">查看全部编制 →</RouterLink>
      </div>
      <div class="weapon-grid">
        <div v-for="f in squadFactions" :key="'w-' + f.code" class="weapon-card">
          <div class="weapon-faction">
            <div class="squad-faction-flag" :style="{ background: f.theme }">
              <img v-if="f.flag_url" :src="f.flag_url" :alt="f.code" />
              <span v-else>{{ f.code.slice(0, 1) }}</span>
            </div>
            <div class="weapon-faction-name">{{ f.name }}</div>
          </div>
          <div class="weapon-list">
            <div v-for="w in (f.soldier_weapons || []).slice(0, 4)" :key="w.name" class="weapon-item">
              <span class="weapon-role">{{ w.name }}</span>
              <span class="weapon-primary">{{ w.primary }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 赞助 -->
    <div class="card sponsor-card">
      <div class="sponsor-inner">
        <div class="sponsor-emoji">💖</div>
        <div class="sponsor-info">
          <div class="card-title" style="margin-bottom:6px">赞助支持</div>
          <p class="text-muted">你的支持是我们持续更新攻略与维护社区的动力！赞助可获得专属徽章与定制服务。</p>
        </div>
        <el-button type="primary" round @click="$router.push('/sponsor')">了解赞助 →</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'
import { FACTIONS } from '../data/squad/factions'

const squadFactions = FACTIONS

const loading = ref(true)
const banners = ref([])
const news = ref([])
const guides = ref([])

onMounted(async () => {
  try {
    const [b, n, g] = await Promise.all([
      apiRequest('/banners'),
      apiRequest('/articles?category=news&page_size=4'),
      apiRequest('/articles?category=guide&page_size=4'),
    ])
    banners.value = b
    news.value = n
    guides.value = g
  } catch (e) {
    console.error('Home load error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.squad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
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

/* 单兵武器栏 */
.weapon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.weapon-card {
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 12px;
  background: var(--bg-elevated);
}
.weapon-faction {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.weapon-faction .squad-faction-flag {
  width: 44px;
  height: 30px;
  font-size: 14px;
}
.weapon-faction-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.weapon-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.weapon-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-card);
}
.weapon-role {
  color: var(--text-muted);
  flex-shrink: 0;
}
.weapon-primary {
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

/* 骨架屏辅助 */
.banner-skeleton { height: 300px; margin-bottom: 24px; }
.line { height: 14px; }
.w-40 { width: 40%; }
.w-70 { width: 70%; }
.w-90 { width: 90%; }
.mt-8 { margin-top: 8px; }

/* 赞助栏 */
.sponsor-card {
  background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
  border: 1px solid var(--border-light);
}
.sponsor-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.sponsor-emoji { font-size: 36px; }
.sponsor-info { flex: 1; min-width: 220px; }
@media (max-width: 480px) {
  .banner-skeleton { height: 180px; }
}
</style>
