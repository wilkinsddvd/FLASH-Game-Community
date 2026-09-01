<template>
  <div>
    <h3 class="page-title">⚡ 超级管理员</h3>

    <!-- 非超管：激活表单 -->
    <el-card v-if="!isSuper" style="max-width:520px">
      <template #header><span>激活超级管理员身份</span></template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="成为超级管理员前，需要您已经是系统管理员；激活需输入超级管理员口令"
        style="margin-bottom:16px;"
      />
      <el-form label-width="0" @submit.prevent="handleActivate">
        <el-form-item>
          <el-input
            v-model="passphrase"
            type="password"
            placeholder="请输入超级管理员口令"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="activating" @click="handleActivate">
            激活超级管理员
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-else-if="loadingRole"
      type="info"
      :closable="false"
      title="正在加载身份信息..."
      style="max-width:520px"
    />

    <!-- 超管：功能面板 -->
    <template v-else>
      <el-tabs v-model="tab">
        <!-- 1. 管理员信息 -->
        <el-tab-pane label="👥 管理员信息" name="admins">
          <el-alert type="info" :closable="false" title="查看所有管理员（含超级管理员）的信息" style="margin-bottom:12px" />
          <el-table :data="admins" v-loading="loadingAdmins" stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="nickname" label="昵称" min-width="100">
              <template #default="{row}">{{ row.nickname || '-' }}</template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" min-width="160">
              <template #default="{row}">{{ row.email || '-' }}</template>
            </el-table-column>
            <el-table-column label="角色" width="110">
              <template #default="{row}">
                <el-tag :type="row.role === 'super_admin' ? 'danger' : 'warning'" size="small">
                  {{ row.role === 'super_admin' ? '超级管理员' : '管理员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{row}">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="注册方式" width="100">
              <template #default="{row}">
                {{ row.registration_method === 'email' ? '邮箱' : '用户名' }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" min-width="170" />
          </el-table>
        </el-tab-pane>

        <!-- 2. 超管口令管理 -->
        <el-tab-pane label="🔑 超管口令" name="passphrases">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="超级管理员口令仅超级管理员可查看/增加/修改/删除；初始口令不可删除，至少保留一个"
            style="margin-bottom:12px"
          />
          <el-row :gutter="16">
            <el-col :xs="24" :md="14">
              <el-card>
                <template #header><span>口令列表（共 {{ spTotal }} 个）</span></template>
                <el-table :data="spItems" v-loading="loadingSp" empty-text="暂无口令">
                  <el-table-column prop="id" label="ID" width="60" />
                  <el-table-column prop="remark" label="备注" min-width="100">
                    <template #default="{row}">{{ row.remark || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="类型" width="100">
                    <template #default="{row}">
                      <el-tag v-if="row.is_builtin" type="danger" size="small">初始口令</el-tag>
                      <el-tag v-else type="info" size="small">新增</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="160" align="center">
                    <template #default="{row}">
                      <el-button size="small" type="primary" link @click="openEditSp(row)">修改</el-button>
                      <el-popconfirm title="确认删除该口令？" @confirm="handleDeleteSp(row)">
                        <template #reference>
                          <el-button size="small" type="danger" link :disabled="row.is_builtin || spItems.length <= 1">
                            删除
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
            <el-col :xs="24" :md="10">
              <el-card>
                <template #header><span>{{ editingSp ? '修改口令' : '新增口令' }}</span></template>
                <el-form label-width="90px">
                  <el-form-item label="备注">
                    <el-input v-model="spForm.remark" placeholder="如：主口令/备用" maxlength="20" />
                  </el-form-item>
                  <el-form-item label="口令">
                    <el-input v-model="spForm.passphrase" type="password" placeholder="至少 6 位" show-password />
                  </el-form-item>
                  <el-form-item label="确认口令">
                    <el-input v-model="spForm.confirmPassphrase" type="password" placeholder="再次输入" show-password />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="savingSp" @click="handleSaveSp">
                      {{ editingSp ? '保存修改' : '新增口令' }}
                    </el-button>
                    <el-button v-if="editingSp" @click="cancelEditSp">取消</el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 3. SQUAD闪电谈文章管理 -->
        <el-tab-pane label="📝 SQUAD闪电谈文章" name="articles">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="文章管理已移至超级管理员后台，仅可管理「SQUAD闪电谈」栏下的文章"
            style="margin-bottom:12px"
          />
          <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
            <el-button type="primary" size="small" @click="openArticleForm()">新建文章</el-button>
          </div>
          <el-table :data="articles" v-loading="loadingArticles" stripe empty-text="暂无文章">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="author_name" label="作者" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{row}">
                <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                  {{ row.status === 'published' ? '已发布' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="170" />
            <el-table-column label="操作" width="140">
              <template #default="{row}">
                <el-button size="small" @click="openArticleForm(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteArticle(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 文章编辑对话框 -->
          <el-dialog v-model="articleDialog" :title="articleForm.id ? '编辑文章' : '新建文章'" width="640px">
            <el-form label-width="70px">
              <el-form-item label="标题" required>
                <el-input v-model="articleForm.title" maxlength="128" placeholder="文章标题" />
              </el-form-item>
              <el-form-item label="摘要">
                <el-input v-model="articleForm.summary" maxlength="255" placeholder="文章摘要（可选）" />
              </el-form-item>
              <el-form-item label="封面图">
                <el-input v-model="articleForm.cover_image" placeholder="封面图 URL（可选）" />
              </el-form-item>
              <el-form-item label="状态">
                <el-radio-group v-model="articleForm.status">
                  <el-radio value="published">发布</el-radio>
                  <el-radio value="draft">草稿</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="内容" required>
                <el-input v-model="articleForm.content" type="textarea" :rows="10" placeholder="文章内容（支持 Markdown）" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="articleDialog = false">取消</el-button>
              <el-button type="primary" :loading="savingArticle" @click="saveArticle">保存</el-button>
            </template>
          </el-dialog>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  activateSuperAdmin, listSuperAdmins,
  listSuperPassphrases, addSuperPassphrase, updateSuperPassphrase, deleteSuperPassphrase,
  apiRequest,
} from '../../api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const tab = ref('admins')
const isSuper = ref(false)
const loadingRole = ref(true)
const passphrase = ref('')
const activating = ref(false)

// 管理员列表
const admins = ref([])
const loadingAdmins = ref(false)

// 超管口令
const spItems = ref([])
const spTotal = ref(0)
const loadingSp = ref(false)
const savingSp = ref(false)
const editingSp = ref(null)
const spForm = ref({ remark: '', passphrase: '', confirmPassphrase: '' })

// 文章
const articles = ref([])
const loadingArticles = ref(false)
const articleDialog = ref(false)
const savingArticle = ref(false)
const articleForm = ref({ id: null, title: '', summary: '', cover_image: '', status: 'published', content: '' })

async function loadRole() {
  try {
    const u = await auth.fetchUser()
    isSuper.value = u?.role === 'super_admin'
  } finally {
    loadingRole.value = false
  }
}

async function handleActivate() {
  if (!passphrase.value) {
    ElMessage.warning('请输入超级管理员口令')
    return
  }
  activating.value = true
  try {
    await activateSuperAdmin(passphrase.value)
    ElMessage.success('🎉 超级管理员激活成功')
    passphrase.value = ''
    await loadRole()
    loadAdmins()
    loadSp()
  } catch (e) {
    ElMessage.error(e.message || '激活失败')
  } finally {
    activating.value = false
  }
}

async function loadAdmins() {
  loadingAdmins.value = true
  try {
    const res = await listSuperAdmins()
    admins.value = res.items || []
  } catch (e) {
    ElMessage.error(e.message || '获取管理员列表失败')
  } finally {
    loadingAdmins.value = false
  }
}

async function loadSp() {
  loadingSp.value = true
  try {
    const res = await listSuperPassphrases()
    spItems.value = res.items || []
    spTotal.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '获取口令列表失败')
  } finally {
    loadingSp.value = false
  }
}

function openEditSp(row) {
  editingSp.value = row
  spForm.value = { remark: row.remark || '', passphrase: '', confirmPassphrase: '' }
}

function cancelEditSp() {
  editingSp.value = null
  spForm.value = { remark: '', passphrase: '', confirmPassphrase: '' }
}

async function handleSaveSp() {
  if (spForm.value.passphrase.length < 6) {
    ElMessage.warning('口令至少 6 位')
    return
  }
  if (spForm.value.passphrase !== spForm.value.confirmPassphrase) {
    ElMessage.error('两次输入的口令不一致')
    return
  }
  savingSp.value = true
  try {
    if (editingSp.value) {
      await updateSuperPassphrase(editingSp.value.id, spForm.value.passphrase, spForm.value.confirmPassphrase, spForm.value.remark)
      ElMessage.success('口令修改成功')
    } else {
      await addSuperPassphrase(spForm.value.passphrase, spForm.value.confirmPassphrase, spForm.value.remark)
      ElMessage.success('口令新增成功')
    }
    cancelEditSp()
    await loadSp()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    savingSp.value = false
  }
}

async function handleDeleteSp(row) {
  try {
    await deleteSuperPassphrase(row.id)
    ElMessage.success('口令删除成功')
    await loadSp()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function loadArticles() {
  loadingArticles.value = true
  try {
    articles.value = await apiRequest('/admin/articles')
  } catch (e) {
    ElMessage.error(e.message || '获取文章列表失败')
  } finally {
    loadingArticles.value = false
  }
}

function openArticleForm(row) {
  if (row) {
    articleForm.value = {
      id: row.id,
      title: row.title,
      summary: row.summary || '',
      cover_image: row.cover_image || '',
      status: row.status,
      content: '',
    }
    // 拉取详情填充内容
    apiRequest(`/admin/articles/${row.id}`).then(d => {
      articleForm.value.content = d.content || ''
      articleForm.value.summary = d.summary || ''
      articleForm.value.cover_image = d.cover_image || ''
    }).catch(e => ElMessage.error(e.message || '加载文章详情失败'))
  } else {
    articleForm.value = { id: null, title: '', summary: '', cover_image: '', status: 'published', content: '' }
  }
  articleDialog.value = true
}

async function saveArticle() {
  if (!articleForm.value.title.trim() || !articleForm.value.content.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }
  savingArticle.value = true
  try {
    if (articleForm.value.id) {
      await apiRequest(`/admin/articles/${articleForm.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: articleForm.value.title,
          summary: articleForm.value.summary,
          cover_image: articleForm.value.cover_image,
          status: articleForm.value.status,
          content: articleForm.value.content,
        }),
      })
      ElMessage.success('文章已更新')
    } else {
      await apiRequest('/admin/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: articleForm.value.title,
          summary: articleForm.value.summary,
          cover_image: articleForm.value.cover_image,
          status: articleForm.value.status,
          content: articleForm.value.content,
        }),
      })
      ElMessage.success('文章已创建')
    }
    articleDialog.value = false
    await loadArticles()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    savingArticle.value = false
  }
}

async function deleteArticle(row) {
  await ElMessageBox.confirm(`确认删除文章「${row.title}」？`, '删除确认', { type: 'warning' })
  try {
    await apiRequest(`/admin/articles/${row.id}`, { method: 'DELETE' })
    ElMessage.success('已删除')
    await loadArticles()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(async () => {
  await loadRole()
  if (isSuper.value) {
    loadAdmins()
    loadSp()
    loadArticles()
  }
})
</script>
