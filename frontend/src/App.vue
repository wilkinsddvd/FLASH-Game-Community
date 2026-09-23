<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/home" class="logo">SquadFlash ⚡</RouterLink>
        <button
          class="nav-toggle"
          type="button"
          :aria-expanded="navOpen ? 'true' : 'false'"
          aria-label="导航菜单"
          @click="navOpen = !navOpen"
        >{{ navOpen ? '✕' : '☰' }}</button>
        <nav class="main-nav" :class="{ 'is-open': navOpen }">
          <RouterLink to="/home" @click="navOpen = false">首页</RouterLink>
          <RouterLink to="/guide" @click="navOpen = false">攻略</RouterLink>
          <RouterLink to="/squad" @click="navOpen = false">Squad编制</RouterLink>
          <RouterLink to="/cert" @click="navOpen = false">基础认证</RouterLink>
          <RouterLink to="/feedback" @click="navOpen = false">反馈</RouterLink>
          <RouterLink to="/board" @click="navOpen = false">留言板</RouterLink>
          <RouterLink to="/developer" @click="navOpen = false">SQUAD闪电谈</RouterLink>
          <RouterLink to="/about" @click="navOpen = false">关于</RouterLink>
        </nav>
        <div class="header-actions">
          <el-button text circle :title="theme.isDark ? '切换到亮色模式' : '切换到黑夜模式'" @click="theme.toggleTheme()">
            {{ theme.isDark ? '🌙' : '☀️' }}
          </el-button>
          <template v-if="auth.user">
            <el-button text @click="goAdmin" v-if="isAdmin">管理后台</el-button>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" style="margin:0 8px;">
              <el-button text @click="$router.push('/messages')">📨 站内信</el-button>
            </el-badge>
            <el-dropdown>
              <span class="user-dropdown">{{ auth.user.username }}</span>
              <template #dropdown>
                <el-dropdown-item @click="$router.push('/settings')">⚙️ 个人设置</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/space/' + auth.user.uid)">个人空间</el-dropdown-item>
                <el-dropdown-item divided @click="auth.logout()">退出登录</el-dropdown-item>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    <!-- 路由切换加载进度条 -->
    <div class="route-progress" :class="{ visible: routeLoading }">
      <div class="route-progress-bar"></div>
    </div>
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { getUnreadCount } from './api'

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

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
