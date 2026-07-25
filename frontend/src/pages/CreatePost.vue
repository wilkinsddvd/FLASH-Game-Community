<template>
  <div class="card" style="max-width:700px;margin:0 auto">
    <h2 class="page-title">发帖</h2>
    <el-form label-width="80px">
      <el-form-item label="板块">
        <el-select v-model="form.section_id" placeholder="选择板块" style="width:100%">
          <el-option v-for="s in sections" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="标题（1-100字）" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="内容">
        <el-input v-model="form.content" type="textarea" :rows="10" placeholder="正文内容..." />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit" :loading="submitting">发布</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiRequest } from '../api'

const router = useRouter()
const sections = ref([])
const submitting = ref(false)
const form = ref({ section_id: null, title: '', content: '' })

onMounted(async () => {
  try { sections.value = await apiRequest('/sections') }
  catch (e) { console.error(e) }
})

async function submit() {
  if (!form.value.section_id || !form.value.title || !form.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    const post = await apiRequest('/posts', { method: 'POST', body: JSON.stringify(form.value) })
    ElMessage.success('发帖成功')
    router.push('/forum/post/' + post.id)
  } catch (e) { ElMessage.error(e.message) }
  finally { submitting.value = false }
}
</script>
