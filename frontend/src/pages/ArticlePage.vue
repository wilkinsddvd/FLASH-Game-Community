<template>
  <div class="article-page">
    <div class="crumb">
      <el-button text @click="$router.back()">← 返回</el-button>
    </div>

    <div class="card" v-if="loading">
      <el-skeleton :rows="6" animated />
    </div>

    <el-result v-else-if="error" icon="error" :title="error" sub-title="文章可能已被删除或未发布">
      <template #extra>
        <el-button type="primary" @click="$router.push('/home')">返回首页</el-button>
      </template>
    </el-result>

    <div class="card" v-else-if="article">
      <div class="tag" :class="article.category === 'news' ? 'tag-news' : 'tag-developer'">
        {{ article.category === 'news' ? '📰 最新资讯' : '🎙️ SQUAD闪电谈' }}
      </div>
      <h1 class="title">{{ article.title }}</h1>
      <div class="meta text-muted">
        {{ article.author_name || '匿名' }} · {{ formatDate(article.created_at) }} · {{ article.view_count || 0 }} 次阅读
      </div>
      <div class="divider"></div>
      <!-- 内容为超管后台撰写，按受信内容渲染 -->
      <div class="md" v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { apiRequest } from '../api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const article = ref(null)
const html = ref('')

function formatDate(input) {
  if (!input) return ''
  return String(input).slice(0, 10)
}

onMounted(async () => {
  try {
    const data = await apiRequest(`/articles/${route.params.id}`)
    article.value = data
    html.value = marked.parse(data.content || '')
    if (data.title) document.title = `${data.title} · SquadFlash`
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article-page {
  max-width: 820px;
  margin: 0 auto;
}
.crumb {
  margin: 8rpx 0 4px;
}
.title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.5;
  margin: 10px 0 8px;
}
.meta {
  font-size: 13px;
}
.tag {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.tag-news {
  color: #2f7cf6;
  background: rgba(47, 124, 246, 0.1);
}
.tag-developer {
  color: #b8860b;
  background: rgba(184, 134, 11, 0.12);
}
.md {
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-primary);
  word-break: break-word;
}
.md :deep(h1),
.md :deep(h2),
.md :deep(h3) {
  margin: 22px 0 10px;
  line-height: 1.4;
}
.md :deep(h2) { font-size: 20px; }
.md :deep(h3) { font-size: 17px; }
.md :deep(p) { margin: 12px 0; }
.md :deep(ul),
.md :deep(ol) { padding-left: 24px; margin: 12px 0; }
.md :deep(li) { margin: 6px 0; }
.md :deep(blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid var(--border-light);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border-radius: 0 8px 8px 0;
}
.md :deep(pre) {
  background: var(--bg-elevated);
  padding: 14px 16px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
}
.md :deep(code) {
  background: var(--bg-elevated);
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 13px;
}
.md :deep(img) {
  max-width: 100%;
  border-radius: 10px;
}
.md :deep(a) { color: var(--primary, #409eff); }
.md :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-light);
  margin: 22px 0;
}
</style>
