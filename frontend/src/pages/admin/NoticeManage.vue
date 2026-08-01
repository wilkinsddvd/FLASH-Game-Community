<template>
  <div>
    <h3 class="page-title">系统通知</h3>
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="注意"
      description="系统通知将广播给所有正常用户，请谨慎发送。"
      style="margin-bottom:16px;"
    />

    <el-card style="max-width:560px;">
      <el-form label-width="80px" @submit.prevent="handleSend">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="通知标题（1-100字）" maxlength="100" show-word-limit size="large" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="通知内容（1-10000字）"
            maxlength="10000"
            show-word-limit
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-popconfirm title="确认向全站用户发送该通知？" width="220" @confirm="handleSend">
            <template #reference>
              <el-button type="danger" size="large" :loading="sending">发布系统通知</el-button>
            </template>
          </el-popconfirm>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { sendSystemNotice } from '../../api'

const sending = ref(false)
const form = reactive({ title: '', content: '' })

async function handleSend() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入通知标题')
    return
  }
  if (!form.content.trim()) {
    ElMessage.warning('请输入通知内容')
    return
  }
  sending.value = true
  try {
    const res = await sendSystemNotice(form.title.trim(), form.content.trim())
    ElMessage.success(`已发送给 ${res.receiver_count || ''} 位用户`)
    form.title = ''
    form.content = ''
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}
</script>
