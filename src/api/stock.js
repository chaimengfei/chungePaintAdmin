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