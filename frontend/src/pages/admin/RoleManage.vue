<template>
  <div>
    <h3 class="page-title">角色管理</h3>
    <el-table :data="roles" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="code" label="编码" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const roles = ref([])

onMounted(async () => {
  roles.value = await apiRequest('/admin/roles')
})

async function del(role) {
  await ElMessageBox.confirm('确认删除角色？')
  await apiRequest(`/admin/roles/${role.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  roles.value = await apiRequest('/admin/roles')
}
</script>
