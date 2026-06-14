const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(payload.detail || 'Request failed')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE }
