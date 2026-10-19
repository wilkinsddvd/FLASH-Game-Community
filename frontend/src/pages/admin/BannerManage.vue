<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 class="page-title">Banner管理</h3>
        <p class="page-tip">首页左右两侧展示；建议至少配置 2 条，左/右交替排列。图片建议竖图（4:5）。</p>
      </div>
      <el-button type="primary" @click="openCreate">新建Banner</el-button>
    </div>

    <el-table :data="banners" stripe v-loading="loading">
      <el-table-column label="预览" width="110">
        <template #default="{ row }">
          <img v-if="row.image_url" :src="resolveMedia(row.image_url)" class="banner-thumb" :alt="row.title" />
          <span v-else class="banner-thumb banner-thumb-empty">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="160" />
      <el-table-column prop="link_url" label="跳转链接" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.link_url || '—' }}</template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="显示" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="updateStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="edit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && !banners.length" description="还没有 Banner，点右上角新建" />

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑Banner' : '新建Banner'" width="560px">
      <el-form :model="dialog.form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="dialog.form.title" maxlength="128" show-word-limit placeholder="Banner 标题" />
        </el-form-item>

        <el-form-item label="图片" required>
          <div class="image-field">
            <div class="image-row">
              <el-input v-model="dialog.form.image_url" placeholder="图片 URL，或点右侧上传" />
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept="image/jpeg,image/png,image/webp,image/gif"
                :on-change="onFileChange"
              >
                <el-button :loading="uploading">上传图片</el-button>
              </el-upload>
            </div>
            <div class="image-tip">支持 JPG / PNG / WebP / GIF，单张不超过 5MB</div>
            <div v-if="dialog.form.image_url" class="image-preview">
              <img :src="resolveMedia(dialog.form.image_url)" alt="Banner 预览" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="跳转链接">
          <el-input v-model="dialog.form.link_url" placeholder="点击跳转的 URL（选填）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialog.form.sort_order" :min="0" />
          <span class="form-hint">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="dialog.form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest, uploadFile, resolveMedia } from '../../api'

const banners = ref([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)

const dialog = reactive({
  visible: false,
  isEdit: false,
  form: emptyForm(),
})

function emptyForm() {
  return { id: null, title: '', image_url: '', link_url: '', sort_order: 0, status: 1 }
}

async function load() {
  loading.value = true
  try {
    banners.value = await apiRequest('/admin/banners')
  } catch (e) {
    ElMessage.error(e.message || 'Banner 列表加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  dialog.isEdit = false
  dialog.form = emptyForm()
  dialog.visible = true
}

function edit(row) {
  dialog.isEdit = true
  dialog.form = {
    id: row.id,
    title: row.title || '',
    image_url: row.image_url || '',
    link_url: row.link_url || '',
    sort_order: row.sort_order ?? 0,
    status: row.status ?? 1,
  }
  dialog.visible = true
}

function onFileChange(uploadItem) {
  const file = uploadItem?.raw
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  uploading.value = true
  uploadFile('/admin/banners/upload', file)
    .then((res) => {
      if (!res?.url) throw new Error('上传失败：未返回图片地址')
      dialog.form.image_url = res.url
      ElMessage.success('图片已上传')
    })
    .catch((e) => ElMessage.error(e.message || '图片上传失败'))
    .finally(() => {
      uploading.value = false
    })
}

async function save() {
  const f = dialog.form
  if (!f.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!f.image_url.trim()) {
    ElMessage.warning('请先上传图片或填写图片 URL')
    return
  }

  const payload = {
    title: f.title.trim(),
    image_url: f.image_url.trim(),
    link_url: f.link_url.trim(),
    sort_order: Number(f.sort_order) || 0,
    status: f.status,
  }

  saving.value = true
  try {
    if (dialog.isEdit) {
      await apiRequest(`/admin/banners/${f.id}`, { method: 'PUT', body: JSON.stringify(payload) })
    } else {
      await apiRequest('/admin/banners', { method: 'POST', body: JSON.stringify(payload) })
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function updateStatus(row) {
  const next = row.status
  try {
    await apiRequest(`/admin/banners/${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
    ElMessage.success(next === 1 ? '已显示' : '已隐藏')
  } catch (e) {
    row.status = next === 1 ? 0 : 1
    ElMessage.error(e.message || '状态修改失败')
  }
}

async function del(row) {
  try {
    await ElMessageBox.confirm('确认删除该 Banner？', '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await apiRequest(`/admin/banners/${row.id}`, { method: 'DELETE' })
    ElMessage.success('已删除')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>

<style scoped>
.page-tip {
  margin: -6px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.banner-thumb {
  width: 88px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  background: var(--el-fill-color-light);
}
.banner-thumb-empty {
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.image-field { width: 100%; }
.image-row { display: flex; gap: 8px; width: 100%; }
.image-row .el-input { flex: 1; }
.image-tip { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
.image-preview {
  margin-top: 10px;
  width: 160px;
  aspect-ratio: 4 / 5;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
}
.image-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.form-hint { margin-left: 10px; font-size: 12px; color: var(--el-text-color-secondary); }
</style>
