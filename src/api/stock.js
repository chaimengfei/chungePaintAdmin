import request from './request'

// 批量操作
export function batchInboundStock(data) {
  return request.post('/stock/batch/inbound', data)
}

export function batchOutboundStock(data) {
  return request.post('/stock/batch/outbound', data)
}

export function returnStock(data) {
  return request.post('/stock/return', data)
}

export function getStockLogs(params) {
  return request.get('/stock/operations', { params })
}

// 商品管理
export function getProductList(params) {
  return request.get('/product/list', { params })
}

export function getProductDetail(id) {
  return request.get(`/product/${id}`)
}

export function addProduct(data) {
  return request.post('/product/add', data)
}

export function updateProduct(id, data) {
  return request.put(`/product/edit/${id}`, data)
}

export function deleteProduct(id) {
  return request.delete(`/product/del/${id}`)
} 