<template>
  <div>
    <div style="display:flex;justify-content:space-between">
      <h3 class="page-title">▶️ 视频管理</h3>
      <el-button type="primary" @click="openCreate">添加视频</el-button>
    </div>
    <el-alert type="info" :closable="false" style="margin-bottom:12px">
      首页「B站视频」栏目展示启用的视频，点击卡片将新开页面跳转到对应 B站视频。
    </el-alert>
    <el-table :data="videos" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="bvid" label="BV号" width="140" />
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '展示' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑视频' : '添加视频'">
      <el-form :model="dialog.form" label-width="90px">
        <el-form-item label="标题"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="BV号">
          <el-input v-model="dialog.form.bvid" placeholder="如 BV1xx411c7mD" />
        </el-form-item>
        <el-form-item label="封面URL"><el-input v-model="dialog.form.cover_url" placeholder="https://...（可选）" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dialog.form.sort_order" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" active-text="展示" inactive-text="隐藏" />
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

const videos = ref([])
const dialog = ref({ visible: false, isEdit: false, form: {} })

onMounted(async () => { videos.value = await apiRequest('/admin/videos') })

function openCreate() {
  dialog.value = { visible: true, isEdit: false, form: { title: '', bvid: '', cover_url: '', sort_order: 0, status: 1 } }
}

function edit(v) {
  dialog.value = { visible: true, isEdit: true, form: { ...v } }
}

async function save() {
  const f = dialog.value.form
  if (!f.title || !f.bvid) return ElMessage.warning('标题和BV号必填')
  if (dialog.value.isEdit) {
    await apiRequest(`/admin/videos/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
  } else {
    await apiRequest('/admin/videos', { method: 'POST', body: JSON.stringify(f) })
  }
  ElMessage.success('保存成功')
  dialog.value.visible = false
  videos.value = await apiRequest('/admin/videos')
}

async function del(v) {
  await ElMessageBox.confirm('确认删除该视频？')
  await apiRequest(`/admin/videos/${v.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  videos.value = await apiRequest('/admin/videos')
}
</script>
