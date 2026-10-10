<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 class="page-title">▶️ 视频管理</h3>
      <div>
        <el-button :loading="refreshingAll" @click="refreshAllCovers">🔄 全部刷新封面</el-button>
        <el-button type="primary" @click="openCreate">添加视频</el-button>
      </div>
    </div>
    <el-alert type="info" :closable="false" style="margin-bottom:12px">
      首页「B站视频」栏目展示启用的视频，点击卡片将新开页面跳转到对应 B站视频。「视频攻略」页按分组展示（新手入门 / 进阶指南）。
      填 BV 号后，系统会自动从 B站 拉取并下载封面到本地（免防盗链）；历史视频可用「刷新封面」补全。
    </el-alert>
    <el-table :data="videos" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="封面" width="120">
        <template #default="{row}">
          <img
            v-if="row.cover_url"
            :src="resolveMedia(row.cover_url)"
            class="vm-cover"
            alt="封面"
            @error="$event.target.style.visibility='hidden'"
          />
          <span v-else class="vm-cover-none">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="bvid" label="BV号" width="140" />
      <el-table-column label="分组" width="110">
        <template #default="{row}">
          <el-tag size="small" :type="row.level === 'advanced' ? 'warning' : 'success'" effect="plain">
            {{ row.level === 'advanced' ? '进阶指南' : '新手入门' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '展示' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="270">
        <template #default="{row}">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" :loading="refreshingId === row.id" @click="refreshOne(row)">刷新封面</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑视频' : '添加视频'">
      <el-form :model="dialog.form" label-width="90px">
        <el-form-item label="标题"><el-input v-model="dialog.form.title" /></el-form-item>
        <el-form-item label="BV号 / 链接">
          <el-input v-model="dialog.form.bvid" placeholder="支持粘贴完整链接、b23.tv 短链或纯 BV 号" />
        </el-form-item>
        <el-form-item label="封面URL">
          <el-input v-model="dialog.form.cover_url" placeholder="留空则自动从 B站 获取并下载到本地" />
        </el-form-item>
        <el-form-item label="攻略分组">
          <el-radio-group v-model="dialog.form.level">
            <el-radio value="beginner">新手入门</el-radio>
            <el-radio value="advanced">进阶指南</el-radio>
          </el-radio-group>
        </el-form-item>
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
import { apiRequest, resolveMedia } from '../../api'

const videos = ref([])
const dialog = ref({ visible: false, isEdit: false, form: {} })
const refreshingAll = ref(false)
const refreshingId = ref(null)

onMounted(async () => { videos.value = await apiRequest('/admin/videos') })

function openCreate() {
  dialog.value = { visible: true, isEdit: false, form: { title: '', bvid: '', cover_url: '', level: 'beginner', sort_order: 0, status: 1 } }
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

async function refreshOne(v) {
  refreshingId.value = v.id
  try {
    await apiRequest(`/admin/videos/${v.id}/refresh-cover`, { method: 'POST' })
    ElMessage.success('封面已刷新')
    videos.value = await apiRequest('/admin/videos')
  } catch (e) {
    ElMessage.error(e.message || '刷新失败')
  } finally {
    refreshingId.value = null
  }
}

async function refreshAllCovers() {
  refreshingAll.value = true
  try {
    const res = await apiRequest('/admin/videos/refresh-covers', { method: 'POST' })
    ElMessage.success(res.message || '刷新完成')
    videos.value = await apiRequest('/admin/videos')
  } catch (e) {
    ElMessage.error(e.message || '刷新失败')
  } finally {
    refreshingAll.value = false
  }
}
</script>

<style scoped>
.vm-cover { width: 96px; height: 54px; object-fit: cover; border-radius: 4px; display: block; }
.vm-cover-none { color: var(--text-muted); font-size: 12px; }
</style>
