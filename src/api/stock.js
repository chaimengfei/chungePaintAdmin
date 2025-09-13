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

// 获取出库列表
export function getOutboundList(params) {
  return request.get('/stock/outbound/list', { params })
}

// 获取入库列表
export function getInboundList(params) {
  return request.get('/stock/inbound/list', { params })
}

// 获取供应商列表
export function getSupplierList() {
  return request.get('/stock/suppliers')
} 