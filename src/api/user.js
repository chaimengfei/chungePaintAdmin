import request from './request'

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

// 获取用户详情
export function getUserDetail(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

// 添加用户
export function addUser(data) {
  return request({
    url: '/user/add',
    method: 'post',
    data: {
      ...data,
      shop_id: data.shop_id || 1 // 默认燕郊店
    }
  })
}

// 编辑用户
export function editUser(data) {
  return request({
    url: '/user/edit',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/user/del/${id}`,
    method: 'delete'
  })
}
