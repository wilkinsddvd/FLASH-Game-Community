<template>
  <div class="card board-card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
      <span>📝 留言板</span>
      <span class="board-total">共 {{ boardMessages.length }} 条留言</span>
    </div>
    <div class="board-body">
      <!-- 左侧：被管理员选中展示的留言 -->
      <div class="board-list">
        <div v-for="m in boardMessages" :key="m.id" class="board-item">
          <div class="board-content">{{ m.content }}</div>
          <div class="board-meta">
            <span class="board-name">{{ m.display_name }}</span>
            <span class="board-time">{{ (m.created_at || '').slice(0, 10) }}</span>
          </div>
        </div>
        <div v-if="!boardMessages.length" class="board-empty">还没有留言，快来抢沙发～</div>
      </div>
      <!-- 右侧：发布按钮 -->
      <div class="board-action">
        <el-button type="primary" round size="large" @click="boardDialog = true">✍️ 发布留言</el-button>
        <div class="board-hint">留言经管理员筛选后展示</div>
      </div>
    </div>

    <!-- 发布留言弹窗 -->
    <el-dialog v-model="boardDialog" title="发布留言" width="480px">
      <el-alert v-if="!isLogin" type="warning" :closable="false" style="margin-bottom:12px">
        发布留言需要登录，<el-link type="primary" @click="$router.push('/login')">去登录 →</el-link>
      </el-alert>
      <el-input
        v-model="boardForm.content"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
        :disabled="!isLogin"
        placeholder="说点什么吧…（提交后由管理员筛选展示）"
      />
      <template #footer>
        <el-button @click="boardDialog = false">取消</el-button>
        <el-button type="primary" :loading="boardSubmitting" :disabled="!isLogin" @click="submitBoard">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { isLoggedIn, getMessageBoard, createMessageBoard } from '../api'

const isLogin = isLoggedIn()
const boardMessages = ref([])
const boardDialog = ref(false)
const boardSubmitting = ref(false)
const boardForm = ref({ content: '' })

async function loadBoard() {
  try {
    boardMessages.value = await getMessageBoard()
  } catch (e) {
    console.error('留言板加载失败:', e)
  }
}

async function submitBoard() {
  const content = boardForm.value.content.trim()
  if (!content) {
    ElMessage.warning('请填写留言内容')
    return
  }
  boardSubmitting.value = true
  try {
    await createMessageBoard(content)
    ElMessage.success('留言已提交，管理员筛选通过后将展示在留言板')
    boardForm.value.content = ''
    boardDialog.value = false
    await loadBoard()
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    boardSubmitting.value = false
  }
}

onMounted(loadBoard)
</script>

<style scoped>
.board-total { font-size: 12px; font-weight: 400; color: var(--text-muted); }
.board-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.board-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}
.board-item {
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--bg-elevated);
}
.board-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.board-meta {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}
.board-name { font-weight: 600; }
.board-empty {
  padding: 28px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
.board-action {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 6px;
}
.board-hint { font-size: 12px; color: var(--text-muted); text-align: center; }
@media (max-width: 640px) {
  .board-body { flex-direction: column-reverse; }
  .board-action { width: 100%; }
  .board-action .el-button { width: 100%; }
}
</style>
