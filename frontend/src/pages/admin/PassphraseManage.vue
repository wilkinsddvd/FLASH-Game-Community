<template>
  <div>
    <h3 class="page-title">管理员口令管理</h3>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="规则说明"
      description="口令池可增加、可删除、不可修改内容；每个口令最多使用 5 次，用满后自动失效；初始口令由代码内置，不可删除。"
      style="margin-bottom:16px;"
    />

    <el-row :gutter="16">
      <!-- 口令池列表 -->
      <el-col :xs="24" :md="14">
        <el-card>
          <template #header>
            <span>口令池（共 {{ total }} 个）</span>
          </template>

          <el-table :data="items" v-loading="loading" empty-text="暂无口令">
            <el-table-column label="ID" prop="id" width="60" />
            <el-table-column label="使用次数" width="140">
              <template #default="{ row }">
                <el-tag :type="row.use_count >= row.max_uses ? 'danger' : 'success'" size="small">
                  {{ row.use_count }} / {{ row.max_uses }}
                </el-tag>
                <span v-if="row.use_count >= row.max_uses" style="margin-left:6px;color:#f56c6c;">已用完</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.is_builtin" type="warning" size="small">初始口令</el-tag>
                <el-tag v-else type="info" size="small">管理员新增</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="created_at" min-width="170" />
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-popconfirm
                  title="确认删除该口令？"
                  width="200"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button
                      type="danger"
                      size="small"
                      :disabled="row.is_builtin || items.length <= 1"
                    >
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 新增口令 -->
      <el-col :xs="24" :md="10">
        <el-card>
          <template #header><span>新增口令</span></template>
          <el-form label-width="90px" @submit.prevent="handleAdd">
            <el-form-item label="新口令">
              <el-input
                v-model="form.passphrase"
                type="password"
                placeholder="至少 6 位"
                show-password
                size="large"
              />
            </el-form-item>
            <el-form-item label="确认口令">
              <el-input
                v-model="form.confirmPassphrase"
                type="password"
                placeholder="再次输入新口令"
                show-password
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="adding" @click="handleAdd">
                新增口令
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listPassphrases, addPassphrase, deletePassphrase } from '../../api'

const loading = ref(false)
const adding = ref(false)
const items = ref([])
const total = ref(0)

const form = reactive({
  passphrase: '',
  confirmPassphrase: '',
})

async function loadList() {
  loading.value = true
  try {
    const res = await listPassphrases()
    items.value = res.items || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '获取口令列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadList)

async function handleAdd() {
  if (form.passphrase.length < 6) {
    ElMessage.warning('新口令至少 6 位')
    return
  }
  if (form.passphrase !== form.confirmPassphrase) {
    ElMessage.error('两次输入的口令不一致')
    return
  }
  adding.value = true
  try {
    await addPassphrase(form.passphrase, form.confirmPassphrase)
    ElMessage.success('口令新增成功')
    form.passphrase = ''
    form.confirmPassphrase = ''
    await loadList()
  } catch (e) {
    ElMessage.error(e.message || '新增失败')
  } finally {
    adding.value = false
  }
}

async function handleDelete(row) {
  try {
    await deletePassphrase(row.id)
    ElMessage.success('口令删除成功')
    await loadList()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>
