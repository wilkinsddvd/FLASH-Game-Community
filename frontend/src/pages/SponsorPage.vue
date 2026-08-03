<template>
  <div class="sponsor-page">
    <!-- 页头 -->
    <div class="sponsor-hero card">
      <div class="sponsor-hero-inner">
        <div class="sponsor-logo">💖</div>
        <div>
          <h1 class="page-title" style="margin-bottom:6px">赞助支持</h1>
          <p class="text-muted">你的每一份支持，都是 FLASH 社区持续前行的动力</p>
        </div>
      </div>
    </div>

    <!-- 赞助说明 -->
    <div class="card">
      <div class="card-title">🎯 为什么要赞助</div>
      <div class="reason-grid">
        <div class="reason-item">
          <div class="reason-icon">📝</div>
          <div class="reason-body">
            <b>内容持续更新</b>
            <p>维持攻略、Squad 编制数据、开发者工具的持续维护与校对。</p>
          </div>
        </div>
        <div class="reason-item">
          <div class="reason-icon">🖥️</div>
          <div class="reason-body">
            <b>服务器与带宽</b>
            <p>支付网站服务器、图片 CDN 与数据库等基础设施成本。</p>
          </div>
        </div>
        <div class="reason-item">
          <div class="reason-icon">🚀</div>
          <div class="reason-body">
            <b>功能迭代</b>
            <p>激励我们开发更多实用功能，优化社区使用体验。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 赞助方式 -->
    <div class="card">
      <div class="card-title">💳 赞助方式</div>
      <div class="pay-grid">
        <div class="pay-item" v-for="p in payMethods" :key="p.name">
          <div class="pay-qr skeleton" v-if="!p.qr">
            <span>{{ p.icon }}</span>
          </div>
          <img v-else :src="p.qr" :alt="p.name" class="pay-qr-img" />
          <div class="pay-name">{{ p.icon }} {{ p.name }}</div>
          <div class="text-muted">{{ p.desc }}</div>
        </div>
      </div>
      <div class="pay-tip">
        <p>💡 赞助时请备注你的 <b>FLASH 用户名</b>，我们将在 48 小时内为你发放赞助徽章。</p>
      </div>
    </div>

    <div class="sponsor-footer-note">
      <p>📌 赞助为自愿行为，无强制要求。</p>
      <p>如有疑问，可通过站内信联系管理员。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 赞助方式（qr 为空时展示占位图，可后续替换为真实收款码）
const payMethods = ref([
  { name: '微信支付', icon: '💚', desc: '扫码转账，备注用户名', qr: '' },
  { name: '支付宝', icon: '💙', desc: '扫码转账，备注用户名', qr: '' },
  { name: '爱发电', icon: '⚡', desc: 'afdian.com 平台赞助', qr: '' },
])
</script>

<style scoped>
.sponsor-page { max-width: 1200px; margin: 0 auto; padding: 0 0 40px; }

.sponsor-hero { background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated)); }
.sponsor-hero-inner { display: flex; align-items: center; gap: 20px; }
.sponsor-logo { font-size: 48px; }

.reason-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.reason-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-elevated);
}
.reason-icon { font-size: 26px; flex-shrink: 0; }
.reason-body b { font-size: 15px; }
.reason-body p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-top: 4px; }

.pay-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}
.pay-item {
  text-align: center;
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-elevated);
}
.pay-qr {
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--text-muted);
}
.pay-qr-img {
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}
.pay-name { font-weight: 600; margin-bottom: 4px; }
.pay-item .text-muted { font-size: 12px; }
.pay-tip {
  background: var(--bg-elevated);
  border: 1px dashed var(--border-light);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.sponsor-footer-note {
  margin-top: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.8;
}
</style>
