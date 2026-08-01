<template>
  <div>
    <h3 class="page-title">权限管理</h3>
    <el-table :data="permissions" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="权限名称" />
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

const permissions = ref([])

onMounted(async () => { permissions.value = await apiRequest('/admin/permissions') })

async function del(perm) {
  await ElMessageBox.confirm('确认删除权限？')
  await apiRequest(`/admin/permissions/${perm.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  permissions.value = await apiRequest('/admin/permissions')
}
</script>
