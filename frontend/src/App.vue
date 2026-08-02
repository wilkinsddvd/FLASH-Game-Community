<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/home" class="logo">FLASH ⚡</RouterLink>
        <nav class="main-nav">
          <RouterLink to="/home">首页</RouterLink>
          <RouterLink to="/guide">攻略</RouterLink>
          <RouterLink to="/squad">Squad编制</RouterLink>
          <RouterLink to="/developer">开发者</RouterLink>
          <RouterLink to="/forum">论坛</RouterLink>
          <RouterLink to="/about">关于</RouterLink>
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
    <main class="main-content">
      <RouterView />
    </main>
    <footer class="site-footer">
      <p>© 2026 FLASH Game Community</p>
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
})
</script>
