import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_KEY = 'flash_theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark')

  function apply(dark) {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    apply(isDark.value)
  }

  function initTheme() {
    apply(isDark.value)
  }

  watch(isDark, (val) => apply(val), { immediate: false })

  return { isDark, toggleTheme, initTheme }
})
