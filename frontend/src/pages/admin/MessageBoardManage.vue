<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 class="page-title">📝 留言板管理</h3>
      <el-button size="small" @click="load">刷新</el-button>
    </div>

    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
      首页留言板仅展示「选择展示」的留言。可对展示内容进行修改，并可选择「匿名」隐藏留言人信息。
    </el-alert>

    <el-table :data="items" v-loading="loading" stripe empty-text="暂无留言">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="留言人" width="150">
        <template #default="{row}">
          <div>{{ row.nickname || row.user_name }}</div>
          <div class="mb-sub">{{ row.user_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="原始留言" min-width="200">
        <template #default="{row}">
          <div class="mb-origin">{{ row.original_content || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="展示内容（可编辑）" min-width="240">
        <template #default="{row}">
          <div class="mb-display" :class="{ modified: row.content !== row.original_content }">{{ row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column label="展示" width="90" align="center">
        <template #default="{row}">
          <el-switch
            :model-value="row.is_displayed === 1"
            @change="(val) => toggleDisplay(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="匿名" width="90" align="center">
        <template #default="{row}">
          <el-switch
            :model-value="row.is_anonymous === 1"
            :disabled="row.is_displayed !== 1"
            @change="(val) => toggleAnonymous(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="提交时间" width="170">
        <template #default="{row}">{{ (row.created_at || '').slice(0, 19).replace('T', ' ') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{row}">
          <el-button size="small" type="primary" link @click="openEdit(row)">编辑内容</el-button>
          <el-popconfirm title="确认删除该留言？" @confirm="del(row)">
            <template #reference>
              <el-button size="small" type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" title="修改展示内容" width="520px">
      <div class="mb-dialog-row">
        <span class="mb-label">留言人：</span>{{ dialog.row.nickname || dialog.row.user_name }}
      </div>
      <div class="mb-dialog-row">
        <span class="mb-label">原始留言：</span>
        <div class="mb-origin-box">{{ dialog.row.original_content || '—' }}</div>
      </div>
      <el-form label-width="80px" style="margin-top:12px">
        <el-form-item label="展示内容">
          <el-input v-model="dialog.content" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="选项">
          <el-checkbox v-model="dialog.isDisplayed">在留言板展示</el-checkbox>
          <el-checkbox v-model="dialog.isAnonymous" :disabled="!dialog.isDisplayed">匿名展示</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminListMessageBoard, adminUpdateMessageBoard, adminDeleteMessageBoard } from '../../api'

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref({ visible: false, row: {}, content: '', isDisplayed: false, isAnonymous: false })

async function load() {
  loading.value = true
  try {
    items.value = await adminListMessageBoard()
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function toggleDisplay(row, val) {
  try {
    const res = await adminUpdateMessageBoard(row.id, { is_displayed: val ? 1 : 0 })
    Object.assign(row, res)
    ElMessage.success(val ? '已展示在留言板' : '已取消展示')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
    await load()
  }
}

async function toggleAnonymous(row, val) {
  try {
    const res = await adminUpdateMessageBoard(row.id, { is_anonymous: val ? 1 : 0 })
    Object.assign(row, res)
    ElMessage.success(val ? '已设为匿名展示' : '已显示留言人信息')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
    await load()
  }
}

function openEdit(row) {
  dialog.value = {
    visible: true,
    row,
    content: row.content,
    isDisplayed: row.is_displayed === 1,
    isAnonymous: row.is_anonymous === 1,
  }
}

async function save() {
  if (!dialog.value.content.trim()) {
    ElMessage.warning('展示内容不能为空')
    return
  }
  saving.value = true
  try {
    const res = await adminUpdateMessageBoard(dialog.value.row.id, {
      content: dialog.value.content,
      is_displayed: dialog.value.isDisplayed ? 1 : 0,
      is_anonymous: dialog.value.isAnonymous ? 1 : 0,
    })
    Object.assign(dialog.value.row, res)
    ElMessage.success('已保存')
    dialog.value.visible = false
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function del(row) {
  try {
    await adminDeleteMessageBoard(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.mb-sub { font-size: 12px; color: var(--text-muted); }
.mb-origin { font-size: 13px; color: var(--text-muted); white-space: pre-wrap; }
.mb-display { font-size: 13px; color: var(--text-primary); white-space: pre-wrap; }
.mb-display.modified { color: #e6a23c; }
.mb-dialog-row { font-size: 13px; margin-bottom: 8px; }
.mb-label { color: var(--text-muted); }
.mb-origin-box {
  display: inline-block;
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--bg-elevated);
  white-space: pre-wrap;
  width: 100%;
}
</style>
