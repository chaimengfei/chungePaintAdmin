import axios from 'axios'

const service = axios.create({
  baseURL: '/api', // 通过vite代理
  timeout: 5000
})
service.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

export default service
