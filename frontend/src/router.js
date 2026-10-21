import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('./pages/HomePage.vue'), meta: { wide: true } },
  { path: '/guide', name: 'Guide', component: () => import('./pages/GuidePage.vue') },
  { path: '/cert', name: 'Cert', component: () => import('./pages/CertPage.vue') },
  { path: '/cert/result/:id', name: 'QuizResult', component: () => import('./pages/QuizResultPage.vue'), meta: { requiresAuth: true } },
  { path: '/feedback', redirect: '/about#feedback' },
  { path: '/feedback/submit', name: 'FeedbackSubmit', component: () => import('./pages/FeedbackSubmitPage.vue') },
  { path: '/board', redirect: '/home#board' },
  { path: '/squad', name: 'Squad', component: () => import('./pages/SquadPage.vue') },
  // 注意：raas / vehicles 路由必须放在 /squad/:faction/:roster 之前，否则会被通配路由吃掉
  { path: '/squad/points', name: 'SquadPoints', component: () => import('./pages/SquadPointsPage.vue') },
  { path: '/squad/points/:mode', name: 'SquadPointsMaps', component: () => import('./pages/SquadRaasPage.vue') },
  { path: '/squad/points/:mode/:layer', name: 'SquadPointsLayer', component: () => import('./pages/SquadRaasLayerPage.vue') },
  { path: '/squad/raas', redirect: '/squad/points/raas' },
  { path: '/squad/raas/:layer', redirect: (to) => `/squad/points/raas/${to.params.layer}` },
  { path: '/squad/vehicles', name: 'SquadVehicles', component: () => import('./pages/SquadVehiclesPage.vue') },
  { path: '/squad/vehicles/:faction', name: 'SquadVehiclesFaction', component: () => import('./pages/SquadVehiclesPage.vue') },
  { path: '/squad/fire-control', name: 'FireControl', component: () => import('./pages/FireControlPage.vue') },
  { path: '/squad/:faction/:roster', name: 'SquadRoster', component: () => import('./pages/SquadRosterPage.vue') },
  { path: '/developer', name: 'Developer', component: () => import('./pages/DeveloperPage.vue') },
  { path: '/article/:id', name: 'Article', component: () => import('./pages/ArticlePage.vue') },
  { path: '/sponsor', name: 'Sponsor', component: () => import('./pages/SponsorPage.vue') },
  { path: '/forum', name: 'Forum', component: () => import('./pages/ForumPage.vue') },
  { path: '/forum/section/:id', name: 'SectionPosts', component: () => import('./pages/SectionPosts.vue') },
  { path: '/forum/post/:id', name: 'PostDetail', component: () => import('./pages/PostDetail.vue') },
  { path: '/forum/create', name: 'CreatePost', component: () => import('./pages/CreatePost.vue') },
  { path: '/about', name: 'About', component: () => import('./pages/AboutPage.vue') },
  { path: '/login', name: 'Login', component: () => import('./pages/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('./pages/RegisterPage.vue') },
  { path: '/admin-register', name: 'AdminRegister', component: () => import('./pages/AdminRegisterPage.vue') },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('./pages/ForgotPassword.vue') },
  { path: '/messages', name: 'Messages', component: () => import('./pages/MessagePage.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: () => import('./pages/ProfileSettings.vue'), meta: { requiresAuth: true } },
  { path: '/space/:uid', name: 'Space', component: () => import('./pages/SpacePage.vue') },
  { path: '/admin', name: 'Admin', component: () => import('./pages/admin/AdminLayout.vue'), meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/users' },
      { path: 'users', component: () => import('./pages/admin/UserManage.vue') },
      { path: 'roles', component: () => import('./pages/admin/RoleManage.vue') },
      { path: 'permissions', component: () => import('./pages/admin/PermissionManage.vue') },
      { path: 'passphrase', component: () => import('./pages/admin/PassphraseManage.vue') },
      { path: 'notices', component: () => import('./pages/admin/NoticeManage.vue') },
      { path: 'quiz', component: () => import('./pages/admin/QuizManage.vue') },
      { path: 'videos', component: () => import('./pages/admin/VideoManage.vue') },
      { path: 'feedback', component: () => import('./pages/admin/FeedbackManage.vue') },
      { path: 'message-board', component: () => import('./pages/admin/MessageBoardManage.vue') },
      { path: 'audits', component: () => import('./pages/admin/AuditManage.vue') },
      { path: 'super', component: () => import('./pages/admin/SuperAdminPage.vue') },
      { path: 'articles', component: () => import('./pages/admin/ArticleManage.vue') },
      { path: 'articles/create', component: () => import('./pages/admin/ArticleFormPage.vue') },
      { path: 'articles/:id/edit', component: () => import('./pages/admin/ArticleFormPage.vue') },
      { path: 'banners', component: () => import('./pages/admin/BannerManage.vue') },
      { path: 'pages', component: () => import('./pages/admin/PageManage.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 84, behavior: 'smooth' }
    return { top: 0 }
  },
})

// 发布新版本后，旧页面可能加载不到已改名的 chunk（Failed to fetch dynamically imported module）。
// 这种情况下 SPA 会停在空白页，用户只能手动刷新。这里自动整页重载一次，并用 sessionStorage 防循环。
const CHUNK_RELOAD_KEY = 'flash_chunk_reload'
router.onError((error, to) => {
  const msg = String(error?.message || error || '')
  const isChunkError = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(msg)
  if (!isChunkError) return
  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
  // 10 秒内只自动重载一次：既能让旧版本页面恢复，又不会在真正坏包时无限刷新
  if (last && Date.now() - last < 10000) return
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  window.location.assign(to?.fullPath || window.location.href)
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('flash_token')) {
    next('/login')
  } else {
    next()
  }
})

export default router
