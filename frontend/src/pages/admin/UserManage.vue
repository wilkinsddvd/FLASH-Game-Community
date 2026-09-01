<template>
  <div>
    <h3 class="page-title">用户管理</h3>
    <el-table :data="users" stripe style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="角色">
        <template #default="{row}">
          <el-tag v-for="r in row.roles" :key="r.id" size="small" style="margin-right:4px">{{ r.name }}</el-tag>
          <span v-if="!row.roles.length" class="text-muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="封禁状态" min-width="160">
        <template #default="{row}">
          <el-tag v-if="isBanned(row)" type="danger" size="small">
            封禁至 {{ formatBan(row.banned_until) }}
          </el-tag>
          <el-tag v-else type="info" size="small">未封禁</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="170" />
      <el-table-column label="操作" width="170">
        <template #default="{row}">
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
            <el-button v-if="!isBanned(row)" size="small" type="danger" @click="openBan(row)">封禁</el-button>
            <el-button v-else size="small" type="success" @click="unban(row)">解封</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 封禁时长选择 -->
    <el-dialog v-model="banDialog" title="封禁用户" width="420px">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        :title="`封禁「${banTarget?.username || ''}」：封禁期内无法修改个人信息，且无法进行任何需要身份验证的操作`"
        style="margin-bottom:16px"
      />
      <el-form label-width="90px">
        <el-form-item label="封禁时长">
          <el-select v-model="banHours" placeholder="选择时长" style="width:100%">
            <el-option label="1 小时" :value="1" />
            <el-option label="6 小时" :value="6" />
            <el-option label="12 小时" :value="12" />
            <el-option label="1 天" :value="24" />
            <el-option label="3 天" :value="72" />
            <el-option label="7 天" :value="168" />
            <el-option label="30 天" :value="720" />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义">
          <el-input-number v-model="customHours" :min="1" :max="8760" style="width:180px" />
          <span style="margin-left:8px;color:var(--text-muted)">小时</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="banDialog = false">取消</el-button>
        <el-button type="danger" :loading="banning" @click="confirmBan">确认封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest, banUser } from '../../api'

const users = ref([])
const banDialog = ref(false)
const banTarget = ref(null)
const banHours = ref(24)
const customHours = ref(1)
const banning = ref(false)

onMounted(async () => { users.value = await apiRequest('/admin/users') })

function isBanned(row) {
  return !!row.banned_until && new Date(row.banned_until) > new Date()
}

function formatBan(t) {
  return new Date(t).toLocaleString('zh-CN')
}

async function toggleStatus(user) {
  const action = user.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确认${action}用户「${user.username}」？`)
  await apiRequest(`/admin/users/${user.id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: user.status === 1 ? 0 : 1 }),
  })
  ElMessage.success(`已${action}`)
  user.status = user.status === 1 ? 0 : 1
}

function openBan(row) {
  banTarget.value = row
  banHours.value = 24
  customHours.value = 1
  banDialog.value = true
}

async function confirmBan() {
  const hours = customHours.value || banHours.value
  if (!hours || hours <= 0) {
    ElMessage.warning('请选择或输入封禁时长')
    return
  }
  banning.value = true
  try {
    const res = await banUser(banTarget.value.id, hours)
    ElMessage.success(res.message || '已封禁')
    banDialog.value = false
    users.value = await apiRequest('/admin/users')
  } catch (e) {
    ElMessage.error(e.message || '封禁失败')
  } finally {
    banning.value = false
  }
}

async function unban(row) {
  await ElMessageBox.confirm(`确认解除用户「${row.username}」的封禁？`)
  try {
    const res = await banUser(row.id, 0)
    ElMessage.success(res.message || '已解封')
    users.value = await apiRequest('/admin/users')
  } catch (e) {
    ElMessage.error(e.message || '解封失败')
  }
}
</script>
