import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiRequest, login as apiLogin, register as apiRegister, logout as apiLogout, isLoggedIn } from '../api'

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

  function logout() {
    user.value = null
    apiLogout()
  }

  return { user, loading, fetchUser, login, register, logout }
})
