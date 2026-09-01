<template>
  <div>
    <h3 class="page-title">🛡️ 资料审核</h3>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="头像 / 昵称 / 个性签名修改后需管理员审核，审核通过后才对外展示"
      style="margin-bottom:16px;"
    />

    <el-table :data="items" v-loading="loading" empty-text="暂无待审核资料" stripe>
      <el-table-column label="用户" min-width="160">
        <template #default="{row}">
          <div style="font-weight:600">{{ row.username }}</div>
          <div class="text-muted" style="font-size:12px">UID: {{ row.uid }} · ID: {{ row.user_id }}</div>
          <div v-if="row.nickname" class="text-muted" style="font-size:12px">当前昵称：{{ row.nickname }}</div>
        </template>
      </el-table-column>
      <el-table-column label="待审核内容" min-width="220">
        <template #default="{row}">
          <div v-for="p in row.pending" :key="p.field" class="pending-item">
            <el-tag size="small" :type="fieldType(p.field)">{{ fieldName(p.field) }}</el-tag>
            <span class="pending-value">
              <img v-if="p.field === 'avatar'" :src="mediaUrl(p.value)" class="pending-avatar" />
              <template v-else>{{ p.value }}</template>
            </span>
            <div class="text-muted" style="font-size:12px">提交于 {{ formatTime(p.submitted_at) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <div style="display:flex;flex-direction:column;gap:6px">
            <div v-for="p in row.pending" :key="p.field" style="display:flex;gap:6px">
              <el-button size="small" type="success" @click="handleAudit(row, p.field, 'approve')">通过</el-button>
              <el-button size="small" type="danger" @click="handleAudit(row, p.field, 'reject')">拒绝</el-button>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listAudits, approveAudit, rejectAudit } from '../../api'

const loading = ref(false)
const items = ref([])
const staticBase = import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8000'

const FIELD_META = {
  avatar: { name: '头像', type: 'primary' },
  nickname: { name: '昵称', type: 'warning' },
  bio: { name: '个性签名', type: 'success' },
}

function fieldName(f) { return FIELD_META[f]?.name || f }
function fieldType(f) { return FIELD_META[f]?.type || 'info' }

function mediaUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${staticBase}${url}`
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const res = await listAudits()
    items.value = res.items || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleAudit(row, field, action) {
  const actionText = action === 'approve' ? '通过' : '拒绝'
  await ElMessageBox.confirm(
    `确认${actionText}「${row.username}」的${fieldName(field)}审核？`,
    '审核确认',
    { type: action === 'approve' ? 'success' : 'warning' }
  )
  try {
    if (action === 'approve') {
      await approveAudit(row.user_id, field)
      ElMessage.success(`${fieldName(field)}审核已通过并展示`)
    } else {
      await rejectAudit(row.user_id, field)
      ElMessage.success(`${fieldName(field)}审核已拒绝`)
    }
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(load)
</script>

<style scoped>
.pending-item {
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-light);
}
.pending-item:last-child { border-bottom: none; }
.pending-value {
  margin-left: 8px;
  font-size: 13px;
}
.pending-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
  border: 1px solid var(--border-light);
}
</style>
