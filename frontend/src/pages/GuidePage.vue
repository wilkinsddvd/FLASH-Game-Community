<script setup>
import { onMounted, ref } from 'vue'
import ContentList from '../components/ContentList.vue'
import { apiRequest } from '../api'

const content = ref([])

onMounted(async () => {
  content.value = await apiRequest('/content/guide')
})
</script>

<template>
  <ContentList title="Game Guide" :items="content" />
</template>
