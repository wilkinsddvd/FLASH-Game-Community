<template>
  <div class="board-page">
    <!-- 页面头 -->
    <div class="board-page-head">
      <h2 class="page-title">📝 留言板</h2>
      <p class="text-muted">欢迎大家留下想说的话 —— 入坑故事、游戏心得、社区建议都欢迎。留言经管理员筛选后展示在这里。</p>
      <div class="board-page-chips">
        <span class="chip">💬 畅所欲言</span>
        <span class="chip">🛡️ 管理员筛选后展示</span>
        <span class="chip">🎮 战术小队玩家专属</span>
      </div>
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
.board-page-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
}
</style>
