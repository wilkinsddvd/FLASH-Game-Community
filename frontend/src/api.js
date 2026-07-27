const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getToken() {
  return localStorage.getItem('flash_token')
}

function getRefreshToken() {
  return localStorage.getItem('flash_refresh_token')
}

function setTokens(access, refresh) {
  localStorage.setItem('flash_token', access)
  if (refresh) localStorage.setItem('flash_refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('flash_token')
  localStorage.removeItem('flash_refresh_token')
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Token expired -> try refresh
  if (response.status === 401 && !path.includes('/auth/')) {
    const rt = getRefreshToken()
    if (rt) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setTokens(data.access_token, data.refresh_token)
        headers['Authorization'] = `Bearer ${data.access_token}`
        response = await fetch(`${API_BASE}${path}`, { ...options, headers })
      } else {
        clearTokens()
        window.location.href = '/login'
        throw new Error('登录已过期，请重新登录')
      }
    } else {
      clearTokens()
      window.location.href = '/login'
      throw new Error('请先登录')
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(payload.detail || `HTTP ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

// ── 原有认证 ──

export async function login(username, password) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export async function register(username, password) {
  const res = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return res
}

export function logout() {
  clearTokens()
  window.location.href = '/login'
}

export function isLoggedIn() {
  return !!getToken()
}

// ── 邮箱认证 ──

export async function emailSendCode(email) {
  return apiRequest('/auth/email/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function emailRegister(email, code, password, confirmPassword) {
  const res = await apiRequest('/auth/email/register', {
    method: 'POST',
    body: JSON.stringify({ email, code, password, confirm_password: confirmPassword }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export async function emailLogin(email, password) {
  const res = await apiRequest('/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export async function emailResetRequest(email) {
  return apiRequest('/auth/email/reset-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function emailResetConfirm(email, code, newPassword) {
  const res = await apiRequest('/auth/email/reset', {
    method: 'POST',
    body: JSON.stringify({ email, code, new_password: newPassword }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export { API_BASE }

// ── 管理员注册 ──

export async function adminRegister(username, password, passphrase) {
  const res = await apiRequest('/auth/admin/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, passphrase }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export async function adminEmailSendCode(email) {
  return apiRequest('/auth/admin/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function adminEmailRegister(email, code, password, confirmPassword, passphrase) {
  const res = await apiRequest('/auth/admin/email/register', {
    method: 'POST',
    body: JSON.stringify({ email, code, password, confirm_password: confirmPassword, passphrase }),
  })
  setTokens(res.access_token, res.refresh_token)
  return res
}

export async function getPassphraseInfo() {
  return apiRequest('/auth/admin/passphrase')
}

export async function updatePassphrase(oldPassphrase, newPassphrase, confirmPassphrase) {
  return apiRequest('/auth/admin/passphrase', {
    method: 'PUT',
    body: JSON.stringify({
      old_passphrase: oldPassphrase,
      new_passphrase: newPassphrase,
      confirm_passphrase: confirmPassphrase,
    }),
  })
}
