<template>
  <div class="auth-page">
    <el-card>
      <template #header>
        <h2 style="text-align:center; color:#e6a23c;">🛡️ 管理员注册</h2>
      </template>

      <el-alert
        title="管理员注册需要输入管理员口令，口令错误 5 次将锁定 30 分钟"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom:16px;"
      />

      <el-tabs v-model="tab" stretch>
        <!-- ── 用户名+口令 ── -->
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
              <el-input
                v-model="form.passphrase"
                type="password"
                placeholder="管理员口令"
                size="large"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" size="large" style="width:100%" :loading="loading" @click="handleUsernameRegister">
                注册管理员
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- ── 邮箱+口令 ── -->
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
              <el-input
                v-model="emailForm.passphrase"
                type="password"
                placeholder="管理员口令"
                size="large"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" size="large" style="width:100%" :loading="loading" @click="handleEmailRegister">
                注册管理员
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div style="text-align:center; font-size:13px; color:#999; margin-top:8px;">
        已有账号？<router-link to="/login" style="color:#409eff;">去登录</router-link>
        &nbsp;|&nbsp;
        <router-link to="/register" style="color:#409eff;">普通注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { adminRegister, adminEmailSendCode, adminEmailRegister } from '../api'

const router = useRouter()
const loading = ref(false)
const tab = ref('username')

// ── 用户名注册 ──
const form = reactive({ username: '', password: '', confirm: '', passphrase: '' })

async function handleUsernameRegister() {
  if (form.password !== form.confirm) {
    ElMessage.error('两次密码不一致')
    return
  }
  if (!form.passphrase) {
    ElMessage.warning('请输入管理员口令')
    return
  }
  loading.value = true
  try {
    await adminRegister(form.username, form.password, form.passphrase)
    ElMessage.success('管理员注册成功，正在跳转...')
    router.push('/admin')
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}

// ── 邮箱注册 ──
const emailForm = reactive({ email: '', password: '', confirm: '', code: '', passphrase: '' })
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
    ElMessage.error('邮箱格式不正确')
    return
  }
  sendingCode.value = true
  try {
    await adminEmailSendCode(emailForm.email)
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
  if (!emailForm.passphrase) {
    ElMessage.warning('请输入管理员口令')
    return
  }
  loading.value = true
  try {
    await adminEmailRegister(emailForm.email, emailForm.code, emailForm.password, emailForm.confirm, emailForm.passphrase)
    ElMessage.success('管理员注册成功，正在跳转...')
    router.push('/admin')
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
