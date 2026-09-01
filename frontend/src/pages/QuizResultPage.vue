<template>
  <div class="quiz-result-page">
    <h2 class="page-title">📋 答题情况</h2>

    <el-skeleton v-if="loading" :rows="6" animated />

    <template v-else-if="detail">
      <!-- 结果概览 -->
      <div class="card">
        <div class="result-header">
          <div class="result-score" :class="detail.passed === 1 ? 'pass' : 'fail'">
            {{ detail.score }} / {{ detail.total }}
          </div>
          <div class="result-meta">
            <el-tag size="large" :type="detail.passed === 1 ? 'success' : 'danger'">
              {{ detail.passed === 1 ? '✅ 已达标' : '未达标（需 ≥90 分）' }}
            </el-tag>
            <div class="text-muted" style="margin-top:6px">
              {{ categoryName(detail.category) }} · {{ detail.created_at.slice(0, 19).replace('T', ' ') }}
            </div>
            <div v-if="detail.badge" class="badge-earned">
              <span class="badge-icon">{{ detail.badge.icon }}</span>
              <span>获得勋章「{{ detail.badge.name }}」</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 全部题目与答案 -->
      <div class="card">
        <div class="card-title">🧾 全部题目与对应答案（共 {{ detail.answers.length }} 题）</div>
        <div class="answer-item" v-for="(a, idx) in detail.answers" :key="a.question_id">
          <div class="answer-q">
            <span class="answer-mark" :class="a.is_correct ? 'right' : 'wrong'">
              {{ a.is_correct ? '✓' : '✗' }}
            </span>
            <span class="answer-q-text">{{ idx + 1 }}. {{ a.question }}</span>
            <span class="quiz-score">({{ a.score }}分)</span>
          </div>
          <div class="answer-opts">
            <div
              v-for="opt in optionsOf(a)"
              :key="opt.key"
              class="answer-opt"
              :class="{
                'is-user': opt.key === a.user_answer,
                'is-correct': opt.key === a.correct_answer,
                'is-wrong-user': opt.key === a.user_answer && a.user_answer !== a.correct_answer,
              }"
            >
              <span class="opt-key">{{ opt.key }}.</span>
              <span>{{ opt.text }}</span>
              <el-tag v-if="opt.key === a.correct_answer" type="success" size="small" style="margin-left:8px">正确答案</el-tag>
              <el-tag v-else-if="opt.key === a.user_answer && a.user_answer !== a.correct_answer" type="danger" size="small" style="margin-left:8px">我的答案</el-tag>
              <el-tag v-else-if="opt.key === a.user_answer" type="info" size="small" style="margin-left:8px">我的答案</el-tag>
            </div>
            <div v-if="!a.user_answer" class="text-muted" style="font-size:12px">⚠️ 未作答</div>
          </div>
        </div>
      </div>

      <div style="margin-top:16px; text-align:center">
        <el-button size="large" @click="$router.push('/cert')">返回基础认证</el-button>
      </div>
    </template>

    <el-result v-else-if="error" icon="error" :title="error">
      <template #extra>
        <el-button type="primary" @click="$router.push('/cert')">返回基础认证</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getQuizRecordDetail } from '../api'

const route = useRoute()
const loading = ref(true)
const detail = ref(null)
const error = ref('')

const CATEGORY_NAMES = {
  rifleman: '步枪兵基础认证', medic: '医疗兵基础认证', autorifleman: '班用机枪手基础认证',
  machinegunner: '通用机枪手基础认证', grenadier: '榴弹射手基础认证', marksman: '特种射手基础认证',
  lat: '轻型反坦克手基础认证', hat: '重型反坦克手基础认证', crewman: '载具组员基础认证',
  pilot: '飞行员基础认证', squadleader: '小队领导基础认证', commander: '指挥官基础认证',
}

function categoryName(code) {
  return CATEGORY_NAMES[code] || code
}

function optionsOf(a) {
  const opts = [
    { key: 'A', text: a.option_a },
    { key: 'B', text: a.option_b },
  ]
  if (a.option_c) opts.push({ key: 'C', text: a.option_c })
  if (a.option_d) opts.push({ key: 'D', text: a.option_d })
  return opts
}

onMounted(async () => {
  try {
    detail.value = await getQuizRecordDetail(route.params.id)
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.quiz-result-page {
  max-width: 860px;
  margin: 0 auto;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}
.result-score {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}
.result-score.pass { color: #67c23a; }
.result-score.fail { color: #f56c6c; }
.badge-earned {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, #e6a23c 12%, transparent);
  border: 1px solid #e6a23c;
  color: #b88230;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 13px;
}
.badge-icon { font-size: 16px; }
.answer-item {
  padding: 14px 0;
  border-bottom: 1px dashed var(--border-light);
}
.answer-item:last-child { border-bottom: none; }
.answer-q {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 8px;
}
.answer-mark {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
}
.answer-mark.right { background: #67c23a; }
.answer-mark.wrong { background: #f56c6c; }
.quiz-score { font-size: 12px; color: var(--text-muted); font-weight: 400; }
.answer-opts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 28px;
}
.answer-opt {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  font-size: 14px;
  display: flex;
  align-items: center;
}
.answer-opt.is-correct {
  border-color: #67c23a;
  background: color-mix(in srgb, #67c23a 10%, transparent);
}
.answer-opt.is-wrong-user {
  border-color: #f56c6c;
  background: color-mix(in srgb, #f56c6c 10%, transparent);
}
.opt-key { font-weight: 600; margin-right: 6px; }
</style>
