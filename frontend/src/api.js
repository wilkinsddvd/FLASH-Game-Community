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

export async function emailSendCode(email, purpose = 'register') {
  return apiRequest('/auth/email/send-code', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
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

export async function emailLogin(email, code) {
  const res = await apiRequest('/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
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

export async function listPassphrases() {
  return apiRequest('/auth/admin/passphrase')
}

export async function addPassphrase(passphrase, confirmPassphrase) {
  return apiRequest('/auth/admin/passphrase', {
    method: 'POST',
    body: JSON.stringify({
      passphrase,
      confirm_passphrase: confirmPassphrase,
    }),
  })
}

export async function deletePassphrase(id) {
  return apiRequest(`/auth/admin/passphrase/${id}`, {
    method: 'DELETE',
  })
}

// ── 超级管理员 ──

export async function activateSuperAdmin(passphrase) {
  return apiRequest('/auth/admin/super/activate', {
    method: 'POST',
    body: JSON.stringify({ passphrase }),
  })
}

export async function listSuperAdmins() {
  return apiRequest('/admin/super/admins')
}

export async function listSuperPassphrases() {
  return apiRequest('/admin/super/passphrases')
}

export async function addSuperPassphrase(passphrase, confirmPassphrase, remark) {
  return apiRequest('/admin/super/passphrases', {
    method: 'POST',
    body: JSON.stringify({ passphrase, confirm_passphrase: confirmPassphrase, remark }),
  })
}

export async function updateSuperPassphrase(id, passphrase, confirmPassphrase, remark) {
  return apiRequest(`/admin/super/passphrases/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ passphrase, confirm_passphrase: confirmPassphrase, remark }),
  })
}

export async function deleteSuperPassphrase(id) {
  return apiRequest(`/admin/super/passphrases/${id}`, { method: 'DELETE' })
}

// ── 资料审核 ──

export async function listAudits() {
  return apiRequest('/admin/audits')
}

export async function approveAudit(userId, field) {
  return apiRequest(`/admin/audits/${userId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ field }),
  })
}

export async function rejectAudit(userId, field) {
  return apiRequest(`/admin/audits/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ field }),
  })
}

// ── 用户封禁 ──

export async function banUser(userId, durationHours) {
  return apiRequest(`/admin/users/${userId}/ban`, {
    method: 'PUT',
    body: JSON.stringify({ duration_hours: durationHours }),
  })
}

// ── 答题记录详情 ──

export async function getQuizRecordDetail(recordId) {
  return apiRequest(`/quiz/records/${recordId}`)
}

// ── 站内信 ──

export async function getMessages(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiRequest(`/messages${qs ? `?${qs}` : ''}`)
}

export async function getUnreadCount() {
  return apiRequest('/messages/unread-count')
}

export async function markMessageRead(id) {
  return apiRequest(`/messages/${id}/read`, { method: 'PUT' })
}

export async function markAllMessagesRead() {
  return apiRequest('/messages/read-all', { method: 'PUT' })
}

export async function deleteMessage(id) {
  return apiRequest(`/messages/${id}`, { method: 'DELETE' })
}

export async function sendSystemNotice(title, content) {
  return apiRequest('/messages/system', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  })
}

// ── 用户空间 / 关注 ──

export async function getUserProfile(uid) {
  return apiRequest(`/users/${uid}`)
}

export async function followUser(uid) {
  return apiRequest(`/users/${uid}/follow`, { method: 'POST' })
}

export async function unfollowUser(uid) {
  return apiRequest(`/users/${uid}/follow`, { method: 'DELETE' })
}
