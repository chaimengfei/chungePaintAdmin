<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import request from '../api/request'
import { batchInboundStock, getProductList, getSupplierList } from '../api/stock'

const router = useRouter()

// 批量入库表单
const batchForm = reactive({
  items: [{ 
    product_id: '', 
    cost_per_unit: 0,  // 进价
    quantity: '', 
    goods_total_amount: 0,  // 货物总金额
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  }],
  supplier_id: '',  // 供应商ID
  operate_time: new Date().toLocaleString('sv-SE').slice(0, 19), // 默认当前本地日期时间
  remark: '',
  shop_id: null  // 店铺ID
})

const goodsOptions = ref([])
const goodsMap = ref({})
const supplierOptions = ref([])
const supplierMap = ref({})

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

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

function loadSupplierOptions() {
  getSupplierList().then(res => {
    if (res.code === 0) {
      const list = res.data || []
      supplierOptions.value = list.map(item => ({ 
        label: item.name, 
        value: item.id 
      }))
      supplierMap.value = {}
      list.forEach(item => {
        supplierMap.value[item.id] = item
      })
    }
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
}

function addBatchItem() {
  batchForm.items.push({ 
    product_id: '', 
    cost_per_unit: 0,  // 进价
    quantity: '', 
    goods_total_amount: 0,  // 货物总金额
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
        const product = res.data
        item.product_name = product.name
        item.unit = product.unit || '个'
        item.specification = product.specification || ''
        // 清空金额字段，等待用户输入进价和数量后自动计算
        item.goods_total_amount = 0
        // 进价现在由用户手动输入，不清空
      }
    }).catch(() => {
      ElMessage.error('获取商品信息失败')
    })
  } else {
    item.product_name = ''
    item.unit = ''
    item.specification = ''
    item.goods_total_amount = 0
    // 进价现在由用户手动输入，不清空
  }
}

// 计算成本相关字段
function calculateCosts(item) {
  if (item.cost_per_unit && item.quantity && item.quantity > 0) {
    // 计算金额 = 进价 × 数量
    item.goods_total_amount = item.cost_per_unit * item.quantity
  } else {
    item.goods_total_amount = 0
  }
}

// 计算总金额
const totalSpent = computed(() => {
  return batchForm.items.reduce((sum, item) => sum + (item.goods_total_amount || 0), 0)
})


function submitBatchForm() {
  const validItems = batchForm.items.filter(item => 
    item.product_id && item.quantity && item.goods_total_amount && item.quantity > 0
  )
  if (validItems.length === 0) {
    ElMessage.error('请至少添加一个商品并填写完整信息')
    return
  }
  
  if (!batchForm.supplier_id) {
    ElMessage.error('请选择供货商')
    return
  }
  
  // 为每个商品计算成本
  validItems.forEach(item => {
    calculateCosts(item)
  })
  
  // 获取供货商名称
  const supplier = supplierMap.value[batchForm.supplier_id]
  if (!supplier) {
    ElMessage.error('供货商信息获取失败')
    return
  }
  
  // 转换数据格式以匹配新接口
  const items = validItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    product_cost: item.cost_per_unit,
    total_price: item.goods_total_amount,
    remark: item.remark || ''
  }))
  
  const data = {
    items: items,
    total_amount: totalSpent.value,
    operator: "张三",
    operator_id: 1001,
    supplier: supplier.name,
    remark: batchForm.remark || '',
    shop_id: batchForm.shop_id
  }
  
  batchInboundStock(data).then(() => {
    ElMessage.success('入库成功')
    router.push('/stock/inbound/list')
  }).catch(() => {
    ElMessage.error('入库失败')
  })
}

onMounted(() => {
  loadUserInfo()
  loadGoodsOptions()
  loadSupplierOptions()
  
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
</style>

<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">新增入库单</h1>
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
        
        <el-form-item label="供货商" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <el-select
                v-model="batchForm.supplier_id"
                placeholder="选择供货商"
                filterable
                style="flex: 1;"
              >
                <el-option v-for="opt in supplierOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <label style="font-size: 14px; color: #606266; white-space: nowrap; min-width: 80px;">入库时间</label>
              <el-date-picker
                v-model="batchForm.operate_time"
                type="datetime"
                placeholder="选择入库日期时间"
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
                <el-input v-model="item.specification" placeholder="规格" readonly />
              </div>
              <div class="form-group">
                <label>单位</label>
                <el-input v-model="item.unit" placeholder="单位" readonly />
              </div>
            </div>
            
            <!-- 第二行：进价、数量、金额 -->
            <div class="item-row">
              <div class="form-group">
                <label>进价</label>
                <el-input v-model.number="item.cost_per_unit" type="number" min="0" step="0.01" placeholder="请输入进价" @input="calculateCosts(item)" />
              </div>
              <div class="form-group">
                <label>数量</label>
                <el-input v-model.number="item.quantity" type="number" min="1" placeholder="请输入数量" @input="calculateCosts(item)" />
              </div>
              <div class="form-group">
                <label>金额</label>
                <el-input v-model.number="item.goods_total_amount" type="number" min="0" step="0.01" placeholder="自动计算" readonly />
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
              <el-input v-model="totalSpent" readonly style="width: 200px;">
                <template #prepend>¥</template>
              </el-input>
            </div>
            <div style="flex: 5; display: flex; align-items: center; gap: 12px;">
              <label style="font-size: 14px; color: #606266; white-space: nowrap;">其它说明</label>
              <el-input v-model="batchForm.remark" placeholder="整体备注信息" style="flex: 1; width: 100%;" />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitBatchForm" size="large" style="font-size: 20px; padding: 15px 40px; font-weight: bold;">确认</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>