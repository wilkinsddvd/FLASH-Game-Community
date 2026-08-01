<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">角色管理</h3>
      <el-button type="primary" @click="openCreate">新建角色</el-button>
    </div>
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

    <!-- Create Dialog -->
    <el-dialog v-model="createDialog.visible" title="新建角色">
      <el-form :model="createDialog.form">
        <el-form-item label="名称"><el-input v-model="createDialog.form.name" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="createDialog.form.code" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="createDialog.form.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="createRole">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const roles = ref([])
const createDialog = ref({ visible: false, form: { name: '', code: '', description: '' } })

onMounted(async () => {
  roles.value = await apiRequest('/admin/roles')
})

function openCreate() { createDialog.value = { visible: true, form: { name: '', code: '', description: '' } } }

async function createRole() {
  await apiRequest('/admin/roles', { method: 'POST', body: JSON.stringify(createDialog.value.form) })
  ElMessage.success('创建成功')
  createDialog.value.visible = false
  roles.value = await apiRequest('/admin/roles')
}

async function del(role) {
  await ElMessageBox.confirm('确认删除角色？')
  await apiRequest(`/admin/roles/${role.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  roles.value = await apiRequest('/admin/roles')
}
</script>
