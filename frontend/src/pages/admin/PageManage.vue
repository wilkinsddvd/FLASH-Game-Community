<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">CMS页面管理</h3>
      <el-button type="primary" @click="openCreate">新建页面</el-button>
    </div>
    <el-table :data="pages" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="slug" label="Slug" width="150" />
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑页面' : '新建页面'" width="700px">
      <el-form :model="dialog.form">
        <el-form-item label="Slug"><el-input v-model="dialog.form.slug" :disabled="dialog.isEdit" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="dialog.form.content" type="textarea" :rows="8" /></el-form-item>
        <el-form-item label="SEO标题"><el-input v-model="dialog.form.meta_title" /></el-form-item>
        <el-form-item label="SEO描述"><el-input v-model="dialog.form.meta_desc" /></el-form-item>
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

const pages = ref([])
const dialog = ref({ visible: false, isEdit: false, form: { slug: '', title: '', content: '', meta_title: '', meta_desc: '' } })

onMounted(async () => { pages.value = await apiRequest('/admin/pages') })

function openCreate() { dialog.value = { visible: true, isEdit: false, form: { slug: '', title: '', content: '', meta_title: '', meta_desc: '' } } }

function edit(page) { dialog.value = { visible: true, isEdit: true, form: { ...page } } }

async function save() {
  const f = dialog.value.form
  if (dialog.value.isEdit) {
    await apiRequest(`/admin/pages/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
  } else {
    await apiRequest('/admin/pages', { method: 'POST', body: JSON.stringify(f) })
  }
  ElMessage.success('保存成功')
  dialog.value.visible = false
  pages.value = await apiRequest('/admin/pages')
}

async function del(page) {
  await ElMessageBox.confirm('确认删除？')
  await apiRequest(`/admin/pages/${page.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  pages.value = await apiRequest('/admin/pages')
}
</script>
