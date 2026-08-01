<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">板块管理</h3>
      <el-button type="primary" @click="$router.push('/admin/sections/create')">新建板块</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const sections = ref([])

onMounted(async () => { sections.value = await apiRequest('/sections') })

async function del(section) {
  await ElMessageBox.confirm('确认删除板块？')
  await apiRequest(`/sections/${section.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  sections.value = await apiRequest('/sections')
}
</script>
