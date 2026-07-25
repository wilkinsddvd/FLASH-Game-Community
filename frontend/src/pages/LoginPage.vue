<template>
  <div class="auth-page">
    <el-card>
      <template #header><h2 style="text-align:center">登录 FLASH</h2></template>
      <el-form :model="form" label-width="0" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
        <div style="text-align:center; font-size:13px; color:#999">
          还没有账号？<RouterLink to="/register">立即注册</RouterLink>
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
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  try {
    await auth.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}
</script>
