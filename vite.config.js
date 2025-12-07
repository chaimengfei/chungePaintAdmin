import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 代理 API 请求到你的后端
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/admin': {
        target: 'https://paint.maocai.shop', // 你的 Golang 后端地址
        changeOrigin: true
      }
    }
  }
})
