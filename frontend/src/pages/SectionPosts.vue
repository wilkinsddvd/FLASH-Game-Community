<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 class="page-title" style="margin:0">{{ sectionName }}</h2>
      <el-button type="primary" @click="$router.push('/forum/create')" v-if="loggedIn">发帖</el-button>
    </div>

    <div class="card">
      <ul class="post-list">
        <li class="post-item" v-for="p in posts" :key="p.id">
          <div>
            <RouterLink :to="'/forum/post/' + p.id" class="post-title">
              <el-tag v-if="p.is_pinned" size="small" type="warning" style="margin-right:6px">置顶</el-tag>
              {{ p.title }}
            </RouterLink>
            <div class="post-meta">{{ p.username || '匿名' }} · {{ p.created_at.slice(0, 16) }}</div>
          </div>
          <div class="post-stats">
            <span>💬 {{ p.reply_count }}</span>
            <span>👁️ {{ p.view_count }}</span>
          </div>
        </li>
      </ul>
      <el-empty v-if="!posts.length" description="暂无帖子" />
    </div>

    <div style="text-align:center;margin-top:16px" v-if="hasMore">
      <el-button @click="loadMore">加载更多</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest, isLoggedIn } from '../api'

const route = useRoute()
const posts = ref([])
const sectionName = ref('')
const page = ref(1)
const hasMore = ref(false)
const loggedIn = isLoggedIn()

async function loadPosts() {
  try {
    const data = await apiRequest(`/sections/${route.params.id}/posts?page=${page.value}&page_size=20`)
    posts.value = data
    sectionName.value = '板块 #' + route.params.id
    hasMore.value = data.length === 20
  } catch (e) { console.error(e) }
}

onMounted(loadPosts)
const loadMore = async () => {
  page.value++
  const data = await apiRequest(`/sections/${route.params.id}/posts?page=${page.value}&page_size=20`)
  posts.value.push(...data)
  hasMore.value = data.length === 20
}
</script>
