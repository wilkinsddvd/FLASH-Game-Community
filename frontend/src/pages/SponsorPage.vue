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

    <!-- 赞助档位选择 -->
    <div class="card">
      <div class="card-title">💳 选择赞助档位</div>
      <div class="tier-grid">
        <button
          v-for="t in tiers"
          :key="t.amount"
          class="tier-item"
          :class="{ active: selected === t.amount }"
          @click="selectTier(t.amount)"
        >
          <span class="tier-amount">¥{{ t.amount }}</span>
          <span class="tier-name">{{ t.name }}</span>
        </button>
      </div>

      <!-- 收款码展示区 -->
      <div v-if="selected" ref="qrSection" class="qr-section">
        <div class="qr-title">
          <b>微信扫码支付 ¥{{ selected }}</b>
          <span class="text-muted">请使用微信扫描下方收款码完成赞助</span>
        </div>
        <img :src="qrSrc" :alt="'微信收款码 ' + selected + ' 元'" class="qr-img" />
        <p class="qr-tip">💡 赞助时请备注你的 <b>FLASH 用户名</b>，我们将在 48 小时内为你发放赞助徽章。</p>

        <!-- 支付完成按钮 -->
        <button class="done-btn" @click="confirmPaid">✅ 支付已完成</button>
      </div>

      <!-- 感谢信息 -->
      <div v-if="thanked" class="thanks-box">
        <div class="thanks-icon">🎉</div>
        <div class="thanks-text">感谢您的赞助！</div>
        <p class="text-muted">你的支持是我们最大的动力，我们会继续努力运营好 FLASH 社区。</p>
        <button class="back-btn" @click="reset">返回重新选择</button>
      </div>
    </div>

    <div class="sponsor-footer-note">
      <p>📌 赞助为自愿行为，无强制要求。</p>
      <p>如有疑问，可通过站内信联系管理员。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

// 赞助档位（6 档）
const tiers = [
  { amount: 10,  name: '轻量支持' },
  { amount: 20,  name: '小小心意' },
  { amount: 30,  name: '热心玩家' },
  { amount: 50,  name: '忠实伙伴' },
  { amount: 100, name: '资深赞助' },
  { amount: 200, name: '钻石赞助' },
]

const selected = ref(null)  // 当前选中的档位金额
const thanked = ref(false)  // 是否已感谢
const qrSection = ref(null)

// 对应档位的收款码图片
const qrSrc = computed(() =>
  selected.value ? `${import.meta.env.BASE_URL}sponsor-qr/qr-${selected.value}.jpg` : ''
)

function selectTier(amount) {
  selected.value = amount
  thanked.value = false
  // 跳转到收款码区域
  nextTick(() => {
    qrSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function confirmPaid() {
  thanked.value = true
}

function reset() {
  selected.value = null
  thanked.value = false
}
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

/* 档位选择 */
.tier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}
.tier-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all .2s;
}
.tier-item:hover {
  border-color: var(--color-primary, #409eff);
  transform: translateY(-2px);
}
.tier-item.active {
  border-color: var(--color-primary, #409eff);
  background: color-mix(in srgb, var(--color-primary, #409eff) 10%, var(--bg-elevated));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #409eff) 30%, transparent);
}
.tier-amount { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.tier-name { font-size: 12px; color: var(--text-muted); }

/* 收款码 */
.qr-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px dashed var(--border-light);
  border-radius: 8px;
  background: var(--bg-elevated);
  text-align: center;
  scroll-margin-top: 20px;
}
.qr-title { margin-bottom: 16px; }
.qr-title b { font-size: 18px; display: block; margin-bottom: 4px; }
.qr-img {
  width: 280px;
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
}
.qr-tip {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 支付完成按钮 */
.done-btn {
  margin-top: 16px;
  padding: 12px 40px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #07c160;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter .2s;
}
.done-btn:hover { filter: brightness(1.1); }

/* 感谢信息 */
.thanks-box {
  margin-top: 20px;
  padding: 40px 20px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-elevated);
  text-align: center;
}
.thanks-icon { font-size: 56px; }
.thanks-text {
  font-size: 24px;
  font-weight: 700;
  margin: 12px 0 8px;
  background: linear-gradient(90deg, #f6a821, #ff5722);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.thanks-box .text-muted { font-size: 13px; }
.back-btn {
  margin-top: 16px;
  padding: 8px 24px;
  font-size: 14px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  cursor: pointer;
}
.back-btn:hover { border-color: var(--color-primary, #409eff); color: var(--color-primary, #409eff); }

.sponsor-footer-note {
  margin-top: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.8;
}
</style>
