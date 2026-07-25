<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 class="page-title" style="margin:0">论坛</h2>
      <el-button type="primary" @click="$router.push('/forum/create')" v-if="loggedIn">发帖</el-button>
    </div>

    <div class="card" v-for="s in sections" :key="s.id" @click="$router.push('/forum/section/' + s.id)" style="cursor:pointer">
      <div class="card-title">{{ s.name }}</div>
      <div class="text-muted">{{ s.description || '暂无描述' }}</div>
    </div>
    <el-empty v-if="!sections.length" description="暂无板块" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest, isLoggedIn } from '../api'

const sections = ref([])
const loggedIn = isLoggedIn()

onMounted(async () => {
  try { sections.value = await apiRequest('/sections') }
  catch (e) { console.error(e) }
})
</script>
