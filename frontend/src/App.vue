<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/home" class="logo">SquadFlash ⚡</RouterLink>
        <button
          class="nav-toggle"
          type="button"
          :aria-expanded="navOpen ? 'true' : 'false'"
          :aria-label="t('nav.menu')"
          @click="navOpen = !navOpen"
        >{{ navOpen ? '✕' : '☰' }}</button>
        <nav class="main-nav" :class="{ 'is-open': navOpen }">
          <RouterLink to="/home" @click="navOpen = false">{{ t('nav.home') }}</RouterLink>
          <RouterLink to="/guide" @click="navOpen = false">{{ t('nav.guide') }}</RouterLink>
          <RouterLink to="/squad" @click="navOpen = false">{{ t('nav.squad') }}</RouterLink>
          <RouterLink to="/squad/points" @click="navOpen = false">{{ t('nav.points') }}</RouterLink>
          <RouterLink to="/squad/vehicles" @click="navOpen = false">{{ t('nav.vehicles') }}</RouterLink>
          <RouterLink to="/squad/fire-control" @click="navOpen = false">{{ t('nav.fireControl') }}</RouterLink>
          <RouterLink to="/cert" @click="navOpen = false">{{ t('nav.cert') }}</RouterLink>
          <RouterLink to="/developer" @click="navOpen = false">{{ t('nav.developer') }}</RouterLink>
          <RouterLink to="/about" @click="navOpen = false">{{ t('nav.about') }}</RouterLink>
        </nav>
        <div class="header-actions">
          <button type="button" class="lang-switch" :aria-label="t('nav.lang')" @click="locale.toggle()">
            <span :class="{ on: !locale.isEn.value }">中</span>
            <span class="lang-sep">/</span>
            <span :class="{ on: locale.isEn.value }">EN</span>
          </button>
          <el-button text circle :title="theme.isDark ? t('nav.themeToLight') : t('nav.themeToDark')" @click="theme.toggleTheme()">
            {{ theme.isDark ? '🌙' : '☀️' }}
          </el-button>
          <template v-if="auth.user">
            <el-button text @click="goAdmin" v-if="isAdmin">{{ t('nav.admin') }}</el-button>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" style="margin:0 8px;">
              <el-button text @click="$router.push('/messages')">📨 {{ t('nav.messages') }}</el-button>
            </el-badge>
            <el-dropdown>
              <span class="user-dropdown">{{ auth.user.username }}</span>
              <template #dropdown>
                <el-dropdown-item @click="$router.push('/settings')">⚙️ {{ t('nav.settings') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/space/' + auth.user.uid)">{{ t('nav.space') }}</el-dropdown-item>
                <el-dropdown-item divided @click="auth.logout()">{{ t('nav.logout') }}</el-dropdown-item>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button @click="$router.push('/login')">{{ t('nav.login') }}</el-button>
            <el-button type="primary" @click="$router.push('/register')">{{ t('nav.register') }}</el-button>
          </template>
        </div>
      </div>
    </header>
    <!-- 路由切换加载进度条 -->
    <div class="route-progress" :class="{ visible: routeLoading }">
      <div class="route-progress-bar"></div>
    </div>
    <main class="main-content" :class="{ 'main-wide': route.meta.wide, 'main-full': isFullBleed }">
      <!-- 左右侧栏（Banner）：全站沿用首页布局，窄屏自动收成顶部横滑条 -->
      <SideBanners v-if="showRails" side="left" :banners="leftBanners" />
      <div v-if="showRails && banners.length" class="banner-mobile-strip">
        <a
          v-for="b in banners"
          :key="'m' + b.id"
          class="banner-mobile-card"
          :href="b.link_url || undefined"
          :target="b.link_url ? '_blank' : undefined"
          :rel="b.link_url ? 'noopener noreferrer' : undefined"
        >
          <img v-if="b.image_url" :src="resolveMedia(b.image_url)" :alt="b.title" loading="lazy" />
          <span>{{ b.title }}</span>
        </a>
      </div>
      <div class="shell-main">
      <RouterView v-slot="{ Component }">
        <!--
          不要用 <transition mode="out-in">：快速连点导航时，离开动画进行中再次切换路由，
          Vue 可能卡在“旧页已移除、新页未进入”的状态，整页空白且只能刷新恢复。
          这里改为按 path 强制换 key + 新页单边淡入，任何一次导航都有内容。
        -->
        <div class="page-view">
          <component :is="Component" :key="route.path" />
        </div>
      </RouterView>
      </div>
      <SideBanners v-if="showRails" side="right" :banners="rightBanners" />
    </main>
    <footer class="site-footer">
      <p>
        © 2026 SquadFlash ｜
        <a
          class="beian-link"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >鲁ICP备2025198092号-2</a>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useLocaleStore } from './stores/locale'
import { useI18n } from 'vue-i18n'
import { getUnreadCount, resolveMedia } from './api'
import SideBanners from './components/SideBanners.vue'
import { fullBleed } from './stores/layout'
import { useBanners } from './stores/banners'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const locale = useLocaleStore()
const { t } = useI18n()

// 路由切换加载态：懒加载页面切换时显示顶部进度条，保证切换流畅
const routeLoading = ref(false)
// 移动端导航抽屉开关
const navOpen = ref(false)
let loadTimer = null
router.beforeEach(() => {
  routeLoading.value = true
})
router.afterEach(() => {
  navOpen.value = false
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    routeLoading.value = false
  }, 180)
})

// ── 全站壳层：侧栏 + 内容（沿用首页布局）──
const { banners, load: loadBanners } = useBanners()
const leftBanners = computed(() => banners.value.filter((_, i) => i % 2 === 0))
const rightBanners = computed(() => banners.value.filter((_, i) => i % 2 === 1))
/** 满宽白名单：后台 / 登录注册 / RAAS 铺满档 */
const isFullBleed = computed(() => !!route.meta.fullBleed || fullBleed.value)
const showRails = computed(() => !isFullBleed.value && banners.value.length > 0)

// 根据角色判断是否显示管理后台入口（登录后立即生效，无需刷新）
const isAdmin = computed(() => {
  const role = auth.user?.role
  return role === 'admin' || role === 'super_admin'
})
const unreadCount = ref(0)
let unreadTimer = null

const goAdmin = () => router.push('/admin')

async function refreshUnread() {
  if (!auth.user) return
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.count || 0
  } catch { /* ignore */ }
}

onMounted(async () => {
  loadBanners()
  theme.initTheme()
  if (auth.user === null) {
    await auth.fetchUser()
  }
  refreshUnread()
  unreadTimer = setInterval(refreshUnread, 60000)
})

onUnmounted(() => {
  if (unreadTimer) clearInterval(unreadTimer)
  clearTimeout(loadTimer)
})
</script>
