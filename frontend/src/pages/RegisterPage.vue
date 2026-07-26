<template>
  <div class="auth-page">
    <el-card>
      <template #header><h2 style="text-align:center">注册 FLASH</h2></template>
      <el-tabs v-model="tab" stretch>
        <el-tab-pane label="用户名注册" name="username">
          <el-form label-width="0" @submit.prevent="handleUsernameRegister">
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
              <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" @click="handleUsernameRegister">
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="邮箱注册" name="email">
          <el-form label-width="0" @submit.prevent="handleEmailRegister">
            <el-form-item>
              <el-input v-model="emailForm.email" placeholder="邮箱地址" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="emailForm.password" type="password" placeholder="设置密码（至少8位，含字母+数字）" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <el-input v-model="emailForm.confirm" type="password" placeholder="确认密码" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <div style="display:flex; gap:8px; width:100%;">
                <el-input v-model="emailForm.code" placeholder="6位验证码" size="large" maxlength="6" />
                <el-button
                  size="large"
                  :disabled="codeCountdown > 0"
                  :loading="sendingCode"
                  @click="handleSendCode"
                  style="flex-shrink:0;"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="agreePolicy">
                我已阅读并同意 <el-button text type="primary" size="small">《隐私政策》</el-button>
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" style="width:100%" :loading="auth.loading" :disabled="!agreePolicy" @click="handleEmailRegister">
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div style="text-align:center; font-size:13px; color:#999; margin-top:8px;">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { emailSendCode } from '../api'

const router = useRouter()
const auth = useAuthStore()
const tab = ref('username')

// ── 用户名注册 ──
const form = reactive({ username: '', password: '', confirm: '' })

async function handleUsernameRegister() {
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

// ── 邮箱注册 ──
const emailForm = reactive({ email: '', password: '', confirm: '', code: '' })
const agreePolicy = ref(false)
const sendingCode = ref(false)
const codeCountdown = ref(0)
let countdownTimer = null

function startCountdown() {
  codeCountdown.value = 60
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (!emailForm.email) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }
  // 简单前端校验
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
    ElMessage.error('邮箱格式不正确')
    return
  }
  sendingCode.value = true
  try {
    await emailSendCode(emailForm.email)
    ElMessage.success('验证码已发送至您的邮箱，请查收')
    startCountdown()
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sendingCode.value = false
  }
}

async function handleEmailRegister() {
  if (emailForm.password !== emailForm.confirm) {
    ElMessage.error('两次密码不一致')
    return
  }
  if (!emailForm.code) {
    ElMessage.warning('请填写验证码')
    return
  }
  if (!agreePolicy.value) {
    ElMessage.warning('请阅读并同意隐私政策')
    return
  }
  try {
    await auth.emailRegister(emailForm.email, emailForm.code, emailForm.password, emailForm.confirm)
    ElMessage.success('注册成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  }
}
</script>
