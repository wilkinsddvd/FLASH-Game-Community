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
      <el-table-column label="操作" width="200">
        <template #default="{row}">
          <el-button size="small" @click="openRoleDialog(row)">分配角色</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'"
            @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Role Dialog -->
    <el-dialog v-model="roleDialog.visible" title="分配角色">
      <el-checkbox-group v-model="roleDialog.selected">
        <el-checkbox v-for="r in roles" :key="r.id" :label="r.id" :value="r.id">{{ r.name }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest } from '../../api'

const users = ref([])
const roles = ref([])
const roleDialog = ref({ visible: false, userId: null, selected: [] })

async function loadData() {
  users.value = await apiRequest('/admin/users')
  roles.value = await apiRequest('/admin/roles')
}

function openRoleDialog(user) {
  roleDialog.value = { visible: true, userId: user.id, selected: user.roles.map(r => r.id) }
}

async function saveRoles() {
  await apiRequest('/admin/users/roles', {
    method: 'POST',
    body: JSON.stringify({ user_id: roleDialog.value.userId, role_ids: roleDialog.value.selected }),
  })
  ElMessage.success('角色分配成功')
  roleDialog.value.visible = false
  loadData()
}

async function toggleStatus(user) {
  const newStatus = user.status === 1 ? 0 : 1
  await apiRequest(`/admin/users/${user.id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus }),
  })
  ElMessage.success('状态已更新')
  loadData()
}

onMounted(loadData)
</script>
