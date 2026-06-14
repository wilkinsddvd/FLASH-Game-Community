<script setup>
import { onMounted, ref } from 'vue'
import ContentList from '../components/ContentList.vue'
import { apiRequest } from '../api'

const content = ref([])

onMounted(async () => {
  content.value = await apiRequest('/content/display')
})
</script>

<template>
  <ContentList title="Game Display" :items="content" />
</template>
