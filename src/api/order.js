import request from './request'

// 批量操作
export function batchInboundStock(data) {
  return request.post('/order/batch/inbound', data)
}

export function batchOutboundStock(data) {
  return request.post('/order/batch/outbound', data)
}

export function returnStock(data) {
  return request.post('/stock/return', data)
}


// 商品管理
export function getProductList(params = {}) {
  // 设置默认 page_size 为 20
  const requestParams = {
    page_size: 20,
    ...params
  }
  return request.get('/product/list', { params: requestParams })
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

// 获取供应商列表
export function getSupplierList() {
  return request.get('/order/suppliers')
}

// 获取库存操作日志列表
export function getStockItemsList(params) {
  return request.get('/order/items', { params })
}

// 新增费用记录
export function addFee(data) {
  return request.post('/order/fee', data)
}

// 前端草稿管理（使用localStorage，无需后端）
export const DraftManager = {
  // 获取草稿存储key
  getDraftKey(operatorId) {
    return `outbound_draft_${operatorId}`
  },
  
  // 获取草稿数据
  getDraft(operatorId) {
    try {
      const key = this.getDraftKey(operatorId)
      const draft = localStorage.getItem(key)
      return draft ? JSON.parse(draft) : null
    } catch (error) {
      console.error('获取草稿失败:', error)
      return null
    }
  },
  
  // 保存草稿数据
  saveDraft(operatorId, data) {
    try {
      const key = this.getDraftKey(operatorId)
      const draftData = {
        ...data,
        operator_id: operatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(draftData))
      return true
    } catch (error) {
      console.error('保存草稿失败:', error)
      return false
    }
  },
  
  // 删除草稿数据
  deleteDraft(operatorId) {
    try {
      const key = this.getDraftKey(operatorId)
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('删除草稿失败:', error)
      return false
    }
  },
  
  // 检查是否有草稿
  hasDraft(operatorId) {
    return this.getDraft(operatorId) !== null
  }
} 