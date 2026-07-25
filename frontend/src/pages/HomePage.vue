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
      <el-empty v-else description="暂无攻略" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'

const banners = ref([])
const news = ref([])
const guides = ref([])

onMounted(async () => {
  try {
    banners.value = await apiRequest('/banners')
    news.value = await apiRequest('/articles?category=news&page_size=4')
    guides.value = await apiRequest('/articles?category=guide&page_size=4')
  } catch (e) {
    console.error('Home load error:', e)
  }
})
</script>
