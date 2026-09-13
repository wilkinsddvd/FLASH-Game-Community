<template>
  <div class="board-wrap">
    <!-- 顶部横幅 -->
    <div v-if="showHeader" class="board-hero">
      <div class="board-hero-main">
        <div class="board-hero-icon">📝</div>
        <div>
          <h3 class="board-hero-title">留言板</h3>
          <div class="board-hero-sub">
            共 <b>{{ boardMessages.length }}</b> 条展示中的留言 · 留言经管理员筛选后展示
          </div>
        </div>
      </div>
      <el-button type="primary" round size="large" class="board-publish-btn" @click="openDialog">
        <span class="board-publish-icon">✍️</span> 发布留言
      </el-button>
    </div>

    <!-- 留言卡片墙 -->
    <div v-if="boardMessages.length" class="board-grid">
      <div
        v-for="(m, idx) in boardMessages"
        :key="m.id"
        class="board-card"
        :style="{ '--card-accent': accentOf(idx) }"
      >
        <div class="board-card-head">
          <div class="board-avatar" :style="{ background: accentOf(idx) }">{{ initialOf(m.display_name) }}</div>
          <div class="board-user">
            <div class="board-name">
              {{ m.display_name }}
              <el-tag v-if="m.is_anonymous" size="small" type="info" effect="plain" round>匿名</el-tag>
            </div>
            <div class="board-time">🕒 {{ formatDate(m.created_at) }}</div>
          </div>
          <div class="board-no">#{{ boardMessages.length - idx }}</div>
        </div>
        <div class="board-content">{{ m.content }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="board-empty">
      <div class="board-empty-icon">💬</div>
      <div class="board-empty-title">还没有留言</div>
      <div class="board-empty-desc">抢占第一条沙发，说点什么吧～</div>
      <el-button type="primary" round @click="openDialog">✍️ 我要留言</el-button>
    </div>

    <!-- 发布弹窗 -->
    <el-dialog v-model="boardDialog" title="✍️ 发布留言" width="520px" class="board-dialog">
      <el-alert v-if="!isLogin" type="warning" :closable="false" style="margin-bottom:12px">
        发布留言需要登录，<el-link type="primary" @click="$router.push('/login')">去登录 →</el-link>
      </el-alert>
      <el-input
        v-model="boardForm.content"
        type="textarea"
        :rows="5"
        maxlength="500"
        show-word-limit
        resize="none"
        :disabled="!isLogin"
        placeholder="说点什么吧…&#10;（可聊聊你的入坑故事、游戏心得，或给社区的建议）"
      />
      <div class="board-tips">
        <span>💡 提交后由管理员筛选，通过后会展示在留言板</span>
      </div>
      <template #footer>
        <el-button @click="boardDialog = false">取消</el-button>
        <el-button type="primary" :loading="boardSubmitting" :disabled="!isLogin" @click="submitBoard">
          发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { isLoggedIn, getMessageBoard, createMessageBoard } from '../api'

defineProps({
  showHeader: { type: Boolean, default: true },
})

const isLogin = isLoggedIn()
const boardMessages = ref([])
const boardDialog = ref(false)
const boardSubmitting = ref(false)
const boardForm = ref({ content: '' })

// 一组渐变色，按顺序循环使用，让卡片墙有节奏
const ACCENTS = [
  'linear-gradient(135deg,#409eff,#6f9dff)',
  'linear-gradient(135deg,#67c23a,#8fd45e)',
  'linear-gradient(135deg,#e6a23c,#f5c26b)',
  'linear-gradient(135deg,#f56c6c,#ff9a9a)',
  'linear-gradient(135deg,#909399,#b9bcc2)',
  'linear-gradient(135deg,#8e6bff,#b39dff)',
]

function accentOf(idx) {
  return ACCENTS[idx % ACCENTS.length]
}

function initialOf(name) {
  const s = String(name || '游').trim()
  return s ? s.slice(0, 1).toUpperCase() : '游'
}

function formatDate(v) {
  if (!v) return ''
  const s = String(v).replace('T', ' ')
  return s.slice(0, 10)
}

function openDialog() {
  if (!isLogin) {
    ElMessage.warning('请先登录后再留言')
  }
  boardDialog.value = true
}

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
.board-publish-btn {
  flex-shrink: 0;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--primary, #409eff) 35%, transparent);
}
.board-publish-icon { margin-right: 2px; }

/* ── 顶部横幅 ── */
.board-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 14px;
  margin-bottom: 16px;
  background:
    radial-gradient(120% 160% at 0% 0%, color-mix(in srgb, var(--primary, #409eff) 18%, transparent), transparent 60%),
    linear-gradient(135deg, color-mix(in srgb, var(--primary, #409eff) 10%, var(--bg-card)), var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--primary, #409eff) 25%, var(--border-light));
}
.board-hero-main { display: flex; align-items: center; gap: 14px; min-width: 0; }
.board-hero-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  background: var(--bg-elevated);
  box-shadow: inset 0 0 0 1px var(--border-light);
}
.board-hero-title { margin: 0; font-size: 18px; font-weight: 800; color: var(--text-primary); }
.board-hero-sub { margin-top: 4px; font-size: 12px; color: var(--text-muted); }
.board-hero-sub b { color: var(--primary, #409eff); }

/* ── 卡片墙 ── */
.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.board-card {
  position: relative;
  border-radius: 14px;
  padding: 14px 16px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  overflow: hidden;
}
.board-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--card-accent);
  opacity: .9;
}
.board-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, .08);
  border-color: color-mix(in srgb, var(--primary, #409eff) 40%, var(--border-light));
}
.board-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.board-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: .5px;
}
.board-user { min-width: 0; flex: 1; }
.board-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.board-time { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.board-no { font-size: 12px; color: var(--text-muted); opacity: .7; font-weight: 600; }
.board-content {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 2px;
}

/* ── 空状态 ── */
.board-empty {
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed var(--border-light);
  border-radius: 14px;
  background: var(--bg-elevated);
}
.board-empty-icon { font-size: 38px; }
.board-empty-title { margin-top: 8px; font-weight: 700; color: var(--text-primary); }
.board-empty-desc { margin: 4px 0 14px; font-size: 13px; color: var(--text-muted); }

.board-tips { margin-top: 10px; font-size: 12px; color: var(--text-muted); }

@media (max-width: 640px) {
  .board-hero { flex-direction: column; align-items: stretch; }
  .board-publish-btn { width: 100%; }
  .board-grid { grid-template-columns: 1fr; }
}
</style>
