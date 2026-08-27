<template>
  <div class="space-page" v-if="profile" :class="'theme-' + (profile.space_theme || 'default')">
    <!-- 空间背景图 -->
    <div
      class="space-cover"
      :style="coverStyle"
      @click="openCoverUpload = true"
    >
      <div class="cover-overlay">
        <h1 class="space-nickname">{{ displayName }}</h1>
        <div class="space-uid">UID: {{ profile.uid }} <span class="copy-uid" @click.stop="copyUid">📋 复制</span></div>
      </div>
      <el-button v-if="isOwner" class="change-cover-btn" size="small" @click.stop="openCoverUpload = true">更换背景</el-button>
    </div>

    <!-- 用户信息卡片 -->
    <div class="profile-card">
      <div class="avatar-section">
        <el-avatar :size="80" :src="profileAvatarUrl" class="profile-avatar" @click="isOwner && (openAvatarUpload = true)">
          {{ (profile.nickname || 'U')[0] }}
        </el-avatar>
        <el-button v-if="isOwner" size="small" @click="openAvatarUpload = true">更换头像</el-button>
      </div>
      <div class="info-section">
        <div class="info-name">{{ displayName }}</div>
        <div class="info-level">
          <span class="level-badge" :class="`lv${profile.level}`">Lv{{ profile.level }}</span>
          <span class="level-title">{{ levelInfo.title }}</span>
        </div>
        <div class="info-bio">{{ profile.bio || '这个人很懒，什么都没留下' }}</div>
        <div class="info-stats">
          <span>关注 {{ profile.following_count }}</span>
          <span>粉丝 {{ profile.follower_count }}</span>
          <span>获赞 {{ profile.like_received }}</span>
        </div>
        <div class="info-meta" v-if="profile.location">📍 {{ profile.location }}</div>
        <div style="margin-top:12px; display:flex; gap:8px;">
          <el-button
            v-if="!isOwner && loggedIn"
            :type="profile.is_following ? 'default' : 'primary'"
            size="small"
            :loading="following"
            @click="toggleFollow"
          >
            {{ profile.is_following ? '已关注' : '+ 关注' }}
          </el-button>
          <el-button
            v-if="!isOwner && loggedIn"
            size="small"
            @click="openSend = true"
          >✉️ 发私信</el-button>
        </div>
      </div>
    </div>

    <!-- 勋章展示（本人/他人都可见） -->
    <div class="card badge-card" v-if="badges.length">
      <div class="card-title">🏅 勋章</div>
      <div class="badge-grid">
        <div v-for="b in badges" :key="b.id" class="badge-item" :title="b.description">
          <div class="badge-icon">{{ b.icon }}</div>
          <div class="badge-name">{{ b.name }}</div>
          <div class="badge-time" v-if="b.earned_at">{{ formatDate(b.earned_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Tab -->
    <el-tabs v-model="activeTab" class="content-tabs" @tab-change="onTabChange">
      <el-tab-pane label="投稿" name="posts">
        <div v-if="loadingPosts" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="posts.length === 0" class="empty-state">暂无投稿</div>
        <div v-for="p in posts" :key="p.id" class="content-item">
          <router-link :to="`/forum/post/${p.id}`" class="post-title">{{ p.title }}</router-link>
          <div class="post-meta-row">
            <span class="text-muted">{{ formatDate(p.created_at) }}</span>
            <span class="post-stats">
              👍 {{ p.like_count }} · 💬 {{ p.reply_count }} · 👁️ {{ p.view_count }}
            </span>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="回复" name="replies">
        <div class="empty-state">暂无回复</div>
      </el-tab-pane>
      <el-tab-pane label="关于" name="about">
        <div class="about-section">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="UID">{{ profile.uid }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ profile.nickname || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="等级">Lv{{ profile.level }} {{ levelInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="经验值">{{ profile.exp }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderText }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ profile.birthday || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="所在地">{{ profile.location || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatDate(profile.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 头像上传对话框 -->
    <el-dialog v-model="openAvatarUpload" title="上传头像" width="400px" @closed="avatarKey++">
      <el-upload
        :key="avatarKey"
        :action="avatarUploadUrl"
        :headers="uploadHeaders"
        :on-success="onAvatarSuccess"
        :on-error="onUploadError"
        :show-file-list="false"
        accept=".jpg,.jpeg,.png"
      >
        <el-button type="primary">选择图片</el-button>
        <template #tip><div class="el-upload__tip">JPG/PNG，最大 2MB</div></template>
      </el-upload>
    </el-dialog>

    <!-- 背景图上传对话框 -->
    <el-dialog v-model="openCoverUpload" title="上传空间背景" width="400px" @closed="coverKey++">
      <el-upload
        :key="coverKey"
        :action="coverUploadUrl"
        :headers="uploadHeaders"
        :on-success="onCoverSuccess"
        :on-error="onUploadError"
        :show-file-list="false"
        accept=".jpg,.jpeg,.png"
      >
        <el-button type="primary">选择图片</el-button>
        <template #tip><div class="el-upload__tip">JPG/PNG，最大 5MB</div></template>
      </el-upload>
    </el-dialog>

    <!-- 发私信弹窗 -->
    <el-dialog v-model="openSend" title="发送私信" width="480px">
      <el-form label-width="80px">
        <el-form-item label="收件人">
          <el-input :model-value="profile.username" disabled />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="sendForm.title" placeholder="可选" maxlength="100" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="sendForm.content" type="textarea" :rows="4" placeholder="输入消息内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="openSend = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
      </template>
    </el-dialog>
  </div>

  <!-- 加载中 -->
  <div v-else class="loading-page">
    <el-skeleton :rows="5" animated />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiRequest, isLoggedIn, API_BASE, sendPrivateMessage } from '../api'

const route = useRoute()
const badges = ref([])
const loadingPosts = ref(false)
const activeTab = ref('posts')
const openAvatarUpload = ref(false)
const openCoverUpload = ref(false)
const avatarKey = ref(0)
const coverKey = ref(0)

// 关注 / 私信
const following = ref(false)
const openSend = ref(false)
const sendForm = ref({ title: '', content: '' })
const sending = ref(false)

const uid = computed(() => Number(route.params.uid) || null)

const token = localStorage.getItem('flash_token')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${token}`,
}))

// 判断是否是自己的空间
const isOwner = computed(() => {
  if (!isLoggedIn()) return false
  const stored = localStorage.getItem('flash_user')
  if (!stored) return false
  try {
    const user = JSON.parse(stored)
    return user.uid === uid.value
  } catch {
    return false
  }
})

const displayName = computed(() => profile.value?.nickname || '未设置昵称')

const levelInfo = computed(() => {
  if (!profile.value) return { title: '' }
  const lv = profile.value.level
  const titles = { 1: '新手玩家', 2: '初级玩家', 3: '进阶玩家', 4: '资深玩家', 5: '精英玩家', 6: '传奇玩家' }
  return { title: titles[lv] || '' }
})

const genderText = computed(() => {
  const g = profile.value?.gender
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '保密'
})

const coverStyle = computed(() => ({
  backgroundImage: profile.value?.space_cover
    ? `url(${import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8000'}${profile.value.space_cover})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}))

const staticBase = import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8000'
const profileAvatarUrl = computed(() =>
  profile.value?.avatar
    ? profile.value.avatar.startsWith('http') ? profile.value.avatar : `${staticBase}${profile.value.avatar}`
    : undefined
)
const avatarUploadUrl = computed(() => `${API_BASE}/users/me/avatar`)
const coverUploadUrl = computed(() => `${API_BASE}/users/me/space-cover`)

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function copyUid() {
  navigator.clipboard.writeText(String(profile.value.uid))
  ElMessage.success('UID 已复制')
}

function onAvatarSuccess(res) {
  profile.value.avatar = res.avatar
  openAvatarUpload.value = false
  ElMessage.success('头像更新成功')
}

function onCoverSuccess(res) {
  profile.value.space_cover = res.space_cover
  openCoverUpload.value = false
  ElMessage.success('背景更新成功')
}

function onUploadError() {
  ElMessage.error('上传失败')
}

async function loadPosts() {
  if (!profile.value) return
  loadingPosts.value = true
  try {
    posts.value = await apiRequest(`/posts/search?user_id=${profile.value.id}&page_size=20`)
  } catch {
    posts.value = []
  } finally {
    loadingPosts.value = false
  }
}

async function loadProfile() {
  try {
    profile.value = await apiRequest(`/users/${uid.value}`)
  } catch (e) {
    ElMessage.error('用户不存在')
    profile.value = null
    return
  }
  // 加载勋章（公开，任何人可见）
  try { badges.value = await apiRequest(`/users/${uid.value}/badges`) } catch { badges.value = [] }
  // 加载投稿
  loadPosts()
}

async function toggleFollow() {
  following.value = true
  try {
    if (profile.value.is_following) {
      await apiRequest(`/users/${uid.value}/follow`, { method: 'DELETE' })
      profile.value.is_following = false
      profile.value.follower_count = Math.max(0, (profile.value.follower_count || 0) - 1)
      ElMessage.success('已取消关注')
    } else {
      const res = await apiRequest(`/users/${uid.value}/follow`, { method: 'POST' })
      profile.value.is_following = res.is_following
      profile.value.follower_count = res.follower_count
      ElMessage.success('关注成功')
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    following.value = false
  }
}

async function handleSend() {
  if (!sendForm.value.content.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  sending.value = true
  try {
    await sendPrivateMessage(profile.value.username, sendForm.value.title.trim(), sendForm.value.content.trim())
    ElMessage.success('私信发送成功')
    openSend.value = false
    sendForm.value = { title: '', content: '' }
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

function onTabChange(tab) {
  if (tab === 'posts' && posts.value.length === 0 && !loadingPosts.value) {
    loadPosts()
  }
}

onMounted(() => {
  if (uid.value) {
    loadProfile()
  }
})
</script>

<style scoped>
.space-page {
  max-width: 900px;
  margin: 0 auto;
}
.space-cover {
  height: 250px;
  border-radius: 12px;
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  cursor: pointer;
  overflow: hidden;
}
/* 渐变遮罩：保证自定义背景图上文字可读 */
.space-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 45%, rgba(0,0,0,0) 100%);
  z-index: 0;
}
.cover-overlay {
  position: relative;
  z-index: 1;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.space-nickname { font-size: 28px; margin: 0; }
.space-uid { font-size: 14px; margin-top: 4px; opacity: 0.9; }
.copy-uid { cursor: pointer; text-decoration: underline; margin-left: 8px; }
.change-cover-btn {
  position: absolute !important;
  top: 16px;
  right: 16px;
  color: #fff !important;
  background: rgba(0,0,0,.35) !important;
}
.profile-card {
  display: flex;
  gap: 24px;
  padding: 24px;
  background: var(--bg-card);
  border-radius: 12px;
  margin-top: -40px;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-card);
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.profile-avatar {
  border: 3px solid var(--bg-card);
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
  cursor: pointer;
}
.info-name { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.info-level { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.level-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.level-badge.lv1 { background: #999; }
.level-badge.lv2 { background: #67c23a; }
.level-badge.lv3 { background: #409eff; }
.level-badge.lv4 { background: #9b59b6; }
.level-badge.lv5 { background: #e67e22; }
.level-badge.lv6 { background: #e74c3c; }
.level-title { font-size: 13px; color: var(--text-secondary); }
.info-bio { margin-top: 8px; color: var(--text-secondary); font-size: 14px; }
.info-stats { display: flex; gap: 20px; margin-top: 12px; font-size: 14px; color: var(--text-secondary); }
.info-meta { margin-top: 6px; color: var(--text-muted); font-size: 13px; }
.content-tabs { margin-top: 16px; }
.content-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
}
.content-item:last-child { border-bottom: none; }
.post-title {
  display: block;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
}
.post-title:hover { color: var(--text-link); }
.post-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.post-stats { color: var(--text-muted); }
.empty-state { text-align: center; padding: 48px; color: var(--text-muted); }
.loading-state { padding: 24px; }
.loading-page { max-width: 900px; margin: 0 auto; padding: 24px; }
.about-section { padding: 8px 0; }

/* 勋章 */
.badge-card { margin-top: 16px; }
.badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 8px 0;
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 96px;
  padding: 12px 8px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-elevated);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.badge-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.badge-icon { font-size: 32px; }
.badge-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.badge-time { font-size: 11px; color: var(--text-muted); }

/* 空间主题 */
.space-page.theme-dark .profile-card {
  background: #1a1a30;
  border-color: #2a2a4a;
}
.space-page.theme-dark .info-name,
.space-page.theme-dark .info-bio,
.space-page.theme-dark .post-title {
  color: #e0e0e0;
}

.space-page.theme-blue .profile-card {
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%);
}
.space-page.theme-blue .info-name { color: #0056b3; }
.space-page.theme-blue .post-title:hover { color: #0077e6; }
.dark .space-page.theme-blue .profile-card {
  background: linear-gradient(135deg, #1a2a40 0%, #1e3a5f 100%);
}
</style>
