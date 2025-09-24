<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail, addProduct, updateProduct } from '../api/stock'
import { uploadGoodsImage } from '../api/oss'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const isEdit = ref(false)

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
  shop_id: null
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  seller_price: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  cost: [{ required: true, message: '请输入成本', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
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
      Object.assign(form, res.data)
    } else {
      ElMessage.error('获取商品详情失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取商品详情失败')
  })
}

function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const fd = new FormData()
  fd.append('file', file)

  uploadGoodsImage(fd).then(res => {
    if (res.code === 0) {
      form.image = res.data
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('图片上传失败')
    }
  }).catch(() => {
    ElMessage.error('图片上传失败')
  })
}

function calculateProductCost() {
  if (form.cost && form.shipping_cost !== undefined) {
    form.product_cost = Number(form.cost) - Number(form.shipping_cost)
  }
}

function saveGoods() {
  formRef.value.validate((valid) => {
    if (!valid) return
    
    loading.value = true
    const submitData = { ...form }
    
    if (isEdit.value) {
      updateProduct(form.id, submitData).then(res => {
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
      <!-- 店铺选择 -->
      <el-row :gutter="20">
        <el-col :span="24">
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
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="category_id">
            <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
              <el-option label="油漆类" :value="1" />
              <el-option label="工具类" :value="2" />
              <el-option label="其他" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="售价" prop="seller_price">
            <el-input v-model.number="form.seller_price" type="number" min="0" step="0.01" placeholder="请输入售价">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="成本" prop="cost">
            <el-input v-model.number="form.cost" type="number" min="0" step="0.01" placeholder="请输入成本" @input="calculateProductCost">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="运费">
            <el-input v-model.number="form.shipping_cost" type="number" min="0" step="0.01" placeholder="请输入运费" @input="calculateProductCost">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品成本">
            <el-input v-model.number="form.product_cost" type="number" min="0" step="0.01" placeholder="自动计算" readonly>
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品规格" prop="specification">
            <el-input v-model="form.specification" placeholder="请输入商品规格" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品单位" prop="unit">
            <el-input v-model="form.unit" placeholder="请输入商品单位" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="商品状态">
        <el-radio-group v-model="form.is_on_shelf">
          <el-radio :label="1">上架</el-radio>
          <el-radio :label="0">下架</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="商品图片">
        <input type="file" @change="handleUpload" accept="image/*" />
        <div v-if="form.image" style="margin-top: 10px;">
          <el-image 
            :src="form.image" 
            style="width: 200px; height: 200px; object-fit: cover; border-radius: 4px;"
            :preview-src-list="[form.image]"
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
