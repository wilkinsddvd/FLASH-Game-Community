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
      <el-table-column prop="created_at" label="注册时间" width="180" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button
            size="small"
            :type="row.status === 1 ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const users = ref([])

onMounted(async () => { users.value = await apiRequest('/admin/users') })

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
</script>
