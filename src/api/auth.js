import request from './request'

// 登录接口
export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}





