<template>
  <div class="like-section">
    <div class="like-zone">
      <button class="like-btn" :class="{ 'is-liked': burst }" :disabled="burst" @click="handleLike">
        <span class="like-icon">👍</span>
      </button>
      <span class="like-hint">
        已获得 <b class="like-num">{{ likeCount }}</b> 次点赞
        <span v-if="liked" class="like-done">· 已赞 💛</span>
      </span>
      <span v-for="(p, i) in particles" :key="i" class="like-particle" :style="p.style">{{ p.icon }}</span>
    </div>

    <transition name="fb-toast">
      <div v-if="thanksVisible" class="fb-toast">感谢你的喜欢与支持</div>
    </transition>

    <div class="feedback-sub">
      遇到问题了，点击<el-link type="primary" @click="$router.push(linkTo)">反馈</el-link>，让我们做的更好
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getLikes, addLike } from '../api'

const props = defineProps({
  // 小字中点「反馈」要跳转的地址（默认提交反馈页）
  linkTo: { type: String, default: '/feedback/submit' },
})

// ── 点赞特效 ──
const burst = ref(false)
const particles = ref([])
const thanksVisible = ref(false)
let burstTimer = null
let thanksTimer = null

// ── 点赞计数 ──
const LIKE_KEY = 'flash_liked'
const likeCount = ref(0)
const liked = ref(false)

async function loadLikes() {
  try {
    const res = await getLikes()
    likeCount.value = res?.count || 0
  } catch (e) {
    console.error('点赞数加载失败:', e)
  }
}

async function handleLike() {
  if (burst.value) return
  burst.value = true
  const icons = ['✨', '💛', '⭐', '❤️', '🌟']
  particles.value = Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2
    const dist = 46 + Math.random() * 40
    return {
      icon: icons[Math.floor(Math.random() * icons.length)],
      style: {
        left: '50%',
        top: '50%',
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist}px`,
      },
    }
  })
  thanksVisible.value = true
  clearTimeout(burstTimer)
  clearTimeout(thanksTimer)
  burstTimer = setTimeout(() => {
    burst.value = false
    particles.value = []
  }, 900)
  thanksTimer = setTimeout(() => {
    thanksVisible.value = false
  }, 3000)

  // 同一浏览器只计一次，但仍保留动画反馈
  if (!liked.value) {
    liked.value = true
    try { localStorage.setItem(LIKE_KEY, '1') } catch { /* ignore */ }
    try {
      const res = await addLike()
      likeCount.value = res?.count ?? likeCount.value + 1
    } catch (e) {
      console.error('点赞失败:', e)
      likeCount.value += 1
    }
  }
}

onMounted(() => {
  liked.value = (() => { try { return localStorage.getItem(LIKE_KEY) === '1' } catch { return false } })()
  loadLikes()
})

onUnmounted(() => {
  clearTimeout(burstTimer)
  clearTimeout(thanksTimer)
})
</script>

<style scoped>
.like-section { position: relative; }
.like-zone {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 6px 0 4px 48px;
  min-height: 60px;
}
.like-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #ffd666, #ff9c1a);
  box-shadow: 0 4px 12px rgba(255, 156, 26, 0.35);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-btn:hover { transform: scale(1.08); box-shadow: 0 6px 18px rgba(255, 156, 26, 0.5); }
.like-btn:disabled { cursor: default; }
.like-btn.is-liked { animation: like-pop 0.5s ease; }
.like-icon { font-size: 28px; line-height: 1; }
@keyframes like-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.25) rotate(-8deg); }
  70% { transform: scale(0.95) rotate(4deg); }
  100% { transform: scale(1); }
}
.like-hint { font-size: 13px; color: var(--text-muted); }
.like-num { color: #ff9c1a; font-size: 15px; }
.like-done { color: #ff9c1a; }
.like-particle {
  position: absolute;
  pointer-events: none;
  font-size: 16px;
  animation: fly-away 0.85s ease-out forwards;
}
@keyframes fly-away {
  0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.15); opacity: 0; }
}
.fb-toast {
  position: absolute;
  top: -14px;
  right: 16px;
  background: linear-gradient(135deg, #ffd666, #ff9c1a);
  color: #7a4a00;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 14px rgba(255, 156, 26, 0.4);
  white-space: nowrap;
}
.fb-toast-enter-active, .fb-toast-leave-active { transition: opacity 0.35s, transform 0.35s; }
.fb-toast-enter-from, .fb-toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.9); }
.feedback-sub {
  margin: 10px 0 0 48px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
