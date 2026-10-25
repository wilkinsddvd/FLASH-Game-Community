import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoading } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import i18n, { applyHtmlLang } from './i18n'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
applyHtmlLang(i18n.global.locale.value)

// 组件本身由 unplugin-vue-components 按需引入（见 vite.config.js），
// 这里只注册 v-loading 指令（模板指令无法被组件解析器处理）。
app.use(ElLoading)

// 图标按需：目前只有 AdminRegisterPage 用到 Lock，各自 import，
// 不再全量注册（原写法把整套图标打进主包，体积浪费 ~38KB gzip）

app.mount('#app')
