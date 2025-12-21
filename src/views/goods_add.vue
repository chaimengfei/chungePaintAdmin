<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">添加商品</h1>
    </div>
    
    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" style="max-width: 800px;">
        <!-- 第一行：店铺选择、分类 -->
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
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%;">
                <el-option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :label="category.name" 
                  :value="category.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第二行：名称、单位、规格 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择单位" style="width: 100%;">
                <el-option label="桶" value="桶" />
                <el-option label="箱" value="箱" />
                <el-option label="L" value="L" />
                <el-option label="卷" value="卷" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="规格" prop="specification" label-width="80px">
              <template #label>
                <span style="margin-left: -20px;">规格</span>
                <el-tooltip content="3KG*4、4L、8L等" placement="top">
                  <el-icon style="margin-left: 4px; cursor: pointer; font-size: 12px;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="form.specification" placeholder="可不填" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第三行：进价、运费、成本 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="进价" prop="product_cost">
              <el-input-number 
                v-model="form.product_cost" 
                :min="0" 
                :step="1"
                placeholder="请输入进价"
                style="width: 100%;"
                @change="calculateTotalCost"
                @input="calculateTotalCost"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="运费" prop="shipping_cost">
              <el-input-number 
                v-model="form.shipping_cost" 
                :min="0" 
                :step="1"
                placeholder="请输入运费"
                style="width: 100%;"
                @change="calculateTotalCost"
                @input="calculateTotalCost"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="成本" prop="cost">
              <template #label>
                <span>成本</span>
                <el-tooltip content="成本=进价+运费" placement="top">
                  <el-icon style="margin-left: 4px; cursor: pointer; font-size: 12px;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="form.cost" 
                :min="0" 
                :step="1"
                placeholder="自动计算"
                style="width: 100%;"
                readonly
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第四行：售价、库存 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售价" prop="seller_price">
              <el-input-number 
                v-model="form.seller_price" 
                :min="0" 
                :step="0.01"
                :precision="2"
                placeholder="请输入售价"
                style="width: 100%;"
              />
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
        
        <!-- 第五行：状态 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="is_on_shelf">
              <el-radio-group v-model="form.is_on_shelf">
                <el-radio :label="1">上架</el-radio>
                <el-radio :label="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第六行：图片 -->
        <el-form-item label="图片" prop="image">
          <div class="avatar-uploader" @click="handleImageUpload">
            <img v-if="form.image" :src="form.image" class="avatar" />
            <div v-else class="avatar-uploader-placeholder">
              <el-icon v-if="!uploading" class="avatar-uploader-icon"><Plus /></el-icon>
              <el-icon v-else class="avatar-uploader-icon is-loading"><Loading /></el-icon>
              <div class="upload-text">
                {{ uploading ? `上传中... ${uploadProgress}%` : '请选择本地图片，支持 jpg、png 格式' }}
              </div>
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/jpeg,image/jpg,image/png" 
            style="display: none" 
            @change="onFileChange"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存商品</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.avatar-uploader {
  width: 200px;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-uploader-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.avatar-uploader-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.avatar-uploader-icon.is-loading {
  animation: rotating 2s linear infinite;
}

.upload-text {
  font-size: 14px;
  text-align: center;
  line-height: 1.4;
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

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, QuestionFilled, Loading } from '@element-plus/icons-vue'
import { getCategoryList } from '../api/category'
import { addProduct } from '../api/order'
import { uploadToOSS, validateFile } from '../utils/ossUpload'

const router = useRouter()
const categories = ref([])
const submitLoading = ref(false)
const formRef = ref()
const fileInput = ref()
const uploading = ref(false)
const uploadProgress = ref(0)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

const form = reactive({
  name: '',
  category_id: '',
  unit: '',
  specification: '',
  product_cost: 0,
  shipping_cost: 0,
  cost: 0,
  seller_price: 0,
  stock: 0,
  remark: '',
  image: '',
  is_on_shelf: 1,
  shop_id: null
})

const rules = {
  shop_id: [
    { required: true, message: '请选择店铺', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ],
  specification: [
    // 规格为可选字段，不需要必填验证
  ],
  product_cost: [
    { required: true, message: '请输入进价', trigger: 'blur' }
  ],
  shipping_cost: [
    { required: true, message: '请输入运费', trigger: 'blur' }
  ],
  seller_price: [
    { required: true, message: '请输入售价', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' }
  ],
  is_on_shelf: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  image: [
    { required: true, message: '请选择图片', trigger: 'change' }
  ]
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

// 计算总成本
function calculateTotalCost() {
  nextTick(() => {
    const productCost = Number(form.product_cost) || 0
    const shippingCost = Number(form.shipping_cost) || 0
    const totalCost = productCost + shippingCost
    form.cost = Math.round(totalCost) // 返回整数
  })
}

// 加载分类列表
function loadCategories() {
  getCategoryList().then(res => {
    if (res.code === 0) {
      categories.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取分类列表失败')
    }
  }).catch((error) => {
    console.log('网络错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  })
}


// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      submitLoading.value = true
      addProduct(form).then(res => {
        console.log('API响应:', res) // 添加调试信息
        if (res.code === 0) {
          ElMessage.success('商品添加成功')
          router.push('/goods')
        } else {
          console.log('错误信息:', res.message) // 添加调试信息
          ElMessage.error(res.message || '商品添加失败')
        }
        submitLoading.value = false
      }).catch((error) => {
        console.log('网络错误:', error) // 添加调试信息
        ElMessage.error('网络错误，请稍后重试')
        submitLoading.value = false
      })
    }
  })
}

// 取消
function handleCancel() {
  router.push('/goods')
}

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  // 判断是否为root用户
  isRoot.value = !shop || shop === 'null'
  
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
      form.shop_id = shopInfo.value.id
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      if (isRoot.value && shopList.value.length > 0) {
        form.shop_id = shopList.value[0].id
      }
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
}

onMounted(() => {
  loadUserInfo()
  loadCategories()
  calculateTotalCost() // 初始化时计算一次成本
})
</script>

<style scoped>
.avatar-uploader {
  text-align: center;
}

.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.avatar-uploader-placeholder {
  width: 178px;
  height: 178px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.upload-text {
  font-size: 14px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
