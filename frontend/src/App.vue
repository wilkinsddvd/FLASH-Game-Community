<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/home" class="logo">FLASH ⚡</RouterLink>
        <nav class="main-nav">
          <RouterLink to="/home">首页</RouterLink>
          <RouterLink to="/guide">攻略</RouterLink>
          <RouterLink to="/developer">开发者</RouterLink>
          <RouterLink to="/forum">论坛</RouterLink>
          <RouterLink to="/about">关于</RouterLink>
        </nav>
        <div class="header-actions">
          <template v-if="auth.user">
            <el-button text @click="goAdmin" v-if="isAdmin">管理后台</el-button>
            <el-dropdown>
              <span class="user-dropdown">{{ auth.user.username }}</span>
              <template #dropdown>
                <el-dropdown-item @click="auth.logout()">退出登录</el-dropdown-item>
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
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isAdmin = window.localStorage.getItem('flash_token')

const goAdmin = () => router.push('/admin')

onMounted(() => {
  if (auth.user === null) {
    auth.fetchUser()
  }
})
</script>
