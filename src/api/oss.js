import request from './request'

// 获取STS临时凭证
export function getSTS() {
  return request.get('/image/sts')
}

// 上传文件到后端 (保留旧接口，用于兼容)
export function uploadGoodsImage(formData) {
  return request.post('/oss/upload', formData)
}
