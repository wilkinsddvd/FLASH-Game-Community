<template>
  <div class="admin-layout">
    <div class="admin-sidebar">
      <el-menu :default-active="activeMenu" router style="border-right:none">
        <el-menu-item index="/admin/users">👥 用户管理</el-menu-item>
        <el-menu-item index="/admin/roles">🔐 角色管理</el-menu-item>
        <el-menu-item index="/admin/permissions">🛡️ 权限管理</el-menu-item>
        <el-menu-item index="/admin/quiz">📚 基础认证管理</el-menu-item>
        <el-menu-item index="/admin/videos">▶️ 视频管理</el-menu-item>
        <el-menu-item index="/admin/feedback">📮 反馈管理</el-menu-item>
        <el-menu-item index="/admin/audits">🛡️ 资料审核</el-menu-item>
        <el-menu-item index="/admin/banners">📺 Banner管理</el-menu-item>
        <el-menu-item index="/admin/pages">📄 页面管理</el-menu-item>
        <el-menu-item index="/admin/passphrase">🔑 口令管理</el-menu-item>
        <el-menu-item index="/admin/notices">📢 系统通知</el-menu-item>
        <el-divider style="margin:8px 0" />
        <el-menu-item index="/admin/super">⚡ 超级管理员</el-menu-item>
        <el-menu-item index="/home">🏠 返回首页</el-menu-item>
      </el-menu>
    </div>
    <div class="admin-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const activeMenu = computed(() => route.path)
</script>
