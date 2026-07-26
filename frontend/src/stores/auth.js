import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiRequest,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  isLoggedIn,
  emailRegister as apiEmailRegister,
  emailLogin as apiEmailLogin,
} from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)

  async function fetchUser() {
    if (!isLoggedIn()) return null
    try {
      user.value = await apiRequest('/auth/me')
      return user.value
    } catch {
      user.value = null
      return null
    }
  }

  // ── 用户名登录注册 ──

  async function login(username, password) {
    loading.value = true
    try {
      await apiLogin(username, password)
      await fetchUser()
    } finally {
      loading.value = false
    }
  }

  async function register(username, password) {
    loading.value = true
    try {
      await apiRegister(username, password)
    } finally {
      loading.value = false
    }
  }

  // ── 邮箱登录注册 ──

  async function emailRegister(email, code, password, confirmPassword) {
    loading.value = true
    try {
      await apiEmailRegister(email, code, password, confirmPassword)
      await fetchUser()
    } finally {
      loading.value = false
    }
  }

  async function emailLogin(email, password) {
    loading.value = true
    try {
      await apiEmailLogin(email, password)
      await fetchUser()
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    apiLogout()
  }

  return {
    user, loading,
    fetchUser, login, register, logout,
    emailRegister, emailLogin,
  }
})
