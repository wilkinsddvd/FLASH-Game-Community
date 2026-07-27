<template>
  <div>
    <h3 class="page-title">管理员口令管理</h3>

    <el-card style="max-width:500px;">
      <el-form label-width="100px" @submit.prevent="handleUpdate">
        <el-form-item label="当前口令">
          <el-input v-model="form.oldPassphrase" type="password" placeholder="输入当前口令" show-password size="large" />
        </el-form-item>
        <el-form-item label="新口令">
          <el-input v-model="form.newPassphrase" type="password" placeholder="新口令（至少6位）" show-password size="large" />
        </el-form-item>
        <el-form-item label="确认新口令">
          <el-input v-model="form.confirmPassphrase" type="password" placeholder="再次输入新口令" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="warning" size="large" :loading="loading" @click="handleUpdate">
            更新口令
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 口令状态 -->
    <el-card style="max-width:500px; margin-top:16px;">
      <template #header><span>口令状态</span></template>
      <div v-if="info">
        <p>状态：<el-tag :type="info.exists ? 'success' : 'danger'" size="small">
          {{ info.exists ? '已设置' : '未设置' }}
        </el-tag></p>
        <p v-if="info.updated_at">最后更新：{{ info.updated_at }}</p>
      </div>
      <div v-else>
        <el-skeleton :rows="2" animated />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPassphraseInfo, updatePassphrase } from '../../api'

const loading = ref(false)
const info = ref(null)

const form = reactive({
  oldPassphrase: '',
  newPassphrase: '',
  confirmPassphrase: '',
})

onMounted(async () => {
  try {
    info.value = await getPassphraseInfo()
  } catch { /* ignore */ }
})

async function handleUpdate() {
  if (!form.oldPassphrase) {
    ElMessage.warning('请输入当前口令')
    return
  }
  if (form.newPassphrase.length < 6) {
    ElMessage.warning('新口令至少6位')
    return
  }
  if (form.newPassphrase !== form.confirmPassphrase) {
    ElMessage.error('两次输入的新口令不一致')
    return
  }
  loading.value = true
  try {
    await updatePassphrase(form.oldPassphrase, form.newPassphrase, form.confirmPassphrase)
    ElMessage.success('口令更新成功')
    form.oldPassphrase = ''
    form.newPassphrase = ''
    form.confirmPassphrase = ''
    info.value = await getPassphraseInfo()
  } catch (e) {
    ElMessage.error(e.message || '更新失败')
  } finally {
    loading.value = false
  }
}
</script>
