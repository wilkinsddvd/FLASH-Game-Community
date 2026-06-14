import { createRouter, createWebHistory } from 'vue-router'
import DisplayPage from './pages/DisplayPage.vue'
import GuidePage from './pages/GuidePage.vue'
import DeveloperPage from './pages/DeveloperPage.vue'
import ForumPage from './pages/ForumPage.vue'
import AdminPage from './pages/AdminPage.vue'

const routes = [
  { path: '/', redirect: '/display' },
  { path: '/display', component: DisplayPage },
  { path: '/guide', component: GuidePage },
  { path: '/developer', component: DeveloperPage },
  { path: '/forum', component: ForumPage },
  { path: '/admin', component: AdminPage },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
