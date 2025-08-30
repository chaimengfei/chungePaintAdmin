import request from './request'

// 获取商品分类列表
export function getCategoryList() {
  return request({
    url: '/admin/product/categories',
    method: 'get'
  })
}

// 新增商品分类
export function addCategory(data) {
  return request({
    url: '/admin/product/category/add',
    method: 'post',
    data
  })
}

// 编辑商品分类
export function editCategory(id, data) {
  return request({
    url: `/admin/product/category/edit/${id}`,
    method: 'put',
    data
  })
}

// 删除商品分类
export function deleteCategory(id) {
  return request({
    url: `/admin/product/category/del/${id}`,
    method: 'delete'
  })
}
