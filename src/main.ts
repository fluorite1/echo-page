import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import customComponents from './custom-component'

import '@/styles/global.scss'
import '@/styles/animate.scss'

// Element Plus：按需组件样式由 Vite 插件自动注入（见 vite.config.ts）
// 这里仅补齐消息类服务的样式（否则 ElMessage / ElMessageBox 可能无样式）
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(customComponents)

app.mount('#app')
