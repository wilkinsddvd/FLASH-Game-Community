<template>
  <div class="profile-settings">
    <h2 style="margin-bottom:24px;">⚙️ 个人设置</h2>

    <el-card class="settings-card">
      <template #header><span>头像与空间背景</span></template>
      <div class="avatar-row">
        <el-avatar :size="80" :src="avatarUrl" class="settings-avatar">
          {{ (profile?.nickname || 'U')[0] }}
        </el-avatar>
        <div class="avatar-upload-col">
          <el-upload
            :action="avatarUploadUrl"
            :headers="uploadHeaders"
            :on-success="onAvatarSuccess"
            :on-error="onCoverError"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png"
          >
            <el-button size="small">更换头像</el-button>
            <div class="el-upload__tip">JPG/PNG，最大 2MB</div>
          </el-upload>
          <el-tag v-if="profile?.pending_avatar" type="warning" size="small" style="margin-top:4px">
            头像审核中（{{ formatTime(profile.pending_avatar_at) }}提交）
          </el-tag>
          <el-upload
            action=""
            :http-request="uploadCover"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png"
            style="margin-top:8px"
          >
            <el-button size="small">更换空间背景</el-button>
            <div class="el-upload__tip">JPG/PNG，最大 5MB</div>
          </el-upload>
        </div>
      </div>
      <div v-if="profile?.space_cover" class="cover-preview">
        <img :src="coverPreviewUrl" alt="空间背景" @error="coverPreviewError" />
      </div>
    </el-card>

    <el-card class="settings-card">
      <template #header><span>基本信息</span></template>
      <el-form :model="form" label-width="100px" size="large">
        <el-form-item label="UID">
          <el-input :model-value="profile?.uid" disabled style="max-width:300px" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input :model-value="profile?.username" disabled style="max-width:300px" />
          <div class="form-hint">用户名不可修改（180 天限改 1 次，见下方）</div>
        </el-form-item>
        <el-form-item label="昵称" :error="nicknameError">
          <el-input v-model="form.nickname" maxlength="20" show-word-limit style="max-width:300px" />
          <div class="form-hint">
            90 天内限改 1 次
            <span v-if="profile?.nickname_can_change_at">
              （下次可修改：{{ formatDate(profile.nickname_can_change_at) }}）
            </span>
          </div>
          <el-tag v-if="profile?.pending_nickname" type="warning" size="small">
            昵称审核中：{{ profile.pending_nickname }}（{{ formatTime(profile.pending_nickname_at) }}提交）
          </el-tag>
        </el-form-item>
        <el-form-item label="个人签名">
          <el-input v-model="form.bio" maxlength="30" show-word-limit type="textarea" :rows="2" style="max-width:300px" />
          <el-tag v-if="profile?.pending_bio" type="warning" size="small">
            签名审核中：{{ profile.pending_bio }}（{{ formatTime(profile.pending_bio_at) }}提交）
          </el-tag>
        </el-form-item>
        <el-form-item label="性别" :error="genderError">
          <el-radio-group v-model="form.gender" :disabled="profile?.gender && profile.gender !== 0">
            <el-radio :value="0">保密</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
          <div class="form-hint" v-if="profile?.gender && profile.gender !== 0">性别选择后无法修改</div>
        </el-form-item>
        <el-form-item label="生日" :error="birthdayError">
          <el-date-picker v-model="form.birthday" type="date" placeholder="选择日期" style="max-width:300px" />
        </el-form-item>
        <el-form-item label="所在地">
          <el-cascader
            v-model="form.location"
            :options="regions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="选择省/市"
            clearable
            style="max-width:300px; width:100%"
          />
        </el-form-item>
        <el-form-item label="空间主题">
          <el-select v-model="form.space_theme" style="max-width:200px">
            <el-option label="默认" value="default" />
            <el-option label="暗黑" value="dark" />
            <el-option label="深蓝" value="blue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile" :loading="saving">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card" style="margin-top:16px;">
      <template #header><span>修改用户名</span></template>
      <el-alert
        title="用户名 180 天内限改 1 次，修改后需重新登录"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom:12px;"
      />
      <el-form label-width="100px" size="large">
        <el-form-item label="当前密码">
          <el-input v-model="usernameForm.password" type="password" show-password placeholder="验证身份" style="max-width:300px" />
        </el-form-item>
        <el-form-item label="新用户名">
          <el-input v-model="usernameForm.username" maxlength="20" placeholder="3~20位字母/数字/下划线" style="max-width:300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveUsername" :loading="savingUsername">修改用户名</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 等级信息 -->
    <el-card class="settings-card" style="margin-top:16px;">
      <template #header><span>等级信息</span></template>
      <div class="level-info" v-if="levelData">
        <div class="level-title-row">
          <span class="level-badge" :class="`lv${levelData.level}`">Lv{{ levelData.level }}</span>
          <span class="level-title-name">{{ levelData.title }}</span>
        </div>
        <el-progress
          :percentage="levelData.progress_percent"
          :text-inside="true"
          :stroke-width="20"
          :status="levelData.level >= 6 ? 'success' : undefined"
        />
        <div class="level-exp-text text-muted">
          {{ levelData.current_exp }} / {{ levelData.next_level_exp }} EXP
          <span v-if="levelData.level >= 6">（已满级）</span>
        </div>
      </div>
    </el-card>

    <!-- 成为管理员 -->
    <el-card class="settings-card" style="margin-top:16px;">
      <template #header><span>🛡️ 成为管理员</span></template>
      <template v-if="isAdmin">
        <el-alert
          type="success"
          :closable="false"
          show-icon
          :title="profile?.role === 'super_admin' ? '您已是超级管理员' : '您已是管理员，拥有管理后台权限'"
        />
        <el-button type="primary" style="margin-top:12px" @click="$router.push('/admin')">进入管理后台</el-button>
      </template>
      <el-form v-else label-width="100px" size="large">
        <el-alert
          title="输入管理员口令即可升级为管理员，并获得对应管理权限（口令错误 5 次将锁定 30 分钟）"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
        />
        <el-form-item label="管理员口令">
          <el-input
            v-model="adminForm.passphrase"
            type="password"
            show-password
            placeholder="请输入管理员口令"
            style="max-width:300px"
            @keyup.enter="saveAdmin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="savingAdmin" @click="saveAdmin">成为管理员</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn, API_BASE, becomeAdmin } from '../api'
import { useAuthStore } from '../stores/auth'
import { REGIONS } from '../data/regions'

const auth = useAuthStore()

const profile = ref(null)
const saving = ref(false)
const savingUsername = ref(false)
const nicknameError = ref('')
const genderError = ref('')
const birthdayError = ref('')
const levelData = ref(null)

// ── 成为管理员 ──
const isAdmin = computed(() => ['admin', 'super_admin'].includes(profile.value?.role))
const adminForm = reactive({ passphrase: '' })
const savingAdmin = ref(false)

async function saveAdmin() {
  if (!adminForm.passphrase) {
    ElMessage.warning('请输入管理员口令')
    return
  }
  savingAdmin.value = true
  try {
    const res = await becomeAdmin(adminForm.passphrase)
    ElMessage.success(res?.message || '恭喜，您已成为管理员')
    adminForm.passphrase = ''
    await loadProfile()
    await auth.fetchUser()
  } catch (e) {
    ElMessage.error(e.message || '升级失败')
  } finally {
    savingAdmin.value = false
  }
}

const regions = REGIONS

/** 去掉行政区划后缀，用于兼容历史保存的简称（如 "广东" ↔ "广东省"） */
function normRegionName(s) {
  return String(s || '').replace(/(特别行政区|维吾尔自治区|回族自治区|壮族自治区|自治区|省|市)$/, '')
}

/** 把已保存的所在地字符串匹配到标准省/市名，保证级联选择器能正确回显 */
function normalizeLocation(parts) {
  if (!Array.isArray(parts) || !parts.length) return []
  const [provRaw, cityRaw] = parts
  const prov = REGIONS.find(p => p.value === provRaw)
    || REGIONS.find(p => normRegionName(p.value) === normRegionName(provRaw))
  if (!prov) return parts
  const out = [prov.value]
  if (cityRaw) {
    const children = prov.children || []
    const city = children.find(c => c.value === cityRaw)
      || children.find(c => normRegionName(c.value) === normRegionName(cityRaw))
    if (city) out.push(city.value)
  }
  return out
}

const form = reactive({
  nickname: '',
  bio: '',
  gender: 0,
  birthday: null,
  location: [],
  space_theme: 'default',
})

const usernameForm = reactive({
  username: '',
  password: '',
})

const token = localStorage.getItem('flash_token')
const uploadHeaders = { Authorization: `Bearer ${token}` }
const avatarUploadUrl = `${API_BASE}/users/me/avatar`
const staticBase = import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8000'
const avatarUrl = computed(() =>
  profile.value?.avatar
    ? profile.value.avatar.startsWith('http') ? profile.value.avatar : `${staticBase}${profile.value.avatar}`
    : undefined
)
const coverPreviewUrl = computed(() =>
  profile.value?.space_cover
    ? profile.value.space_cover.startsWith('http') ? profile.value.space_cover : `${staticBase}${profile.value.space_cover}`
    : undefined
)

function coverPreviewError() {
  // 背景图加载失败静默处理
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

async function uploadCover(options) {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res = await fetch(`${API_BASE}/users/me/space-cover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '上传失败' }))
      throw new Error(err.detail || '上传失败')
    }
    const data = await res.json()
    profile.value.space_cover = data.space_cover
    ElMessage.success('背景更新成功')
    options.onSuccess(data)
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
    options.onError(e)
  }
}

async function loadProfile() {
  try {
    profile.value = await apiRequest('/users/me')
    // 保存到 localStorage 供 SpacePage 判断 isOwner 使用
    localStorage.setItem('flash_user', JSON.stringify({
      uid: profile.value.uid,
      id: profile.value.id,
      username: profile.value.username,
    }))
    form.nickname = profile.value.nickname || ''
    form.bio = profile.value.bio || ''
    form.gender = profile.value.gender || 0
    form.birthday = profile.value.birthday || null
    form.location = normalizeLocation(profile.value.location ? profile.value.location.split('/') : [])
    form.space_theme = profile.value.space_theme || 'default'

    // 加载等级信息
    levelData.value = await apiRequest(`/users/${profile.value.uid}/level`)
  } catch (e) {
    ElMessage.error('加载用户信息失败')
  }
}

async function saveProfile() {
  saving.value = true
  nicknameError.value = ''
  genderError.value = ''
  birthdayError.value = ''
  try {
    const data = await apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        nickname: form.nickname || undefined,
        bio: form.bio || undefined,
        gender: form.gender,
        birthday: form.birthday || undefined,
        location: form.location.length ? form.location.join('/') : undefined,
        space_theme: form.space_theme,
      }),
    })
    profile.value = data
    const pendingTexts = []
    if (data.pending_nickname) pendingTexts.push('昵称')
    if (data.pending_bio) pendingTexts.push('个性签名')
    ElMessage.success(
      pendingTexts.length
        ? `${pendingTexts.join('、')}修改已提交审核，审核通过后展示`
        : '保存成功'
    )
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('昵称')) nicknameError.value = msg
    else if (msg.includes('性别')) genderError.value = msg
    else if (msg.includes('生日')) birthdayError.value = msg
    else ElMessage.error(msg || '保存失败')
  } finally {
    saving.value = false
  }
}

async function saveUsername() {
  if (!usernameForm.password) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(usernameForm.username)) {
    ElMessage.warning('用户名需为 3~20 位字母/数字/下划线')
    return
  }
  savingUsername.value = true
  try {
    await apiRequest('/users/me/username', {
      method: 'PUT',
      body: JSON.stringify(usernameForm),
    })
    ElMessage.success('用户名修改成功，下次登录生效')
    usernameForm.password = ''
    usernameForm.username = ''
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  } finally {
    savingUsername.value = false
  }
}

function onAvatarSuccess(res) {
  profile.value = { ...profile.value, ...res }
  if (res.pending) {
    ElMessage.success(res.message || '头像已提交审核，审核通过后展示')
  } else {
    ElMessage.success('头像更新成功')
  }
  // 重新拉取最新状态（含 pending 标记）
  apiRequest('/users/me').then(d => { profile.value = d }).catch(() => {})
}

function onCoverError() {
  ElMessage.error('上传失败，文件可能过大或格式不支持')
}

onMounted(loadProfile)
</script>

<style scoped>
.profile-settings {
  max-width: 700px;
  margin: 0 auto;
  padding: 16px;
}
.settings-card {
  background: var(--bg-card);
  margin-top: 16px;
}
.settings-card:first-child { margin-top: 0; }
.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.settings-avatar {
  border: 2px solid var(--border-light);
  flex-shrink: 0;
}
.avatar-upload-col {
  display: flex;
  flex-direction: column;
}
.avatar-upload-col .el-upload__tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
.cover-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  max-height: 160px;
}
.cover-preview img {
  width: 100%;
  object-fit: cover;
  max-height: 160px;
}
.level-info {
  padding: 8px 0;
}
.level-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.level-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.level-badge.lv1 { background: #999; }
.level-badge.lv2 { background: #67c23a; }
.level-badge.lv3 { background: #409eff; }
.level-badge.lv4 { background: #9b59b6; }
.level-badge.lv5 { background: #e67e22; }
.level-badge.lv6 { background: #e74c3c; }
.level-title-name { font-size: 14px; color: var(--text-secondary); }
.level-exp-text { margin-top: 6px; font-size: 13px; }
</style>
