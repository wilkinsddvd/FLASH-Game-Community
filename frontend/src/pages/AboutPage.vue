<template>
  <div class="card">
    <div v-if="page" v-html="renderedContent"></div>
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '../api'

const page = ref(null)
const renderedContent = computed(() => {
  if (!page.value) return ''
  return page.value.content.replace(/\n/g, '<br>')
})

onMounted(async () => {
  try { page.value = await apiRequest('/pages/about') }
  catch { page.value = { title: '关于 FLASH', content: 'FLASH 游戏社区 —— 玩家的一站式交流平台。' } }
})
</script>
