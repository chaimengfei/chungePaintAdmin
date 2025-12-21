<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail, addProduct, updateProduct } from '../api/order'
import { uploadGoodsImage } from '../api/oss'
import { uploadToOSS, validateFile } from '../utils/ossUpload'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const isEdit = ref(false)
const fileInput = ref()
const uploading = ref(false)
const uploadProgress = ref(0)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

const form = reactive({
  id: '',
  name: '',
  category_id: 1,
  seller_price: '',
  cost: '',
  shipping_cost: 0,
  product_cost: '',
  image: '',
  unit: '',
  specification: '',
  remark: '',
  is_on_shelf: 1,
  shop_id: null,
  stock: 0
})

// 保存原始数据，用于比较哪些字段有变化
const originalData = ref({})

const rules = {
  seller_price: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  is_on_shelf: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const formRef = ref()

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  // 判断是否为root用户
  isRoot.value = !shop || shop === 'null'
  
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
}

onMounted(() => {
  loadUserInfo()
  const id = route.query.id
  if (id) {
    isEdit.value = true
    loadProductDetail(id)
  }
})

function loadProductDetail(id) {
  loading.value = true
  getProductDetail(id).then(res => {
    if (res.code === 0) {
      // 根据API返回的数据结构，商品数据在 res.data.product 中
      Object.assign(form, res.data.product)
      // 保存原始数据，用于比较哪些字段有变化
      originalData.value = { ...res.data.product }
    } else {
      ElMessage.error('获取商品详情失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取商品详情失败')
  })
}

// 图片上传相关函数
function handleImageUpload() {
  if (uploading.value) return
  fileInput.value.click()
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    ElMessage.error(validation.message)
    return
  }
  
  // 开始上传
  uploadFile(file)
}

async function uploadFile(file) {
  try {
    uploading.value = true
    uploadProgress.value = 0
    
    const imageUrl = await uploadToOSS(file, (progress) => {
      uploadProgress.value = progress
    })
    
    form.image = imageUrl
    ElMessage.success('图片上传成功')
    
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error(error.message || '图片上传失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    // 清空input值，允许重复选择同一文件
    fileInput.value.value = ''
  }
}


function saveGoods() {
  formRef.value.validate((valid) => {
    if (!valid) return
    
    loading.value = true
    
    if (isEdit.value) {
      // 只提交有变化的字段
      const changedFields = getChangedFields()
      
      // 如果没有字段变化，提示用户
      if (Object.keys(changedFields).length === 0) {
        ElMessage.warning('没有检测到任何更改')
        loading.value = false
        return
      }
      
      // 始终包含shop_id
      changedFields.shop_id = form.shop_id
      
      console.log('提交的字段:', changedFields) // 调试信息
      
      updateProduct(form.id, changedFields).then(res => {
        if (res.code === 0) {
          ElMessage.success('更新成功')
          router.push('/goods')
        } else {
          ElMessage.error(res.message || '更新失败')
        }
        loading.value = false
      }).catch(() => {
        loading.value = false
        ElMessage.error('更新失败')
      })
    } else {
      // 添加商品时提交所有数据
      const submitData = { ...form }
      addProduct(submitData).then(res => {
        if (res.code === 0) {
          ElMessage.success('添加成功')
          router.push('/goods')
        } else {
          ElMessage.error(res.message || '添加失败')
        }
        loading.value = false
      }).catch(() => {
        loading.value = false
        ElMessage.error('添加失败')
      })
    }
  })
}

// 获取有变化的字段
function getChangedFields() {
  const changedFields = {}
  const editableFields = ['seller_price', 'specification', 'is_on_shelf', 'remark', 'stock']
  
  editableFields.forEach(field => {
    if (form[field] !== originalData.value[field]) {
      changedFields[field] = form[field]
    }
  })
  
  return changedFields
}

function cancel() {
  router.push('/goods')
}
</script>

<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h2>{{ isEdit ? '编辑商品' : '添加商品' }}</h2>
    </div>
    
    <el-form 
      ref="formRef"
      :model="form" 
      :rules="rules"
      label-width="120px" 
      style="max-width: 800px"
      v-loading="loading"
    >
      <!-- 店铺选择、分类 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属店铺" prop="shop_id">
            <!-- 普通管理员显示固定店铺 -->
            <el-input 
              v-if="!isRoot && shopInfo" 
              :value="shopInfo.name" 
              disabled 
              style="width: 100%;"
            />
            <!-- Root用户显示店铺选择器 -->
            <el-select 
              v-else-if="isRoot && shopList.length > 0"
              v-model="form.shop_id" 
              placeholder="请选择店铺" 
              style="width: 100%;"
            >
              <el-option
                v-for="shop in shopList"
                :key="shop.id"
                :label="shop.name"
                :value="shop.id"
              />
            </el-select>
            <span v-else style="color: #909399;">暂无店铺信息</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分类" prop="category_id">
            <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%" disabled>
              <el-option label="油漆类" :value="1" />
              <el-option label="工具类" :value="2" />
              <el-option label="其他" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入商品名称" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="售价" prop="seller_price">
            <el-input v-model.number="form.seller_price" type="number" min="0" step="0.01" placeholder="请输入售价">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="规格" prop="specification">
            <el-input v-model="form.specification" placeholder="请输入规格" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位" prop="unit">
            <el-input v-model="form.unit" placeholder="请输入单位" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品状态">
            <el-radio-group v-model="form.is_on_shelf">
              <el-radio :label="1">上架</el-radio>
              <el-radio :label="0">下架</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库存" prop="stock">
            <el-input-number 
              v-model="form.stock" 
              :min="0" 
              :step="1" 
              placeholder="请输入库存"
              style="width: 100%;"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="商品图片">
        <div class="image-upload-container">
          <div v-if="form.image" class="image-preview">
            <el-image 
              :src="form.image" 
              style="width: 200px; height: 200px; object-fit: cover; border-radius: 4px;"
              :preview-src-list="[form.image]"
            />
            <div class="image-actions">
              <el-button size="small" @click="handleImageUpload">更换图片</el-button>
            </div>
          </div>
          <div v-else class="image-upload-placeholder" @click="handleImageUpload">
            <el-icon v-if="!uploading" class="upload-icon"><Plus /></el-icon>
            <el-icon v-else class="upload-icon is-loading"><Loading /></el-icon>
            <div class="upload-text">
              {{ uploading ? `上传中... ${uploadProgress}%` : '点击上传图片' }}
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/jpeg,image/jpg,image/png" 
            style="display: none" 
            @change="onFileChange"
          />
        </div>
      </el-form-item>
      
      <el-form-item label="商品备注">
        <el-input v-model="form.remark" type="textarea" rows="3" placeholder="请输入商品备注" />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="saveGoods" :loading="loading">
          {{ isEdit ? '更新' : '保存' }}
        </el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-actions {
  display: flex;
  gap: 10px;
}

.image-upload-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.image-upload-placeholder:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-icon.is-loading {
  animation: rotating 2s linear infinite;
}

.upload-text {
  color: #8c939d;
  font-size: 14px;
  text-align: center;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
