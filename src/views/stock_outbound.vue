<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuestionFilled, Plus, Loading } from '@element-plus/icons-vue'
import request from '../api/request'
import { batchOutboundStock, getProductList } from '../api/stock'
import { uploadToOSS, validateFile } from '../utils/ossUpload'

const router = useRouter()

// 批量出库表单
const batchForm = reactive({
  items: [{ 
    product_id: '', 
    quantity: '', 
    unit_price: 0,
    default_price: 0,
    total_price: 0,
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  }],
  customer: null,
  operate_time: new Date().toLocaleString('sv-SE').slice(0, 19), // 默认当前本地日期时间
  remark: '',
  shop_id: null,  // 店铺ID
  image: ''  // 相关图片
})

const goodsOptions = ref([])
const goodsMap = ref({})
const customerOptions = ref([])

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

// 图片上传相关
const fileInput = ref()
const uploading = ref(false)
const uploadProgress = ref(0)

function loadGoodsOptions() {
  getProductList({ page: 1, page_size: 100 }).then(res => {
    if (res.code === 0) {
      const list = res.data.list || []
      goodsOptions.value = list.map(item => ({ 
        label: item.name, 
        value: item.id 
      }))
      goodsMap.value = {}
      list.forEach(item => {
        goodsMap.value[item.id] = item
      })
    }
  })
}

// 加载客户列表
function loadCustomerOptions() {
  const shopId = batchForm.shop_id
  if (!shopId) {
    customerOptions.value = []
    return
  }
  
  request.get('/user/list', { 
    params: { 
      page: 1, 
      page_size: 100, 
      shop_id: shopId 
    } 
  }).then(res => {
    if (res.code === 0) {
      const list = res.data.list || []
      customerOptions.value = list.map(item => ({
        label: item.admin_display_name || item.name || '未知用户',
        value: item.admin_display_name || item.name || '未知用户',
        user_id: item.id
      }))
    } else {
      ElMessage.error(res.message || '获取客户列表失败')
    }
  }).catch(() => {
    ElMessage.error('获取客户列表失败')
  })
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
      // 普通管理员设置默认店铺ID
      if (!isRoot.value) {
        batchForm.shop_id = shopInfo.value.id
      }
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      if (isRoot.value && shopList.value.length > 0) {
        selectedShopId.value = shopList.value[0].id
        // Root用户设置默认店铺ID
        batchForm.shop_id = shopList.value[0].id
      }
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
}

// 获取当前店铺名称
function getCurrentShopName() {
  if (isRoot.value && selectedShopId.value) {
    const selectedShop = shopList.value.find(shop => shop.id === selectedShopId.value)
    return selectedShop ? selectedShop.name : '请选择店铺'
  } else if (!isRoot.value && shopInfo.value) {
    return shopInfo.value.name
  }
  return '未知店铺'
}

// 处理店铺切换
function handleShopChange(shopId) {
  selectedShopId.value = shopId
  batchForm.shop_id = shopId
  // 重新加载客户列表
  loadCustomerOptions()
}

function addBatchItem() {
  batchForm.items.push({ 
    product_id: '', 
    quantity: '', 
    unit_price: 0,
    default_price: 0,
    total_price: 0,
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  })
}

function removeBatchItem(index) {
  if (batchForm.items.length > 1) {
    batchForm.items.splice(index, 1)
  }
}

function onProductChange(item, productId) {
  if (productId) {
    // 调用商品详情接口获取最新信息
    request.get(`/product/${productId}`).then(res => {
      if (res.code === 0 && res.data) {
        const product = res.data.product || res.data
        item.product_name = product.name
        item.unit = product.unit || '个'
        item.specification = product.specification || ''
        item.default_price = product.seller_price || 0
        // 默认展示单价
        item.unit_price = product.seller_price || 0
        item.total_price = 0
      }
    }).catch(() => {
      ElMessage.error('获取商品信息失败')
    })
  } else {
    item.product_name = ''
    item.unit = ''
    item.specification = ''
    item.unit_price = 0
    item.default_price = 0
    item.total_price = 0
  }
}

function calculateItemTotal(item) {
  if (item.quantity && item.unit_price) {
    item.total_price = item.quantity * item.unit_price
  }
}

// 单价输入框获得焦点时，清空默认价格提示
function onPriceFocus(item) {
  if (item.unit_price === 0 && item.default_price > 0) {
    item.unit_price = ''
  }
}

// 单价输入框失去焦点时，如果为空则恢复默认价格提示
function onPriceBlur(item) {
  if (!item.unit_price && item.default_price > 0) {
    item.unit_price = 0
  }
}

const totalAmount = computed(() => {
  return batchForm.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

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
    
    batchForm.image = imageUrl
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

function submitBatchForm() {
  if (!batchForm.customer) {
    ElMessage.error('请选择客户')
    return
  }
  
  const validItems = batchForm.items.filter(item => 
    item.product_id && item.quantity && item.unit_price && item.quantity > 0
  )
  if (validItems.length === 0) {
    ElMessage.error('请至少添加一个商品并填写完整信息')
    return
  }
  
  // 获取选中客户的user_id
  const selectedCustomer = customerOptions.value.find(customer => customer.value === batchForm.customer)
  
  // 转换数据格式，移除页面展示字段
  const items = validItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    remark: item.remark || ''
  }))
  
  const data = {
    items: items,
    total_amount: totalAmount.value,
    user_name: batchForm.customer,
    user_id: selectedCustomer ? selectedCustomer.user_id : null,
    operate_time: batchForm.operate_time.replace(' ', 'T') + '+08:00', // 保持本地时间，添加时区信息
    operator: "我是操作人",
    operator_id: 1001,
    remark: batchForm.remark,
    shop_id: batchForm.shop_id,
    invoice_url: batchForm.image  // 添加单据URL
  }
  
  batchOutboundStock(data).then(() => {
    ElMessage.success('出库成功')
    router.push('/stock/outbound/list')
  }).catch(() => {
    ElMessage.error('出库失败')
  })
}

onMounted(() => {
  loadUserInfo()
  loadGoodsOptions()
  loadCustomerOptions()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<style scoped>
.product-item {
  border: 1px solid #dcdfe6;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: #fafafa;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: end;
}

.item-row.three-columns {
  grid-template-columns: 2fr 1fr 1fr;
}

.item-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group.half-width {
  grid-column: span 1;
}



.form-group label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.el-input:not([style*="flex"]),
.el-select {
  width: 100%;
}

.el-button {
  align-self: end;
}

/* 默认价格提示样式 */
.el-input__inner::placeholder {
  color: #c0c4cc;
  font-style: italic;
}

/* 图片上传样式 */
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

<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">新增出库单</h1>
    </div>
    
    <el-card>
      <el-form label-width="120px" style="max-width: 1200px">
        <!-- 店铺选择 -->
        <el-form-item label="所属店铺" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <!-- Root用户显示店铺选择器 -->
              <el-select
                v-if="isRoot && shopList.length > 0"
                v-model="selectedShopId"
                placeholder="请选择店铺"
                style="flex: 1;"
                @change="handleShopChange"
              >
                <el-option
                  v-for="shop in shopList"
                  :key="shop.id"
                  :label="shop.name"
                  :value="shop.id"
                />
              </el-select>
              <!-- 普通管理员显示固定店铺 -->
              <el-input
                v-else
                :value="getCurrentShopName()"
                disabled
                style="flex: 1;"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="客户" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <el-select v-model="batchForm.customer" placeholder="请选择客户" filterable style="flex: 1;">
                <el-option 
                  v-for="customer in customerOptions" 
                  :key="customer.value" 
                  :label="customer.label" 
                  :value="customer.value" 
                />
              </el-select>
            </div>
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <label style="font-size: 14px; color: #606266; white-space: nowrap;">出库时间</label>
              <el-date-picker
                v-model="batchForm.operate_time"
                type="datetime"
                placeholder="选择出库日期时间"
                style="flex: 1;"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </div>
        </el-form-item>
        
        
        <el-form-item label="商品列表">
          <div v-for="(item, index) in batchForm.items" :key="index" class="product-item">
            <!-- 第一行：名称、规格、单位 -->
            <div class="item-row">
              <div class="form-group">
                <label>名称</label>
                <el-select 
                  v-model="item.product_id" 
                  placeholder="选择商品" 
                  filterable 
                  style="width: 100%"
                  @change="(val) => onProductChange(item, val)"
                >
                  <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </div>
              <div class="form-group">
                <label>规格</label>
                <el-input v-model="item.specification" placeholder="规格" disabled />
              </div>
              <div class="form-group">
                <label>单位</label>
                <el-input v-model="item.unit" placeholder="单位" disabled />
              </div>
            </div>
            
            <!-- 第二行：单价、数量、金额 -->
            <div class="item-row">
              <div class="form-group">
                <label>
                  单价
                  <el-tooltip content="可以使用默认的金额，也可以手动填充" placement="top">
                    <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </label>
                <el-input 
                  v-model.number="item.unit_price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  :placeholder="item.default_price ? `默认: ¥${item.default_price}` : '单价'"
                  @input="calculateItemTotal(item)"
                  @focus="onPriceFocus(item)"
                  @blur="onPriceBlur(item)"
                />
              </div>
              <div class="form-group">
                <label>数量</label>
                <el-input v-model.number="item.quantity" type="number" min="1" placeholder="请输入数量" @input="calculateItemTotal(item)" />
              </div>
              <div class="form-group">
                <label>金额</label>
                <el-input v-model.number="item.total_price" type="number" min="0" step="0.01" placeholder="金额" disabled />
              </div>
            </div>
            
            <!-- 第三行：备注 -->
            <div class="item-row three-columns">
              <div class="form-group">
                <label>备注</label>
                <el-input v-model="item.remark" placeholder="填写备注信息" />
              </div>
              <div class="form-group">
                <label>&nbsp;</label>
                <div style="height: 32px;"></div>
              </div>
              <div class="form-group">
                <el-button type="danger" size="small" @click="removeBatchItem(index)" :disabled="batchForm.items.length === 1">删除商品</el-button>
              </div>
            </div>
          </div>
          
          <el-button type="primary" @click="addBatchItem" style="margin-top: 16px;">添加商品</el-button>
        </el-form-item>
        
        <el-form-item label="总金额">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1;">
              <el-input v-model="totalAmount" readonly style="width: 200px;">
                <template #prepend>¥</template>
              </el-input>
            </div>
            <div style="flex: 5; display: flex; align-items: center; gap: 12px;">
              <label style="font-size: 14px; color: #606266; white-space: nowrap;">其它说明</label>
              <el-input v-model="batchForm.remark" placeholder="整体备注信息" style="flex: 1; width: 100%;" />
            </div>
          </div>
        </el-form-item>
        
        <!-- 图片上传 -->
        <el-form-item label="单据">
          <div class="avatar-uploader" @click="handleImageUpload">
            <img v-if="batchForm.image" :src="batchForm.image" class="avatar" />
            <div v-else class="avatar-uploader-placeholder">
              <el-icon v-if="!uploading" class="avatar-uploader-icon"><Plus /></el-icon>
              <el-icon v-else class="avatar-uploader-icon is-loading"><Loading /></el-icon>
              <div class="upload-text">
                {{ uploading ? `上传中... ${uploadProgress}%` : '请选择相关图片，支持 jpg、png 格式' }}
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
          <el-button type="primary" @click="submitBatchForm" size="large" style="font-size: 20px; padding: 15px 40px; font-weight: bold;">确认</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template> 