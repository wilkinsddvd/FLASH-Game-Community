<template>
  <div class="auth-page">
    <el-card>
      <template #header><h2 style="text-align:center">登录 FLASH</h2></template>
      <el-tabs v-model="tab" stretch>
        <el-tab-pane label="用户名登录" name="username">
          <el-form label-width="0" @submit.prevent="handleUsernameLogin">
            <el-form-item>
              <el-input v-model="usernameForm.username" placeholder="用户名" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="usernameForm.password" type="password" placeholder="密码" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" @click="handleUsernameLogin">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="邮箱登录" name="email">
          <el-form label-width="0" @submit.prevent="handleEmailLogin">
            <el-form-item>
              <el-input v-model="emailForm.email" placeholder="邮箱地址" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="emailForm.password" type="password" placeholder="密码" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" @click="handleEmailLogin">
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div style="text-align:right; font-size:13px; margin-bottom:8px;">
            <router-link to="/forgot-password" style="color:#409eff;">忘记密码？</router-link>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div style="text-align:center; font-size:13px; color:#999; margin-top:8px;">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
      <div style="text-align:center; font-size:13px; color:#999; margin-top:4px;">
        管理员？<router-link to="/admin-register" style="color:#e6a23c;">管理员注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { emailLogin as apiEmailLogin } from '../api'

const router = useRouter()
const auth = useAuthStore()
const tab = ref('username')

const usernameForm = reactive({ username: '', password: '' })
const emailForm = reactive({ email: '', password: '' })

async function handleUsernameLogin() {
  try {
    await auth.login(usernameForm.username, usernameForm.password)
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}

async function handleEmailLogin() {
  try {
    await auth.emailLogin(emailForm.email, emailForm.password)
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}
</script>
