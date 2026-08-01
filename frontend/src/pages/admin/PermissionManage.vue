<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">权限管理</h3>
      <el-button type="primary" @click="openCreate">新建权限</el-button>
    </div>
    <el-table :data="permissions" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="权限名称" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createDialog.visible" title="新建权限">
      <el-form :model="createDialog.form">
        <el-form-item label="权限名称">
          <el-input v-model="createDialog.form.name" placeholder="例如：审核帖子" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="createPerm">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const permissions = ref([])
const createDialog = ref({ visible: false, form: { name: '' } })

onMounted(async () => { permissions.value = await apiRequest('/admin/permissions') })

function openCreate() { createDialog.value = { visible: true, form: { name: '' } } }

async function createPerm() {
  if (!createDialog.value.form.name.trim()) {
    ElMessage.warning('请输入权限名称')
    return
  }
  await apiRequest('/admin/permissions', { method: 'POST', body: JSON.stringify(createDialog.value.form) })
  ElMessage.success('创建成功')
  createDialog.value.visible = false
  permissions.value = await apiRequest('/admin/permissions')
}

async function del(perm) {
  await ElMessageBox.confirm('确认删除权限？')
  await apiRequest(`/admin/permissions/${perm.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  permissions.value = await apiRequest('/admin/permissions')
}
</script>
