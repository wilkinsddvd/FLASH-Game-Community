<template>
  <div class="auth-page">
    <el-card>
      <template #header><h2 style="text-align:center">注册 FLASH</h2></template>
      <el-form :model="form" label-width="0" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名（3-20位字母数字下划线）" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码（至少8位，含字母+数字）" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.confirm" type="password" placeholder="确认密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
        <div style="text-align:center; font-size:13px; color:#999">
          已有账号？<RouterLink to="/login">去登录</RouterLink>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '', confirm: '' })

async function handleRegister() {
  if (form.password !== form.confirm) {
    ElMessage.error('两次密码不一致')
    return
  }
  try {
    await auth.register(form.username, form.password)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  }
}
</script>
