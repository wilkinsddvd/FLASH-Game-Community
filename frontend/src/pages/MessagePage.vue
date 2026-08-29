<template>
  <div class="message-page">
    <h3 style="margin-bottom:16px;">📨 站内信</h3>

    <!-- 筛选 Tabs -->
    <el-tabs v-model="activeTab" @tab-change="loadMessages">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="未读" name="unread" />
      <el-tab-pane label="系统通知" name="system_notice" />
    </el-tabs>

    <!-- 操作栏 -->
    <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom:8px;">
      <el-button size="small" @click="markAllRead" :disabled="!hasUnread">全部标为已读</el-button>
    </div>

    <!-- 消息列表 -->
    <div v-if="messages.length === 0" class="empty-state">暂无消息</div>

    <div v-for="msg in messages" :key="msg.id" class="message-item" :class="{ unread: msg.is_read === 0 }">
      <div class="msg-header">
        <span class="msg-badge system_notice">系统</span>
        <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
      </div>
      <div class="msg-title">{{ msg.title }}</div>
      <div class="msg-content">{{ msg.content }}</div>
      <div class="msg-actions">
        <el-button size="small" text @click="viewDetail(msg)">查看详情</el-button>
        <el-button
          v-if="msg.is_read === 0"
          size="small"
          text
          type="primary"
          @click="markRead(msg)"
        >标为已读</el-button>
        <el-button size="small" text type="danger" @click="delMessage(msg)">删除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../api'

const activeTab = ref('all')
const messages = ref([])
let pollTimer = null

const hasUnread = computed(() => messages.value.some(m => m.is_read === 0))

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString('zh-CN')
}

async function loadMessages() {
  let params = `?page=1&page_size=50`
  if (activeTab.value === 'unread') {
    params += '&unread_only=true'
  } else if (activeTab.value !== 'all') {
    params += `&msg_type=${activeTab.value}`
  }
  messages.value = await apiRequest(`/messages${params}`)
}

async function markRead(msg) {
  await apiRequest(`/messages/${msg.id}/read`, { method: 'PUT' })
  msg.is_read = 1
  ElMessage.success('已标为已读')
}

async function markAllRead() {
  await apiRequest('/messages/read-all', { method: 'PUT' })
  messages.value.forEach(m => (m.is_read = 1))
  ElMessage.success('全部标为已读')
}

function viewDetail(msg) {
  // 查看即标记已读
  if (msg.is_read === 0) {
    markRead(msg)
  }
}

async function delMessage(msg) {
  await ElMessageBox.confirm('确认删除此消息？')
  await apiRequest(`/messages/${msg.id}`, { method: 'DELETE' })
  messages.value = messages.value.filter(m => m.id !== msg.id)
  ElMessage.success('已删除')
}

onMounted(() => {
  loadMessages()
  // 短轮询：每 30 秒拉取一次新消息
  pollTimer = setInterval(loadMessages, 30000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.message-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 0;
}
.message-item {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--bg-card);
  transition: box-shadow 0.2s, background .3s, border-color .3s;
}
.message-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.message-item.unread {
  border-left: 3px solid var(--text-link);
  background: var(--bg-elevated);
}
.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}
.msg-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  color: #fff;
}
.msg-badge.system_notice { background: #e6a23c; }
.msg-sender { color: var(--text-secondary); }
.msg-time { margin-left: auto; color: var(--text-muted); font-size: 12px; }
.msg-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: var(--text-primary); }
.msg-content { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.msg-actions { margin-top: 8px; }
</style>
