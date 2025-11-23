import axios from 'axios'

const service = axios.create({
  baseURL: '/admin', // 统一添加admin前缀
  timeout: 10000
})

// 请求拦截器 - 添加Authorization头
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)
service.interceptors.response.use(
  response => response.data,
  error => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('token')
      localStorage.removeItem('operator')
      localStorage.removeItem('shop_info')
      localStorage.removeItem('shop_list')
      
      // 跳转到登录页
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 统一处理 HTTP 错误状态码
    if (error.response && error.response.data) {
      const errorData = error.response.data
      // 如果有业务错误信息，直接返回，让业务代码处理
      if (errorData.code !== undefined) {
        return Promise.resolve(errorData)
      }
      // 如果没有业务错误码，但有错误信息，包装成统一格式
      if (errorData.message) {
        return Promise.resolve({
          code: -1,
          message: errorData.message
        })
      }
    }
    
    // 网络错误或其他无法处理的错误
    return Promise.reject(error)
  }
)

export default service
