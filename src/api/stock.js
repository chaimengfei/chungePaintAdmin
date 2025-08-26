import request from './request'

// 批量操作
export function batchInboundStock(data) {
  return request.post('/admin/stock/batch/inbound', data)
}

export function batchOutboundStock(data) {
  return request.post('/admin/stock/batch/outbound', data)
}

export function returnStock(data) {
  return request.post('/admin/stock/return', data)
}

export function getStockLogs(params) {
  return request.get('/admin/stock/operations', { params })
}

// 商品管理
export function getProductList(params) {
  return request.get('/admin/product/list', { params })
}

export function getProductDetail(id) {
  return request.get(`/admin/product/${id}`)
}

export function addProduct(data) {
  return request.post('/admin/product/add', data)
}

export function updateProduct(id, data) {
  return request.put(`/admin/product/edit/${id}`, data)
}

export function deleteProduct(id) {
  return request.delete(`/admin/product/del/${id}`)
} 