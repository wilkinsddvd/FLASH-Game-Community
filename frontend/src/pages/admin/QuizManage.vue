<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 class="page-title">📚 基础认证管理</h3>
      <div>
        <el-button type="primary" @click="openDoc()">新建文档</el-button>
        <el-button type="success" @click="openQuestion()">新建题目</el-button>
      </div>
    </div>

    <!-- 统计 -->
    <el-row :gutter="12" style="margin-bottom:16px">
      <el-col :span="8"><el-card shadow="never"><div class="stat-label">总答题人次</div><div class="stat-num">{{ stats.total_attempts || 0 }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="stat-label">达标人次</div><div class="stat-num" style="color:#67c23a">{{ stats.passed_attempts || 0 }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="stat-label">平均分</div><div class="stat-num" style="color:#409eff">{{ stats.avg_score || 0 }}</div></el-card></el-col>
    </el-row>

    <!-- QA 文档 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header><b>📖 QA 学习文档</b></template>
      <el-table :data="docs" stripe size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '显示' : '隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <el-button size="small" @click="openDoc(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="delDoc(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 题目 -->
    <el-card shadow="never">
      <template #header><b>✏️ 题目管理（共 {{ questions.length }} 题）</b></template>
      <el-table :data="questions" stripe size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="question" label="题干" show-overflow-tooltip />
        <el-table-column label="答案" width="80">
          <template #default="{row}">{{ row.correct_answer }}</template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="70" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{row}">
            <el-button size="small" @click="openQuestion(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="delQuestion(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 文档弹窗 -->
    <el-dialog v-model="docDialog.visible" :title="docDialog.isEdit ? '编辑文档' : '新建文档'" width="600px">
      <el-form :model="docDialog.form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="docDialog.form.title" /></el-form-item>
        <el-form-item label="内容">
          <el-input v-model="docDialog.form.content" type="textarea" :rows="8" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".md,.txt"
            :on-change="onDocFileChange"
          >
            <el-button size="small">选择 .md / .txt 文件</el-button>
            <template #tip><div class="el-upload__tip">选择文件后自动填充到内容框（覆盖）</div></template>
          </el-upload>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="docDialog.form.sort_order" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="docDialog.form.status" :active-value="1" :inactive-value="0" active-text="显示" inactive-text="隐藏" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="docDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveDoc">保存</el-button>
      </template>
    </el-dialog>

    <!-- 题目弹窗 -->
    <el-dialog v-model="qDialog.visible" :title="qDialog.isEdit ? '编辑题目' : '新建题目'" width="600px">
      <el-form :model="qDialog.form" label-width="100px">
        <el-form-item label="题干"><el-input v-model="qDialog.form.question" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="选项A"><el-input v-model="qDialog.form.option_a" /></el-form-item>
        <el-form-item label="选项B"><el-input v-model="qDialog.form.option_b" /></el-form-item>
        <el-form-item label="选项C"><el-input v-model="qDialog.form.option_c" placeholder="可选" /></el-form-item>
        <el-form-item label="选项D"><el-input v-model="qDialog.form.option_d" placeholder="可选" /></el-form-item>
        <el-form-item label="正确答案">
          <el-select v-model="qDialog.form.correct_answer" style="width:120px">
            <el-option v-for="k in ['A','B','C','D']" :key="k" :value="k" :label="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="分值"><el-input-number v-model="qDialog.form.score" :min="1" :max="100" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="qDialog.form.sort_order" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="qDialog.form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiRequest } from '../../api'

const docs = ref([])
const questions = ref([])
const stats = ref({})

const docDialog = ref({ visible: false, isEdit: false, form: {} })
const qDialog = ref({ visible: false, isEdit: false, form: {} })

async function loadAll() {
  const [d, q, s] = await Promise.all([
    apiRequest('/admin/quiz/docs'),
    apiRequest('/admin/quiz/questions'),
    apiRequest('/admin/quiz/stats'),
  ])
  docs.value = d
  questions.value = q
  stats.value = s
}

onMounted(loadAll)

// ── 文档 ──
function openDoc(doc) {
  docDialog.value = doc
    ? { visible: true, isEdit: true, form: { ...doc } }
    : { visible: true, isEdit: false, form: { title: '', content: '', sort_order: 0, status: 1 } }
}

async function onDocFileChange(file) {
  const fd = new FormData()
  fd.append('file', file.raw)
  const res = await apiRequest('/admin/quiz/docs/upload', {
    method: 'POST',
    headers: { 'Content-Type': undefined },
    body: fd,
  })
  docDialog.value.form.content = res.content
  if (!docDialog.value.form.title) docDialog.value.form.title = res.filename.replace(/\.(md|txt)$/i, '')
}

async function saveDoc() {
  const f = docDialog.value.form
  if (!f.title || !f.content) return ElMessage.warning('标题和内容必填')
  if (docDialog.value.isEdit) {
    await apiRequest(`/admin/quiz/docs/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
  } else {
    await apiRequest('/admin/quiz/docs', { method: 'POST', body: JSON.stringify(f) })
  }
  ElMessage.success('保存成功')
  docDialog.value.visible = false
  loadAll()
}

async function delDoc(doc) {
  await ElMessageBox.confirm('确认删除该文档？')
  await apiRequest(`/admin/quiz/docs/${doc.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  loadAll()
}

// ── 题目 ──
function openQuestion(q) {
  qDialog.value = q
    ? { visible: true, isEdit: true, form: { ...q } }
    : { visible: true, isEdit: false, form: { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', score: 5, sort_order: 0, status: 1 } }
}

async function saveQuestion() {
  const f = qDialog.value.form
  if (!f.question || !f.option_a || !f.option_b) return ElMessage.warning('题干和 A/B 选项必填')
  if (qDialog.value.isEdit) {
    await apiRequest(`/admin/quiz/questions/${f.id}`, { method: 'PUT', body: JSON.stringify(f) })
  } else {
    await apiRequest('/admin/quiz/questions', { method: 'POST', body: JSON.stringify(f) })
  }
  ElMessage.success('保存成功')
  qDialog.value.visible = false
  loadAll()
}

async function delQuestion(q) {
  await ElMessageBox.confirm('确认删除该题目？')
  await apiRequest(`/admin/quiz/questions/${q.id}`, { method: 'DELETE' })
  ElMessage.success('已删除')
  loadAll()
}
</script>

<style scoped>
.stat-label { font-size: 12px; color: var(--text-muted); }
.stat-num { font-size: 26px; font-weight: 700; margin-top: 4px; }
</style>
