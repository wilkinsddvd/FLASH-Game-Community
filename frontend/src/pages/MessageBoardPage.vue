<template>
  <div class="board-page">
    <h2 class="page-title">📝 留言板</h2>
    <p class="text-muted">欢迎大家留下想说的话，留言经管理员筛选后展示在这里。</p>
    <MessageBoard />
  </div>
</template>

<script setup>
import MessageBoard from '../components/MessageBoard.vue'
</script>

<style scoped>
.board-page { max-width: 900px; margin: 0 auto; }
</style>
