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

export { API_BASE }
