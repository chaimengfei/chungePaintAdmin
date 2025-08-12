import request from './request'

// 获取STS临时凭证
export function getSTS() {
  return request.get('/oss/sts')
}

// 上传文件到后端
export function uploadGoodsImage(formData) {
  return request.post('/oss/upload', formData)
}
