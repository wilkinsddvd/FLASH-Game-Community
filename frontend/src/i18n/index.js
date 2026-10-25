/**
 * vue-i18n 初始化
 * - 语言持久化在 localStorage.flash_lang，同时同步 <html lang>
 * - 界面文案走 locales/*；数据名（阵营/编制/载具）走 data/squad/i18n-names.js
 */
import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN.js'
import enUS from '../locales/en-US.js'

export const LANGS = [
  { key: 'zh', label: '中', full: '中文', locale: 'zh-CN' },
  { key: 'en', label: 'EN', full: 'English', locale: 'en-US' },
]

const STORAGE_KEY = 'flash_lang'

export function readLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'zh') return v
  } catch { /* ignore */ }
  return 'zh'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: readLang() === 'en' ? 'en-US' : 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'en-US': enUS },
  warnHtmlMessage: false,
})

export function applyHtmlLang(locale) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', locale)
}

export function setLang(key) {
  const lang = key === 'en' ? 'en' : 'zh'
  const locale = lang === 'en' ? 'en-US' : 'zh-CN'
  i18n.global.locale.value = locale
  try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  applyHtmlLang(locale)
  return lang
}

export default i18n
