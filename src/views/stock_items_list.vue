<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">库存明细</h1>
    </div>
    
    <!-- 筛选面板 -->
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <!-- 店铺筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">店铺：</span>
          <!-- Root用户显示店铺选择器 -->
          <el-select
            v-if="isRoot && shopList.length > 0"
            v-model="selectedShopId"
            placeholder="请选择店铺"
            style="width: 150px;"
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
            style="width: 150px;"
          />
        </div>
        
        <!-- 商品筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">商品：</span>
          <el-select
            v-model="selectedProductId"
            placeholder="请选择商品"
            style="width: 200px;"
            filterable
            clearable
            @change="handleProductChange"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="`${product.name}${product.specification ? `(${product.specification})` : ''}`"
              :value="product.id"
            />
          </el-select>
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>
    
    <el-card>
      <el-table :data="stockItemsList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="product_name" label="商品名称" min-width="200">
          <template #default="scope">
            <div>
              <div style="font-weight: 500; color: #303133;">{{ scope.row.product_name }}</div>
              <div v-if="scope.row.specification" style="font-size: 12px; color: #909399;">规格: {{ scope.row.specification }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="scope">
            <span :style="{ color: getQuantityChange(scope.row) > 0 ? '#67c23a' : '#f56c6c' }">
              {{ getQuantityChange(scope.row) > 0 ? '+' : '' }}{{ getQuantityChange(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="库存变化" width="150">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #909399;">{{ scope.row.before_stock }}</span>
              <el-icon><ArrowRight /></el-icon>
              <span :style="{ color: scope.row.after_stock >= scope.row.before_stock ? '#67c23a' : '#f56c6c' }">
                {{ scope.row.after_stock }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单号" width="180">
          <template #default="scope">
            <span v-if="scope.row.order_no">{{ scope.row.order_no }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120">
          <template #default="scope">
            <span v-if="scope.row.operator_name">{{ scope.row.operator_name }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="scope">
            <span v-if="scope.row.remark">{{ scope.row.remark }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { getStockItemsList } from '../api/stock'
import { getProductList } from '../api/stock'

const stockItemsList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

// 商品相关
const productList = ref([])
const selectedProductId = ref(null)

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
      if (isRoot.value && shopList.value.length > 0) {
        selectedShopId.value = shopList.value[0].id
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
  currentPage.value = 1 // 重置到第一页
  loadStockItemsList()
}

// 处理商品切换
function handleProductChange(productId) {
  selectedProductId.value = productId
  currentPage.value = 1 // 重置到第一页
  loadStockItemsList()
}

// 查询按钮处理
function handleSearch() {
  currentPage.value = 1 // 重置到第一页
  loadStockItemsList()
}

// 重置按钮处理
function handleReset() {
  selectedProductId.value = null
  currentPage.value = 1
  loadStockItemsList()
}

// 加载商品列表
function loadProductList() {
  const params = {
    page: 1,
    page_size: 1000, // 获取所有商品用于筛选
    only_name: true
  }
  
  // 添加店铺ID参数
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  getProductList(params).then(res => {
    if (res.code === 0) {
      productList.value = res.data.list || []
    } else {
      ElMessage.error(res.message || '获取商品列表失败')
    }
  }).catch((error) => {
    console.log('获取商品列表错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  })
}

// 加载库存操作日志列表
function loadStockItemsList() {
  loading.value = true
  
  // 构建请求参数
  const params = {
    page: currentPage.value,
    page_size: pageSize.value
  }
  
  // 添加店铺ID参数
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  // 添加商品ID参数
  if (selectedProductId.value) {
    params.product_id = selectedProductId.value
  }
  
  getStockItemsList(params).then(res => {
    if (res.code === 0) {
      stockItemsList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取库存操作日志失败')
    }
  }).catch((error) => {
    console.log('网络错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }).finally(() => {
    loading.value = false
  })
}

// 计算数量变化（根据库存变化方向）
function getQuantityChange(row) {
  const beforeStock = row.before_stock || 0
  const afterStock = row.after_stock || 0
  return afterStock - beforeStock
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 分页处理
function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadStockItemsList()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadStockItemsList()
}

onMounted(() => {
  loadUserInfo()
  loadProductList()
  loadStockItemsList()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<style scoped>
.el-table {
  margin-top: 20px;
}
</style>
