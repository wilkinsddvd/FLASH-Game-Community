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
        </el-form-item>
        <el-form-item label="个人签名">
          <el-input v-model="form.bio" maxlength="30" show-word-limit type="textarea" :rows="2" style="max-width:300px" />
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
          <el-date-picker v-model="form.birthday" type="date" placeholder="选择日期" style="max-width:300px"
            :disabled="!!profile?.birthday" />
          <div class="form-hint" v-if="profile?.birthday">生日设置后无法修改</div>
        </el-form-item>
        <el-form-item label="所在地">
          <el-cascader
            v-model="form.location"
            :options="regions"
            :props="{ expandTrigger: 'hover', value: 'name', label: 'name' }"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn, API_BASE } from '../api'

const profile = ref(null)
const saving = ref(false)
const savingUsername = ref(false)
const nicknameError = ref('')
const genderError = ref('')
const birthdayError = ref('')
const levelData = ref(null)

const regions = [
  { value: '北京', label: '北京', children: [{ value: '北京', label: '北京' }] },
  { value: '上海', label: '上海', children: [{ value: '上海', label: '上海' }] },
  { value: '天津', label: '天津', children: [{ value: '天津', label: '天津' }] },
  { value: '重庆', label: '重庆', children: [{ value: '重庆', label: '重庆' }] },
  { value: '广东', label: '广东', children: [
    { value: '广州', label: '广州' }, { value: '深圳', label: '深圳' },
    { value: '东莞', label: '东莞' }, { value: '佛山', label: '佛山' },
    { value: '珠海', label: '珠海' }, { value: '中山', label: '中山' },
    { value: '惠州', label: '惠州' }, { value: '汕头', label: '汕头' },
  ]},
  { value: '浙江', label: '浙江', children: [
    { value: '杭州', label: '杭州' }, { value: '宁波', label: '宁波' },
    { value: '温州', label: '温州' }, { value: '嘉兴', label: '嘉兴' },
    { value: '绍兴', label: '绍兴' }, { value: '金华', label: '金华' },
  ]},
  { value: '江苏', label: '江苏', children: [
    { value: '南京', label: '南京' }, { value: '苏州', label: '苏州' },
    { value: '无锡', label: '无锡' }, { value: '常州', label: '常州' },
    { value: '南通', label: '南通' }, { value: '徐州', label: '徐州' },
  ]},
  { value: '四川', label: '四川', children: [
    { value: '成都', label: '成都' }, { value: '绵阳', label: '绵阳' },
    { value: '德阳', label: '德阳' }, { value: '宜宾', label: '宜宾' },
  ]},
  { value: '湖北', label: '湖北', children: [
    { value: '武汉', label: '武汉' }, { value: '宜昌', label: '宜昌' },
    { value: '襄阳', label: '襄阳' }, { value: '荆州', label: '荆州' },
  ]},
  { value: '湖南', label: '湖南', children: [
    { value: '长沙', label: '长沙' }, { value: '株洲', label: '株洲' },
    { value: '湘潭', label: '湘潭' }, { value: '衡阳', label: '衡阳' },
  ]},
  { value: '福建', label: '福建', children: [
    { value: '福州', label: '福州' }, { value: '厦门', label: '厦门' },
    { value: '泉州', label: '泉州' }, { value: '漳州', label: '漳州' },
  ]},
  { value: '山东', label: '山东', children: [
    { value: '济南', label: '济南' }, { value: '青岛', label: '青岛' },
    { value: '烟台', label: '烟台' }, { value: '潍坊', label: '潍坊' },
  ]},
  { value: '辽宁', label: '辽宁', children: [
    { value: '沈阳', label: '沈阳' }, { value: '大连', label: '大连' },
  ]},
  { value: '河南', label: '河南', children: [
    { value: '郑州', label: '郑州' }, { value: '洛阳', label: '洛阳' },
  ]},
  { value: '河北', label: '河北', children: [
    { value: '石家庄', label: '石家庄' }, { value: '唐山', label: '唐山' },
  ]},
  { value: '陕西', label: '陕西', children: [
    { value: '西安', label: '西安' }, { value: '咸阳', label: '咸阳' },
  ]},
  { value: '安徽', label: '安徽', children: [
    { value: '合肥', label: '合肥' }, { value: '芜湖', label: '芜湖' },
  ]},
  { value: '广西', label: '广西', children: [
    { value: '南宁', label: '南宁' }, { value: '桂林', label: '桂林' },
  ]},
  { value: '云南', label: '云南', children: [
    { value: '昆明', label: '昆明' }, { value: '大理', label: '大理' },
  ]},
  { value: '江西', label: '江西', children: [
    { value: '南昌', label: '南昌' }, { value: '九江', label: '九江' },
  ]},
  { value: '黑龙江', label: '黑龙江', children: [
    { value: '哈尔滨', label: '哈尔滨' }, { value: '大庆', label: '大庆' },
  ]},
  { value: '吉林', label: '吉林', children: [
    { value: '长春', label: '长春' }, { value: '吉林', label: '吉林' },
  ]},
  { value: '山西', label: '山西', children: [
    { value: '太原', label: '太原' }, { value: '大同', label: '大同' },
  ]},
  { value: '贵州', label: '贵州', children: [
    { value: '贵阳', label: '贵阳' }, { value: '遵义', label: '遵义' },
  ]},
  { value: '甘肃', label: '甘肃', children: [
    { value: '兰州', label: '兰州' }, { value: '天水', label: '天水' },
  ]},
  { value: '内蒙古', label: '内蒙古', children: [
    { value: '呼和浩特', label: '呼和浩特' }, { value: '包头', label: '包头' },
  ]},
  { value: '新疆', label: '新疆', children: [
    { value: '乌鲁木齐', label: '乌鲁木齐' }, { value: '克拉玛依', label: '克拉玛依' },
  ]},
  { value: '西藏', label: '西藏', children: [
    { value: '拉萨', label: '拉萨' },
  ]},
  { value: '海南', label: '海南', children: [
    { value: '海口', label: '海口' }, { value: '三亚', label: '三亚' },
  ]},
  { value: '宁夏', label: '宁夏', children: [
    { value: '银川', label: '银川' },
  ]},
  { value: '青海', label: '青海', children: [
    { value: '西宁', label: '西宁' },
  ]},
  { value: '香港', label: '香港', children: [{ value: '香港', label: '香港' }] },
  { value: '澳门', label: '澳门', children: [{ value: '澳门', label: '澳门' }] },
  { value: '台湾', label: '台湾', children: [{ value: '台北', label: '台北' }] },
  { value: '海外', label: '海外', children: [{ value: '海外', label: '海外' }] },
]

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
    form.location = profile.value.location ? profile.value.location.split('/') : []
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
    ElMessage.success('保存成功')
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
  profile.value.avatar = res.avatar
  ElMessage.success('头像更新成功')
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
