<template>
  <div v-if="post">
    <!-- Post -->
    <div class="card">
      <el-tag v-if="post.status === 'locked'" type="danger" size="small" style="margin-bottom:8px">已锁定</el-tag>
      <h2>{{ post.title }}</h2>
      <div class="text-muted mb-16">{{ post.username }} · {{ post.created_at.slice(0, 16) }} · 👁️ {{ post.view_count }}</div>
      <div style="line-height:1.8;white-space:pre-wrap">{{ post.content }}</div>
      <div style="margin-top:16px;display:flex;gap:12px">
        <el-button :type="liked ? 'primary' : 'default'" size="small" @click="toggleLike" v-if="loggedIn">
          👍 {{ post.like_count }}
        </el-button>
        <el-button :type="favorited ? 'warning' : 'default'" size="small" @click="toggleFav" v-if="loggedIn">
          ⭐ {{ post.favorite_count }}
        </el-button>
      </div>
    </div>

    <!-- Replies -->
    <div class="card">
      <div class="card-title">回复 ({{ post.reply_count }})</div>
      <div v-if="replies.length">
        <div class="reply-item" v-for="r in replies" :key="r.id">
          <span class="reply-author">{{ r.username || '匿名' }}</span>
          <span class="reply-time">{{ r.created_at.slice(0, 16) }}</span>
          <div class="reply-content">{{ r.content }}</div>
        </div>
      </div>
      <el-empty v-else description="暂无回复" />
    </div>

    <!-- Reply form -->
    <div class="card" v-if="loggedIn">
      <div class="card-title">发表回复</div>
      <el-input v-model="replyContent" type="textarea" :rows="3" placeholder="写下你的回复..." />
      <el-button type="primary" class="mt-16" @click="submitReply">提交回复</el-button>
    </div>
  </div>
  <el-empty v-else description="加载中..." />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn } from '../api'

const route = useRoute()
const post = ref(null)
const replies = ref([])
const replyContent = ref('')
const liked = ref(false)
const favorited = ref(false)
const loggedIn = isLoggedIn()

async function loadPost() {
  try {
    post.value = await apiRequest(`/posts/${route.params.id}`)
    replies.value = await apiRequest(`/posts/${route.params.id}/replies`)
  } catch (e) {
    ElMessage.error('帖子不存在或已被删除')
    post.value = null
  }
}

async function toggleLike() {
  try {
    const res = await apiRequest(`/posts/${route.params.id}/like`, { method: 'POST' })
    liked.value = res.liked
    post.value.like_count = res.like_count
  } catch (e) { ElMessage.error(e.message) }
}

async function toggleFav() {
  try {
    const res = await apiRequest(`/posts/${route.params.id}/favorite`, { method: 'POST' })
    favorited.value = res.favorited
    post.value.favorite_count = res.favorite_count
  } catch (e) { ElMessage.error(e.message) }
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  try {
    const r = await apiRequest(`/posts/${route.params.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content: replyContent.value }),
    })
    replies.value.push(r)
    post.value.reply_count++
    replyContent.value = ''
    ElMessage.success('回复成功')
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(loadPost)
</script>
