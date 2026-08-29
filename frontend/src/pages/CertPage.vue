<template>
  <div>
    <h2 class="page-title">📚 基础认证</h2>
    <p class="text-muted">选择认证方向，学习 QA 文档后参加答题，达到 90 分以上即可获得对应认证 🏅</p>

    <el-alert v-if="!isLogin" type="warning" :closable="false" style="margin-bottom:16px">
      答题需要登录，<el-link type="primary" @click="$router.push('/login')">去登录 →</el-link>
    </el-alert>

    <!-- 认证分类选择 -->
    <div class="card">
      <div class="card-title">🎯 选择认证</div>
      <div class="cert-grid">
        <div
          v-for="c in categories"
          :key="c.code"
          class="cert-item"
          :class="{ active: activeCategory === c.code }"
          @click="switchCategory(c.code)"
        >
          <div class="cert-name">{{ c.name }}</div>
          <div class="cert-desc">{{ c.description }}</div>
          <div class="cert-count">{{ c.question_count }} 题</div>
        </div>
      </div>
    </div>

    <!-- QA 文档 -->
    <div class="card" v-if="docs.length">
      <div class="card-title">📖 QA 学习文档</div>
      <el-collapse v-model="activeDoc">
        <el-collapse-item v-for="d in docs" :key="d.id" :name="d.id">
          <template #title>
            <span style="font-weight:600">{{ d.title }}</span>
            <span class="text-muted" style="margin-left:12px;font-size:12px">发布于 {{ d.created_at.slice(0,10) }}</span>
          </template>
          <div class="doc-content">{{ d.content }}</div>
          <a v-if="d.file_url" :href="d.file_url" target="_blank" rel="noopener" class="doc-file-link">📎 查看附件</a>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 当前认证标题 -->
    <div class="card" v-if="activeInfo">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>✏️ {{ activeInfo.name }}（共 {{ questions.length }} 题，满分 {{ totalScore }} 分）</span>
        <el-button size="small" type="primary" :loading="submitting" :disabled="!isLogin" @click="submit">
          提交答卷
        </el-button>
      </div>
      <div class="text-muted" style="font-size:13px;margin-bottom:8px">{{ activeInfo.description }} · 达标线 90 分</div>
    </div>

    <!-- 答题 -->
    <div class="card" v-if="questions.length">
      <div class="quiz-question" v-for="(q, idx) in questions" :key="q.id">
        <div class="quiz-q-title">{{ idx + 1 }}. {{ q.question }} <span class="quiz-score">({{ q.score }}分)</span></div>
        <el-radio-group v-model="answers[q.id]" class="quiz-options">
          <el-radio v-for="opt in optionsOf(q)" :key="opt.key" :value="opt.key" class="quiz-option">
            {{ opt.key }}. {{ opt.text }}
          </el-radio>
        </el-radio-group>
      </div>

      <div style="margin-top:16px;text-align:right">
        <el-button type="primary" :loading="submitting" :disabled="!isLogin" @click="submit">提交答卷</el-button>
      </div>
    </div>
    <el-empty v-else-if="loaded && activeInfo && activeInfo.question_count === 0" description="该认证暂无题目，请等待管理员上传" />

    <!-- 答题结果 -->
    <el-dialog v-model="resultVisible" title="答题结果" width="420px">
      <div v-if="result" style="text-align:center">
        <div class="result-score" :class="result.passed ? 'pass' : 'fail'">
          {{ result.score }} / {{ result.total }}
        </div>
        <div class="result-percent">正确 {{ result.correct_count }} / {{ result.question_count }} 题 · {{ Math.round(result.score / result.total * 100) }}%</div>
        <el-tag v-if="result.passed" type="success" size="large" style="margin-top:12px">✅ 达标！获得认证 🏅 {{ activeInfo?.name || '战术精英' }}</el-tag>
        <el-tag v-else type="danger" size="large" style="margin-top:12px">未达标（需 ≥90 分）</el-tag>
      </div>
      <template #footer>
        <el-button @click="resultVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 我的记录 -->
    <div class="card" v-if="records.length">
      <div class="card-title">📋 我的答题记录</div>
      <el-table :data="records" stripe size="small">
        <el-table-column label="认证" min-width="140">
          <template #default="{row}">
            {{ categoryName(row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="80" />
        <el-table-column prop="total" label="总分" width="80" />
        <el-table-column label="达标" width="90">
          <template #default="{row}">
            <el-tag :type="row.passed === 1 ? 'success' : 'info'" size="small">{{ row.passed === 1 ? '✅ 达标' : '未达标' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn } from '../api'

const isLogin = isLoggedIn()
const categories = ref([])
const activeCategory = ref('rifleman')
const docs = ref([])
const questions = ref([])
const answers = ref({})
const records = ref([])
const activeDoc = ref([])
const loaded = ref(false)
const submitting = ref(false)
const resultVisible = ref(false)
const result = ref(null)

const activeInfo = computed(() => categories.value.find(c => c.code === activeCategory.value) || null)
const totalScore = computed(() => questions.value.reduce((s, q) => s + q.score, 0))

function categoryName(code) {
  const c = categories.value.find(x => x.code === code)
  return c ? c.name : code
}

function optionsOf(q) {
  const opts = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
  ]
  if (q.option_c) opts.push({ key: 'C', text: q.option_c })
  if (q.option_d) opts.push({ key: 'D', text: q.option_d })
  return opts
}

async function switchCategory(code) {
  if (activeCategory.value === code && questions.value.length) return
  activeCategory.value = code
  answers.value = {}
  await loadQuestions()
}

async function loadQuestions() {
  try {
    questions.value = await apiRequest(`/quiz/questions?category=${activeCategory.value}`)
    questions.value.forEach(item => { answers.value[item.id] = undefined })
  } catch (e) {
    console.error('load questions error:', e)
    questions.value = []
  }
}

async function submit() {
  const unanswered = questions.value.filter(q => !answers.value[q.id])
  if (unanswered.length) {
    ElMessage.warning(`还有 ${unanswered.length} 题未作答`)
    return
  }
  submitting.value = true
  try {
    const res = await apiRequest('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ category: activeCategory.value, answers: answers.value }),
    })
    result.value = res
    resultVisible.value = true
    records.value = await apiRequest('/quiz/my-records')
    if (res.badge_earned) {
      ElMessage.success(`🎉 恭喜获得勋章「${res.badge_earned.name}」！`)
    }
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [d, cats] = await Promise.all([apiRequest('/quiz/docs'), apiRequest('/quiz/categories')])
    docs.value = d
    categories.value = cats
    // 默认选第一个有题目的认证
    const first = cats.find(c => c.question_count > 0)
    if (first) activeCategory.value = first.code
    await loadQuestions()
    if (isLogin) records.value = await apiRequest('/quiz/my-records')
  } catch (e) {
    console.error('Cert load error:', e)
  } finally {
    loaded.value = true
  }
})
</script>

<style scoped>
.cert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.cert-item {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all .2s;
  background: var(--bg-card);
}
.cert-item:hover { border-color: var(--primary, #409eff); }
.cert-item.active {
  border-color: var(--primary, #409eff);
  background: color-mix(in srgb, var(--primary, #409eff) 8%, var(--bg-card));
  box-shadow: 0 0 0 1px var(--primary, #409eff);
}
.cert-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: var(--text-primary); }
.cert-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; min-height: 36px; }
.cert-count { font-size: 12px; color: var(--primary, #409eff); margin-top: 6px; font-weight: 600; }
.doc-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
}
.doc-file-link { display: inline-block; margin-top: 8px; color: var(--primary, #409eff); }
.quiz-question {
  padding: 14px 0;
  border-bottom: 1px dashed var(--border-light);
}
.quiz-question:last-child { border-bottom: none; }
.quiz-q-title { font-weight: 600; margin-bottom: 8px; }
.quiz-score { font-size: 12px; color: var(--text-muted); font-weight: 400; }
.quiz-options { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.quiz-option { margin: 0; }
.result-score { font-size: 48px; font-weight: 800; }
.result-score.pass { color: #67c23a; }
.result-score.fail { color: #f56c6c; }
.result-percent { margin-top: 8px; color: var(--text-muted); }
</style>
