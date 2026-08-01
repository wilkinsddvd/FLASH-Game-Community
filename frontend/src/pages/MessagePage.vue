<template>
  <div class="message-page">
    <h3 style="margin-bottom:16px;">📨 站内信</h3>

    <!-- 筛选 Tabs -->
    <el-tabs v-model="activeTab" @tab-change="loadMessages">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="未读" name="unread" />
      <el-tab-pane label="系统通知" name="system_notice" />
      <el-tab-pane label="互动通知" name="interaction" />
      <el-tab-pane label="私信" name="private_message" />
    </el-tabs>

    <!-- 操作栏 -->
    <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom:8px;">
      <el-button type="primary" size="small" @click="openSend = true">✉️ 发私信</el-button>
      <el-button size="small" @click="markAllRead" :disabled="!hasUnread">全部标为已读</el-button>
    </div>

    <!-- 消息列表 -->
    <div v-if="messages.length === 0" class="empty-state">暂无消息</div>

    <div v-for="msg in messages" :key="msg.id" class="message-item" :class="{ unread: msg.is_read === 0 }">
      <div class="msg-header">
        <span class="msg-badge" :class="msg.type">
          {{ typeLabel(msg.type) }}
        </span>
        <span class="msg-sender">
          <template v-if="msg.type === 'system_notice'">系统通知</template>
          <template v-else-if="msg.sender_username">来自 {{ msg.sender_username }}</template>
          <template v-else>系统</template>
        </span>
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

    <!-- 发私信弹窗 -->
    <el-dialog v-model="openSend" title="发送私信" width="480px">
      <el-form label-width="80px">
        <el-form-item label="收件人">
          <el-input v-model="sendForm.username" placeholder="输入对方用户名" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="sendForm.title" placeholder="可选" maxlength="100" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="sendForm.content" type="textarea" :rows="4" placeholder="输入消息内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="openSend = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest, sendPrivateMessage } from '../api'

const activeTab = ref('all')
const messages = ref([])
let pollTimer = null

// 发私信
const openSend = ref(false)
const sending = ref(false)
const sendForm = ref({ username: '', title: '', content: '' })

async function handleSend() {
  if (!sendForm.value.username.trim()) {
    ElMessage.warning('请输入收件人用户名')
    return
  }
  if (!sendForm.value.content.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  sending.value = true
  try {
    await sendPrivateMessage(sendForm.value.username.trim(), sendForm.value.title.trim(), sendForm.value.content.trim())
    ElMessage.success('私信发送成功')
    openSend.value = false
    sendForm.value = { username: '', title: '', content: '' }
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

const hasUnread = computed(() => messages.value.some(m => m.is_read === 0))

function typeLabel(type) {
  const map = {
    system_notice: '系统',
    private_message: '私信',
    interaction: '互动',
  }
  return map[type] || type
}

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
  // 对于互动通知，跳转到相关帖子
  if (msg.related_type === 'like' || msg.related_type === 'reply') {
    window.open(`/forum/post/${msg.related_id}`, '_blank')
  }
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
.msg-badge.private_message { background: #409eff; }
.msg-badge.interaction { background: #67c23a; }
.msg-sender { color: var(--text-secondary); }
.msg-time { margin-left: auto; color: var(--text-muted); font-size: 12px; }
.msg-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: var(--text-primary); }
.msg-content { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.msg-actions { margin-top: 8px; }
</style>
