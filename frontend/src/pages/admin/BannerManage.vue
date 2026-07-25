<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">Banner管理</h3>
      <el-button type="primary" @click="openCreate">新建Banner</el-button>
    </div>
    <el-table :data="banners" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '显示' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{row}">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑Banner' : '新建Banner'">
      <el-form :model="dialog.form">
        <el-form-item label="标题"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="dialog.form.image_url" placeholder="https://..." /></el-form-item>
        <el-form-item label="跳转链接"><el-input v-model="dialog.form.link_url" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dialog.form.sort_order" :min="0" /></el-form-item>
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

const banners = ref([])
const dialog = ref({ visible: false, isEdit: false, form: { title: '', image_url: '', link_url: '', sort_order: 0 } })

onMounted(async () => { banners.value = await apiRequest('/admin/banners') })

function openCreate() { dialog.value = { visible: true, isEdit: false, form: { title: '', image_url: '', link_url: '', sort_order: 0 } } }

function edit(banner) { dialog.value = { visible: true, isEdit: true, form: { ...banner } } }

async function save() {
  const f = dialog.value.form
  if (dialog.value.isEdit) {
    await apiRequest(`/admin/banners/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
  } else {
    await apiRequest('/admin/banners', { method: 'POST', body: JSON.stringify(f) })
  }
  ElMessage.success('保存成功')
  dialog.value.visible = false
  banners.value = await apiRequest('/admin/banners')
}

async function del(banner) {
  await ElMessageBox.confirm('确认删除？')
  await apiRequest(`/admin/banners/${banner.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  banners.value = await apiRequest('/admin/banners')
}
</script>
