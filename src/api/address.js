import request from './request'

// 获取地址列表
export function getAddressList(params) {
  return request({
    url: '/address/list',
    method: 'get',
    params
  })
}

// 新增地址
export function addAddress(data) {
  return request({
    url: '/address/add',
    method: 'post',
    data
  })
}

// 编辑地址
export function editAddress(data) {
  return request({
    url: '/address/edit',
    method: 'put',
    data
  })
}

// 删除地址
export function deleteAddress(id) {
  return request({
    url: `/address/del/${id}`,
    method: 'delete'
  })
}

