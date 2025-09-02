<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h2>添加商品</h2>
    </div>
    
    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" style="max-width: 800px;">
        <!-- 第一行：名称、单位 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择单位" style="width: 100%;">
                <el-option label="桶" value="桶" />
                <el-option label="箱" value="箱" />
                <el-option label="L" value="L" />
                <el-option label="卷" value="卷" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第二行：分类、规格 -->
        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="规格" prop="specification">
              <template #label>
                <span>规格</span>
                <el-tooltip content="3KG*4、4L、8L等" placement="top">
                  <el-icon style="margin-left: 4px; cursor: pointer;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="form.specification" placeholder="可不填" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第三行：售价、状态 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售价" prop="seller_price">
              <el-input-number 
                v-model="form.seller_price" 
                :precision="2" 
                :min="0" 
                :step="0.01" 
                placeholder="请输入售价"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="is_on_shelf">
              <el-radio-group v-model="form.is_on_shelf">
                <el-radio :label="1">上架</el-radio>
                <el-radio :label="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第四行：图片 -->
        <el-form-item label="图片" prop="image">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            :headers="uploadHeaders"
          >
            <img v-if="form.image" :src="form.image" class="avatar" />
            <div v-else class="avatar-uploader-placeholder">
              <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
              <div class="upload-text">请选择本地图片，支持 jpg、png 格式</div>
            </div>
          </el-upload>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存商品</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, QuestionFilled } from '@element-plus/icons-vue'
import { getCategoryList } from '../api/category'
import { addProduct } from '../api/stock'

const router = useRouter()
const categories = ref([])
const submitLoading = ref(false)
const formRef = ref()

const form = reactive({
  name: '',
  category_id: '',
  unit: '',
  specification: '',
  seller_price: 0,
  remark: '',
  image: '',
  is_on_shelf: 1
})

const rules = {
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
  seller_price: [
    { required: true, message: '请输入售价', trigger: 'blur' }
  ],
  is_on_shelf: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  image: [
    { required: true, message: '请选择图片', trigger: 'change' }
  ]
}

// 上传相关配置
const uploadUrl = '/api/admin/upload' // 根据实际的上传接口调整
const uploadHeaders = {
  // 如果需要认证token，在这里添加
}

// 加载分类列表
function loadCategories() {
  getCategoryList().then(res => {
    if (res.code === 0) {
      categories.value = res.data || []
    }
  }).catch(() => {
    ElMessage.error('获取分类列表失败')
  })
}

// 图片上传成功
function handleImageSuccess(res) {
  if (res.code === 0) {
    form.image = res.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败')
  }
}

// 图片上传前验证
function beforeImageUpload(file) {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('上传图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      submitLoading.value = true
      addProduct(form).then(res => {
        if (res.code === 0) {
          ElMessage.success('商品添加成功')
          router.push('/goods')
        } else {
          ElMessage.error(res.message || '商品添加失败')
        }
        submitLoading.value = false
      }).catch(() => {
        ElMessage.error('商品添加失败')
        submitLoading.value = false
      })
    }
  })
}

// 取消
function handleCancel() {
  router.push('/goods')
}

onMounted(() => {
  loadCategories()
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
