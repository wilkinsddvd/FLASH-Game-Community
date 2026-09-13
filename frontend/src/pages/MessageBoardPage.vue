<template>
  <div class="board-page">
    <!-- 页面头 -->
    <div class="board-page-head">
      <h2 class="page-title">📝 留言板</h2>
      <p class="text-muted">欢迎大家留下想说的话 —— 入坑故事、游戏心得、社区建议都欢迎。留言经管理员筛选后展示在这里。</p>
    </div>
    <MessageBoard :show-header="false" />
  </div>
</template>

<script setup>
import MessageBoard from '../components/MessageBoard.vue'
</script>

<style scoped>
.board-page { max-width: 960px; margin: 0 auto; }
.board-page-head { margin-bottom: 18px; }
.board-page-head .page-title { margin-bottom: 6px; }
</style>
