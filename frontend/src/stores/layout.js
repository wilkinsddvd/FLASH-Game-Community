/**
 * 全局布局状态
 * - fullBleed：当前页面需要「满宽无侧栏」（后台 / 登录注册 / RAAS 铺满档）
 */
import { ref } from 'vue'

export const fullBleed = ref(false)

export function setFullBleed(v) {
  fullBleed.value = !!v
}
