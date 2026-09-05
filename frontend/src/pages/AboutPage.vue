<template>
  <div class="about-page">
    <!-- 初心 -->
    <div class="card about-card">
      <div class="about-icon">🌟</div>
      <h2 class="about-title">初心</h2>
      <p class="about-text">
        FLASH 开源项目始于2026年伊始，我们希望为每一位战术小队玩家提供一个熟悉游戏的方式，
        为每一位想玩战术小队的朋友们提供一个可以直观看到战术小队的地方。目前我们做了查询编制资料，
        各类兵种的入门须知。无论你是刚入伍的新兵，还是身经百战的老兵，这里都有一席之地。
      </p>
    </div>

    <!-- 闪电的战术大队 -->
    <div class="card about-card">
      <div class="about-icon">⚡</div>
      <h2 class="about-title">闪电的战术大队</h2>
      <p class="about-text">
        「闪电的战术大队」是FLASH 的核心。因为战术小队听起来太过于小众，所以我们选择了战术大队。
        我们希望可以帮助更多的人来入门战术小队这个游戏，而且我们都知道战术小队的优化，对于国内玩家
        十分甚至九分的不友好，我们愿意为各位新入坑的玩家解决各种疑难杂症，而这也正是每个入门战术小队的
        玩家的必经之路。打败你的通常不是强如天神的敌方载具步兵，而可能是时不时崩虚幻，小蓝熊时常抽风
        造成的游戏闪退，配置过低导致的帧率感人。在这里你都能找到答案，我们为3060做了完整的设置方案，
        为各种问题做了详细的排查步骤，并且对萌新宝宝秉承最淳朴的善意，欢迎志同道合的玩家加入，
        让我们一起，越来越好。
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
