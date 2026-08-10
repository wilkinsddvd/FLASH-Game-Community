<template>
  <div>
    <h2 class="page-title">SQUAD闪电谈</h2>
    <div class="article-grid" v-if="items.length">
      <div class="article-card" v-for="a in items" :key="a.id">
        <div class="article-cover">⚙️</div>
        <div class="article-body">
          <h3>{{ a.title }}</h3>
          <p>{{ a.summary || '暂无摘要' }}</p>
          <div class="text-muted mt-16">{{ a.author_name }} · {{ a.created_at.slice(0, 10) }}</div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无内容" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'

const items = ref([])
onMounted(async () => {
  try { items.value = await apiRequest('/articles?category=developer') }
  catch (e) { console.error(e) }
})
</script>
