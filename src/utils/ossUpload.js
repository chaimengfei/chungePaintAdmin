import OSS from 'ali-oss'
import { getSTS } from '@/api/oss'

/**
 * 上传文件到阿里云OSS
 * @param {File} file - 要上传的文件
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise<string>} 返回文件的访问URL
 */
export async function uploadToOSS(file, onProgress) {
  try {
    // 1. 获取STS临时凭证
    const stsResponse = await getSTS()
    
    if (stsResponse.code !== 0) {
      throw new Error('获取STS凭证失败: ' + stsResponse.message)
    }
    
    const stsData = stsResponse.data
    
    // 2. 创建OSS客户端
    const client = new OSS({
      region: 'oss-cn-beijing',
      accessKeyId: stsData.access_key_id,
      accessKeySecret: stsData.access_key_secret,
      stsToken: stsData.security_token,
      bucket: stsData.bucket,
      secure: true
    })
    
    // 3. 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${stsData.dir}${timestamp}_${randomStr}.${fileExtension}`
    
    // 4. 上传文件
    const result = await client.put(fileName, file, {
      progress: (p) => {
        if (onProgress) {
          onProgress(Math.round(p * 100))
        }
      }
    })
    
    // 5. 返回文件的访问URL
    return result.url
    
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw new Error('文件上传失败: ' + error.message)
  }
}

/**
 * 验证文件类型和大小
 * @param {File} file - 要验证的文件
 * @returns {Object} 验证结果 {valid: boolean, message: string}
 */
export function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  const maxSize = 2 * 1024 * 1024 // 2MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: '上传图片只能是 JPG 或 PNG 格式!'
    }
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: '上传图片大小不能超过 2MB!'
    }
  }
  
  return {
    valid: true,
    message: ''
  }
}
