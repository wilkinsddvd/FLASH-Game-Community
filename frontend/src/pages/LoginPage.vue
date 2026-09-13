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
              <div class="captcha-row">
                <el-input
                  v-model="usernameForm.captchaCode"
                  placeholder="图形验证码"
                  size="large"
                  maxlength="6"
                  style="flex:1"
                  @keyup.enter="handleUsernameLogin"
                />
                <img
                  v-if="captcha.image"
                  :src="captcha.image"
                  class="captcha-img"
                  title="看不清？点击刷新"
                  alt="点击刷新验证码"
                  @click="loadCaptcha"
                />
                <div v-else class="captcha-img captcha-img--empty" @click="loadCaptcha">
                  {{ captchaLoading ? '加载中…' : '点击加载' }}
                </div>
              </div>
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
              <div style="display:flex;gap:8px;width:100%">
                <el-input v-model="emailForm.code" placeholder="6位验证码" size="large" maxlength="6" style="flex:1" />
                <el-button size="large" :disabled="countdown > 0 || sending" @click="sendLoginCode" style="width:130px">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
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
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { emailLogin as apiEmailLogin, emailSendCode, getCaptcha } from '../api'

const router = useRouter()
const auth = useAuthStore()
const tab = ref('username')
const sending = ref(false)
const countdown = ref(0)
let timer = null

const usernameForm = reactive({ username: '', password: '', captchaCode: '' })
const emailForm = reactive({ email: '', code: '' })

// 图形验证码（一次性，失败后自动刷新）
const captcha = reactive({ id: '', image: '' })
const captchaLoading = ref(false)

async function loadCaptcha() {
  captchaLoading.value = true
  try {
    const res = await getCaptcha()
    captcha.id = res.captcha_id
    captcha.image = res.image
  } catch (e) {
    ElMessage.error(e.message || '验证码获取失败，请稍后重试')
  } finally {
    captchaLoading.value = false
  }
}

async function handleUsernameLogin() {
  if (!usernameForm.username || !usernameForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (!usernameForm.captchaCode) {
    ElMessage.warning('请输入图形验证码')
    return
  }
  try {
    await auth.login(
      usernameForm.username,
      usernameForm.password,
      captcha.id,
      usernameForm.captchaCode,
    )
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
    // 验证码一次性，失败后必须换一张
    usernameForm.captchaCode = ''
    await loadCaptcha()
  }
}

async function sendLoginCode() {
  if (!emailForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  sending.value = true
  try {
    await emailSendCode(emailForm.email, 'login')
    ElMessage.success('验证码已发送至您的邮箱，请查收')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function handleEmailLogin() {
  if (!emailForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  try {
    await auth.emailLogin(emailForm.email, emailForm.code)
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}

onMounted(loadCaptcha)

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.captcha-row {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}
.captcha-img {
  height: 40px;
  width: 110px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  cursor: pointer;
  object-fit: cover;
  user-select: none;
}
.captcha-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
}
</style>
