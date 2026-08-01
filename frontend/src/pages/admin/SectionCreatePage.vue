<template>
  <div style="max-width:560px;">
    <h3 class="page-title">新建板块</h3>
    <el-card>
      <el-form :model="form" label-width="80px" size="large">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" placeholder="板块名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="板块描述（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="create">创建板块</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiRequest } from '../../api'

const router = useRouter()
const saving = ref(false)
const form = reactive({ name: '', description: '', sort_order: 0 })

async function create() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入板块名称')
    return
  }
  saving.value = true
  try {
    await apiRequest('/sections', { method: 'POST', body: JSON.stringify(form) })
    ElMessage.success('板块创建成功')
    router.push('/admin/sections')
  } catch (e) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    saving.value = false
  }
}
</script>
