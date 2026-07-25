<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">文章管理</h3>
      <el-button type="primary" @click="openCreate">新建文章</el-button>
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
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑文章' : '新建文章'" width="700px">
      <el-form :model="dialog.form">
        <el-form-item label="分类">
          <el-select v-model="dialog.form.category">
            <el-option label="资讯" value="news" />
            <el-option label="攻略" value="guide" />
            <el-option label="开发者" value="developer" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="dialog.form.summary" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="dialog.form.content" type="textarea" :rows="8" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio value="published">发布</el-radio>
            <el-radio value="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const articles = ref([])
const dialog = ref({ visible: false, isEdit: false, form: { category: 'news', title: '', summary: '', content: '', status: 'draft' } })

onMounted(async () => { articles.value = await apiRequest('/admin/articles') })

function openCreate() {
  dialog.value = { visible: true, isEdit: false, form: { category: 'news', title: '', summary: '', content: '', status: 'draft' } }
}

function edit(article) {
  dialog.value = { visible: true, isEdit: true, form: { ...article } }
}

async function save() {
  const f = dialog.value.form
  if (dialog.value.isEdit) {
    await apiRequest(`/admin/articles/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
    ElMessage.success('更新成功')
  } else {
    await apiRequest('/admin/articles', { method: 'POST', body: JSON.stringify(f) })
    ElMessage.success('创建成功')
  }
  dialog.value.visible = false
  articles.value = await apiRequest('/admin/articles')
}

async function del(article) {
  await ElMessageBox.confirm('确认删除文章？')
  await apiRequest(`/admin/articles/${article.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  articles.value = await apiRequest('/admin/articles')
}
</script>
