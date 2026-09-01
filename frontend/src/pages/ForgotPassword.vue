<template>
  <div class="auth-page">
    <!-- 第一步：输入邮箱 -->
    <el-card v-if="step === 'email'">
      <template #header><h2 style="text-align:center">找回密码</h2></template>
      <p style="text-align:center;color:#999;font-size:13px;margin-bottom:16px;">
        输入您注册时使用的邮箱，我们将发送验证码
      </p>
      <el-form label-width="0" @submit.prevent="handleSendCode">
        <el-form-item>
          <el-input v-model="email" placeholder="注册邮箱" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="sending"
            @click="handleSendCode"
          >
            发送验证码
          </el-button>
        </el-form-item>
        <div style="text-align:center;font-size:13px;">
          <router-link to="/login" style="color:#409eff;">返回登录</router-link>
        </div>
      </el-form>
    </el-card>

    <!-- 第二步：输入验证码 + 新密码 -->
    <el-card v-else>
      <template #header><h2 style="text-align:center">设置新密码</h2></template>
      <el-form label-width="0" @submit.prevent="handleReset">
        <el-form-item>
          <div style="display:flex; gap:8px; width:100%;">
            <el-input v-model="code" placeholder="6位验证码" size="large" maxlength="6" />
            <el-button
              size="large"
              :disabled="countdown > 0"
              :loading="sending"
              @click="handleSendCode"
              style="flex-shrink:0;"
            >
              {{ countdown > 0 ? `${countdown}s` : '重新发送' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-input v-model="newPassword" type="password" placeholder="新密码（至少8位，含字母+数字）" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="resetting" @click="handleReset">
            重置密码
          </el-button>
        </el-form-item>
        <div style="text-align:center;font-size:13px;">
          <router-link to="/login" style="color:#409eff;">返回登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { emailSendCode, emailResetConfirm } from '../api'

const router = useRouter()
const step = ref('email')
const email = ref('')
const code = ref('')
const newPassword = ref('')
const sending = ref(false)
const resetting = ref(false)
const countdown = ref(0)
let timer = null

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (!email.value) {
    ElMessage.warning('请填写邮箱')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    ElMessage.error('邮箱格式不正确')
    return
  }
  sending.value = true
  try {
    await emailSendCode(email.value, 'reset')
    ElMessage.success('验证码已发送至您的邮箱，请查收')
    step.value = 'code'
    startCountdown()
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function handleReset() {
  if (!code.value || code.value.length !== 6) {
    ElMessage.warning('请填写6位验证码')
    return
  }
  if (!newPassword.value || newPassword.value.length < 8) {
    ElMessage.warning('密码至少8位')
    return
  }
  resetting.value = true
  try {
    await emailResetConfirm(email.value, code.value, newPassword.value)
    ElMessage.success('密码重置成功，已自动登录')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '重置失败')
  } finally {
    resetting.value = false
  }
}
</script>
