<template>
  <div style="max-width:720px;">
    <h3 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h3>
    <el-card>
      <el-form :model="form" label-width="80px" size="large">
        <el-form-item label="分类" required>
          <el-select v-model="form.category">
            <el-option label="资讯" value="news" />
            <el-option label="攻略" value="guide" />
            <el-option label="开发者" value="developer" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="128" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" maxlength="255" placeholder="文章摘要（可选）" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="12" placeholder="文章内容" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="published">发布</el-radio>
            <el-radio value="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">{{ isEdit ? '保存修改' : '创建文章' }}</el-button>
          <el-button @click="$router.push('/admin/articles')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiRequest } from '../../api'

const route = useRoute()
const router = useRouter()
const saving = ref(false)

const isEdit = computed(() => !!route.params.id)
const form = reactive({ category: 'news', title: '', summary: '', content: '', status: 'draft' })

onMounted(async () => {
  if (isEdit.value) {
    try {
      // 用管理端接口加载（公开接口不返回草稿）
      const a = await apiRequest(`/admin/articles/${route.params.id}`)
      Object.assign(form, {
        category: a.category || 'news',
        title: a.title || '',
        summary: a.summary || '',
        content: a.content || '',
        status: a.status || 'draft',
      })
    } catch {
      ElMessage.error('文章不存在')
      router.push('/admin/articles')
    }
  }
})

async function save() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!form.content.trim()) {
    ElMessage.warning('请输入文章内容')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await apiRequest(`/admin/articles/${route.params.id}`, { method: 'PUT', body: JSON.stringify(form) })
      ElMessage.success('更新成功')
    } else {
      await apiRequest('/admin/articles', { method: 'POST', body: JSON.stringify(form) })
      ElMessage.success('创建成功')
    }
    router.push('/admin/articles')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
