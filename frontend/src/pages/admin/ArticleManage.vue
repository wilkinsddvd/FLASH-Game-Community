<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">文章管理</h3>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">新建文章</el-button>
    </div>
    <el-table :data="articles" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="category" label="分类" width="80">
        <template #default="{row}">
          <el-tag size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="author_name" label="作者" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{row}">
          <el-button size="small" @click="$router.push(`/admin/articles/${row.id}/edit`)">编辑</el-button>
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

const articles = ref([])

onMounted(async () => { articles.value = await apiRequest('/admin/articles') })

async function del(article) {
  await ElMessageBox.confirm('确认删除文章？')
  await apiRequest(`/admin/articles/${article.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  articles.value = await apiRequest('/admin/articles')
}
</script>
