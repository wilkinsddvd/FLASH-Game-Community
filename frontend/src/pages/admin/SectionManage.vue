<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">板块管理</h3>
      <el-button type="primary" @click="openCreate">新建板块</el-button>
    </div>
    <el-table :data="sections" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createDialog.visible" title="新建板块">
      <el-form :model="createDialog.form">
        <el-form-item label="名称"><el-input v-model="createDialog.form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="createDialog.form.description" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="createDialog.form.sort_order" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="create">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const sections = ref([])
const createDialog = ref({ visible: false, form: { name: '', description: '', sort_order: 0 } })

onMounted(async () => { sections.value = await apiRequest('/sections') })

function openCreate() { createDialog.value = { visible: true, form: { name: '', description: '', sort_order: 0 } } }

async function create() {
  await apiRequest('/sections', { method: 'POST', body: JSON.stringify(createDialog.value.form) })
  ElMessage.success('创建成功')
  createDialog.value.visible = false
  sections.value = await apiRequest('/sections')
}

async function del(section) {
  await ElMessageBox.confirm('确认删除板块？')
  await apiRequest(`/sections/${section.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  sections.value = await apiRequest('/sections')
}
</script>
