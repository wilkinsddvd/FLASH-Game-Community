<template>
  <div>
    <h2 class="page-title">📚 基础认证</h2>
    <p class="text-muted">学习战术 QA 文档后参加答题，达到 90 分以上可获得「战术精英」勋章 🏅</p>

    <el-alert v-if="!isLogin" type="warning" :closable="false" style="margin-bottom:16px">
      答题需要登录，<el-link type="primary" @click="$router.push('/login')">去登录 →</el-link>
    </el-alert>

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

    <!-- 答题 -->
    <div class="card" v-if="questions.length">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>✏️ 在线答题（共 {{ questions.length }} 题，满分 {{ totalScore }} 分）</span>
        <el-button size="small" type="primary" :loading="submitting" :disabled="!isLogin" @click="submit">
          提交答卷
        </el-button>
      </div>

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
    <el-empty v-else-if="loaded && !docs.length && !questions.length" description="暂无题目，请等待管理员上传" />

    <!-- 答题结果 -->
    <el-dialog v-model="resultVisible" title="答题结果" width="420px">
      <div v-if="result" style="text-align:center">
        <div class="result-score" :class="result.passed ? 'pass' : 'fail'">
          {{ result.score }} / {{ result.total }}
        </div>
        <div class="result-percent">正确 {{ result.correct_count }} / {{ result.question_count }} 题 · {{ Math.round(result.score / result.total * 100) }}%</div>
        <el-tag v-if="result.passed" type="success" size="large" style="margin-top:12px">✅ 达标！获得勋章 🏅 战术精英</el-tag>
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
const docs = ref([])
const questions = ref([])
const answers = ref({})
const records = ref([])
const activeDoc = ref([])
const loaded = ref(false)
const submitting = ref(false)
const resultVisible = ref(false)
const result = ref(null)

const totalScore = computed(() => questions.value.reduce((s, q) => s + q.score, 0))

function optionsOf(q) {
  const opts = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
  ]
  if (q.option_c) opts.push({ key: 'C', text: q.option_c })
  if (q.option_d) opts.push({ key: 'D', text: q.option_d })
  return opts
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
      body: JSON.stringify({ answers: answers.value }),
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
    const [d, q] = await Promise.all([apiRequest('/quiz/docs'), apiRequest('/quiz/questions')])
    docs.value = d
    questions.value = q
    q.forEach(item => { answers.value[item.id] = undefined })
    if (isLogin) records.value = await apiRequest('/quiz/my-records')
  } catch (e) {
    console.error('Cert load error:', e)
  } finally {
    loaded.value = true
  }
})
</script>

<style scoped>
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
