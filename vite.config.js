import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 代理 API 请求到你的后端
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8009', // // 你的 Golang 后端地址
        changeOrigin: true
      }
    }
  }
})
