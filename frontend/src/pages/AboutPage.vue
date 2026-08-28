<template>
  <div class="about-page">
    <!-- 初心 -->
    <div class="card about-card">
      <div class="about-icon">🌟</div>
      <h2 class="about-title">初心</h2>
      <p class="about-text">
        FLASH 游戏社区始于一群《战术小队》玩家的共同热爱。我们希望为每一位玩家提供一个
        纯净、专业、友好的交流空间——分享战术心得、查询编制资料、结识并肩作战的队友。
        无论你是刚入伍的新兵，还是身经百战的老兵，这里都有一席之地。
      </p>
    </div>

    <!-- 闪电的战术大队 -->
    <div class="card about-card">
      <div class="about-icon">⚡</div>
      <h2 class="about-title">闪电的战术大队</h2>
      <p class="about-text">
        「闪电的战术大队」是 FLASH 社区的核心战队。我们以高效的协同、严谨的战术和默契的配合著称，
        常年活跃于《战术小队》各大战场。大队定期组织训练赛、联合作战与新兵带教，
        欢迎志同道合的玩家加入，一起感受团队作战的魅力。
      </p>
    </div>

    <!-- 技术支持 -->
    <div class="card about-card">
      <div class="about-icon">🛠️</div>
      <h2 class="about-title">技术支持</h2>
      <div class="support-box">
        <div class="support-avatar">
          <el-avatar :size="64" src="" class="support-avatar-img">技</el-avatar>
        </div>
        <div class="support-info">
          <div class="support-name">FLASH 技术组</div>
          <p class="about-text muted">网站维护 · 功能开发 · 问题修复</p>
          <el-button
            type="primary"
            round
            class="charge-btn"
            @click="goCharge"
          >⚡ 充电支持</el-button>
        </div>
      </div>
      <p class="about-text tip-text">
        你的支持是我们持续更新与维护社区的动力！点击「充电支持」即可为 FLASH 打赏。
      </p>
    </div>
  </div>
</template>

<script setup>
function goCharge() {
  window.open('https://b23.tv/3dhCIEA', '_blank', 'noopener')
}
</script>

<style scoped>
.about-page {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.about-card {
  padding: 24px 28px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}
.about-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.about-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.about-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
}
.about-text.muted {
  color: var(--text-muted);
  margin-bottom: 12px;
}
.support-box {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 0 8px;
}
.support-avatar-img {
  background: linear-gradient(135deg, #667eea, #764ba2);
  font-size: 26px;
  font-weight: 700;
}
.support-info {
  flex: 1;
  min-width: 220px;
}
.support-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.charge-btn {
  margin-top: 4px;
}
.tip-text {
  font-size: 13px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-light);
}
</style>
