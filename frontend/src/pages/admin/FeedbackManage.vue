<template>
  <div>
    <h3 class="page-title">📮 反馈管理</h3>
    <el-radio-group v-model="statusFilter" style="margin-bottom:12px" @change="load">
      <el-radio-button :value="undefined">全部</el-radio-button>
      <el-radio-button :value="0">待处理</el-radio-button>
      <el-radio-button :value="1">已处理</el-radio-button>
      <el-radio-button :value="2">已忽略</el-radio-button>
    </el-radio-group>

    <el-table :data="feedbacks" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="user_name" label="用户" width="120" />
      <el-table-column label="类型" width="130">
        <template #default="{row}">
          <el-tag :type="row.category === 'roster_error' ? 'danger' : 'primary'" size="small">
            {{ row.category === 'roster_error' ? '编制错误' : '改进建议' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="120" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <el-tag :type="row.status === 0 ? 'warning' : (row.status === 1 ? 'success' : 'info')" size="small">
            {{ row.status === 0 ? '待处理' : (row.status === 1 ? '已处理' : '已忽略') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="提交时间" width="170" />
      <el-table-column label="操作" width="120">
        <template #default="{row}">
          <el-button size="small" type="primary" @click="openReply(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" title="处理反馈" width="520px">
      <div style="margin-bottom:12px">
        <el-tag :type="dialog.row.category === 'roster_error' ? 'danger' : 'primary'" size="small">
          {{ dialog.row.category === 'roster_error' ? '编制错误' : '改进建议' }}
        </el-tag>
        <span style="margin-left:8px;color:var(--text-muted)">用户：{{ dialog.row.user_name }} · {{ dialog.row.created_at }}</span>
      </div>
      <div style="padding:10px;background:var(--bg-elevated);border-radius:8px;margin-bottom:12px;white-space:pre-wrap">
        {{ dialog.row.content }}
      </div>
      <el-form label-width="80px">
        <el-form-item label="回复">
          <el-input v-model="dialog.reply" type="textarea" :rows="3" maxlength="1000" placeholder="回复内容（选填）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.status">
            <el-radio :value="0">待处理</el-radio>
            <el-radio :value="1">已处理</el-radio>
            <el-radio :value="2">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest } from '../../api'

const feedbacks = ref([])
const statusFilter = ref(undefined)
const dialog = ref({ visible: false, row: {}, reply: '', status: 0 })

async function load() {
  const params = statusFilter.value !== undefined ? `?status_filter=${statusFilter.value}` : ''
  feedbacks.value = await apiRequest(`/admin/feedback${params}`)
}

onMounted(load)

function openReply(row) {
  dialog.value = { visible: true, row, reply: row.admin_reply || '', status: row.status }
}

async function save() {
  await apiRequest(`/admin/feedback/${dialog.value.row.id}`, {
    method: 'PUT',
    body: JSON.stringify({ admin_reply: dialog.value.reply, status: dialog.value.status }),
  })
  ElMessage.success('已保存')
  dialog.value.visible = false
  load()
}
</script>
