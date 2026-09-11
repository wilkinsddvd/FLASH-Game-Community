<template>
  <div class="feedback-page">
    <h2 class="page-title">💛 反馈</h2>
    <p class="text-muted">感谢你使用本网站！如果觉得还不错，就给我们点个赞吧～</p>

    <div class="card feedback-card">
      <div class="feedback-head">
        <div class="fb-emoji">💛</div>
        <div class="fb-msg">
          <div class="card-title" style="margin-bottom:6px">为 SquadFlash 点个赞</div>
          <p class="text-muted">你的每一次点赞，都是我们持续更新的动力。</p>
        </div>
      </div>
      <LikeSection />
    </div>
  </div>
</template>

<script setup>
import LikeSection from '../components/LikeSection.vue'
</script>

<style scoped>
.feedback-page { max-width: 760px; margin: 0 auto; }
.feedback-card { position: relative; overflow: visible; }
.feedback-head { display: flex; align-items: center; gap: 14px; }
.fb-emoji { font-size: 34px; }
.fb-msg { flex: 1; min-width: 220px; }
</style>
