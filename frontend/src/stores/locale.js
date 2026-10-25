/**
 * 语言状态（Pinia 之外的轻量 store，配合 i18n/index.js）
 */
import { computed, ref } from 'vue'
import { readLang, setLang as applyLang } from '../i18n'

const lang = ref(readLang())

export function useLocaleStore() {
  const locale = computed(() => (lang.value === 'en' ? 'en-US' : 'zh-CN'))
  const isEn = computed(() => lang.value === 'en')
  function toggle() {
    lang.value = lang.value === 'en' ? 'zh' : 'en'
    applyLang(lang.value)
  }
  function set(next) {
    lang.value = next === 'en' ? 'en' : 'zh'
    applyLang(lang.value)
  }
  return { lang, locale, isEn, toggle, set }
}
