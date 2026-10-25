/**
 * 侧栏 Banner 共享数据
 * 首页与全站侧栏共用同一份缓存，避免每个页面重复请求。
 */
import { ref } from 'vue'
import { apiRequest } from '../api'

const banners = ref([])
let inflight = null
let loadedOnce = false

async function load() {
  if (loadedOnce) return banners.value
  if (inflight) return inflight
  inflight = apiRequest('/banners')
    .then((list) => {
      banners.value = Array.isArray(list) ? list : []
      loadedOnce = true
      return banners.value
    })
    .catch(() => banners.value)
    .finally(() => { inflight = null })
  return inflight
}

export function useBanners() {
  return { banners, load }
}
