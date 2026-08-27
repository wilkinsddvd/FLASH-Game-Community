<template>
  <div>
    <h2 class="page-title">📮 问题反馈</h2>
    <p class="text-muted">发现编制错误或有网站改进建议？告诉我们，管理员会尽快处理。</p>

    <el-alert v-if="!isLogin" type="warning" :closable="false" style="margin-bottom:16px">
      提交反馈需要登录，<el-link type="primary" @click="$router.push('/login')">去登录 →</el-link>
    </el-alert>

    <div class="card">
      <div class="card-title">✍️ 提交反馈</div>
      <el-form :model="form" label-width="90px" style="max-width:640px">
        <el-form-item label="反馈类型" required>
          <el-radio-group v-model="form.category">
            <el-radio value="roster_error">编制错误</el-radio>
            <el-radio value="suggestion">网站改进建议</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="请描述具体问题或建议…"
          />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" maxlength="64" placeholder="选填：QQ / 邮箱等，方便管理员回复" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" :disabled="!isLogin" @click="submit">
            提交反馈
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card" v-if="myList.length">
      <div class="card-title">📋 我的反馈</div>
      <el-table :data="myList" stripe size="small">
        <el-table-column label="类型" width="120">
          <template #default="{row}">
            <el-tag :type="row.category === 'roster_error' ? 'danger' : 'primary'" size="small">
              {{ row.category === 'roster_error' ? '编制错误' : '改进建议' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 0 ? 'warning' : (row.status === 1 ? 'success' : 'info')" size="small">
              {{ row.status === 0 ? '待处理' : (row.status === 1 ? '已处理' : '已忽略') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn } from '../api'

const isLogin = isLoggedIn()
const form = ref({ category: 'roster_error', content: '', contact: '' })
const submitting = ref(false)
const myList = ref([])

async function submit() {
  if (!form.value.content.trim()) {
    ElMessage.warning('请填写反馈内容')
    return
  }
  submitting.value = true
  try {
    await apiRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify(form.value),
    })
    ElMessage.success('反馈提交成功，感谢你的支持！')
    form.value.content = ''
    form.value.contact = ''
    myList.value = await apiRequest('/feedback/mine')
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!isLogin) return
  try { myList.value = await apiRequest('/feedback/mine') } catch (e) { console.error(e) }
})
</script>
