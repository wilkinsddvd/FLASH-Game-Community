import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('./pages/HomePage.vue') },
  { path: '/guide', name: 'Guide', component: () => import('./pages/GuidePage.vue') },
  { path: '/cert', name: 'Cert', component: () => import('./pages/CertPage.vue') },
  { path: '/feedback', name: 'Feedback', component: () => import('./pages/FeedbackPage.vue') },
  { path: '/squad', name: 'Squad', component: () => import('./pages/SquadPage.vue') },
  { path: '/squad/:faction/:roster', name: 'SquadRoster', component: () => import('./pages/SquadRosterPage.vue') },
  { path: '/developer', name: 'Developer', component: () => import('./pages/DeveloperPage.vue') },
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
      { path: 'articles', component: () => import('./pages/admin/ArticleManage.vue') },
      { path: 'articles/create', component: () => import('./pages/admin/ArticleFormPage.vue') },
      { path: 'articles/:id/edit', component: () => import('./pages/admin/ArticleFormPage.vue') },
      { path: 'banners', component: () => import('./pages/admin/BannerManage.vue') },
      { path: 'pages', component: () => import('./pages/admin/PageManage.vue') },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('flash_token')) {
    next('/login')
  } else {
    next()
  }
})

export default router
