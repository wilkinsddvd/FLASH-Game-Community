import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需注册：模板里的 <el-xxx> 自动引入组件本身，
    // 不再 app.use(ElementPlus) 一次性把整套组件打进主包。
    // importStyle: false —— 样式仍用 dist/index.css 全量引入（避免逐组件样式漏引），
    // 后续要再省 CSS 可改成 { importStyle: 'css' } 并删掉全量 CSS。
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: false,
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
})
