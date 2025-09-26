<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProductList, deleteProduct } from '../api/stock'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()
const goods = ref([])
const loading = ref(false)
const total = ref(0)
const query = reactive({
  page: 1,
  page_size: 10,
  shop_id: null,
  name: '' // 商品名称搜索
})

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

// 筛选相关
const showFilters = ref(false)

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  // 判断是否为root用户
  isRoot.value = !shop || shop === 'null'
  
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
      query.shop_id = shopInfo.value.id
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      if (isRoot.value && shopList.value.length > 0) {
        selectedShopId.value = shopList.value[0].id
        query.shop_id = selectedShopId.value
      }
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
}

function loadGoods() {
  loading.value = true
  getProductList(query).then(res => {
    if (res.code === 0) {
      goods.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error('获取商品列表失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取商品列表失败')
  })
}

// 处理店铺切换
function handleShopChange(shopId) {
  selectedShopId.value = shopId
  query.shop_id = shopId
  query.page = 1 // 重置到第一页
  loadGoods()
}


// 搜索商品
function searchGoods() {
  query.page = 1
  loadGoods()
}

// 重置筛选
function resetFilters() {
  query.name = ''
  query.page = 1
  loadGoods()
}

// 切换筛选面板显示
function toggleFilters() {
  showFilters.value = !showFilters.value
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

function editGoods(row) {
  router.push(`/goods/edit?id=${row.id}`)
}

function viewGoods(row) {
  router.push(`/goods/detail?id=${row.id}`)
}

function deleteGoods(row) {
  ElMessageBox.confirm(
    `确定要删除商品"${row.name}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteProduct(row.id).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        loadGoods()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch(() => {
      ElMessage.error('删除失败')
    })
  })
}

function handlePageChange(page) {
  query.page = page
  loadGoods()
}

function addGoods() {
  router.push('/goods/add')
}

onMounted(() => {
  loadUserInfo()
  loadGoods()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>商品列表</h2>
      <div style="display: flex; align-items: center; gap: 16px;">
        <el-button 
          type="warning" 
          size="large" 
          class="add-goods-btn"
          @click="addGoods"
        >
          添加商品
        </el-button>
      </div>
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
        
        <!-- 商品名称搜索 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">名称：</span>
          <el-input
            v-model="query.name"
            placeholder="请输入商品名称"
            style="width: 200px;"
            clearable
            @keyup.enter="searchGoods"
          />
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="searchGoods">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>
    
    <el-table :data="goods" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column label="名称" min-width="200">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 12px;">
            <el-image 
              v-if="row.image" 
              :src="row.image" 
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
              :preview-src-list="[row.image]"
            />
            <div v-else style="width: 50px; height: 50px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 4px; font-size: 12px;">
              无图
            </div>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="specification" label="规格" width="80" />
      <el-table-column label="库存" width="120" sortable prop="stock">
        <template #header>
          <span>库存</span>
          <el-tooltip content="入库、出库等均会更新库存" placement="top">
            <el-icon style="margin-left: 4px; cursor: pointer;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
        <template #default="{ row }">
          <span style="color: #f56c6c;">{{ row.stock }}</span>
        </template>
      </el-table-column>
      <el-table-column label="售价" width="120">
        <template #header>
          <span>售价</span>
          <el-tooltip content="售价会展示在小程序" placement="top">
            <el-icon style="margin-left: 4px; cursor: pointer;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
        <template #default="{ row }">
          {{ row.seller_price }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_on_shelf ? 'success' : 'info'">
            {{ row.is_on_shelf ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进价 (货物成本+运费成本)" width="220" sortable prop="cost">
        <template #default="{ row }">
          {{ row.cost }} ({{ row.product_cost }} + {{ row.shipping_cost }})
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="default" style="padding: 8px 16px; font-size: 14px;" @click="viewGoods(row)">查看</el-button>
          <el-button size="default" type="primary" style="padding: 8px 16px; font-size: 14px;" @click="editGoods(row)">编辑</el-button>
          <el-button size="default" type="danger" style="padding: 8px 16px; font-size: 14px;" @click="deleteGoods(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.page_size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.add-goods-btn {
  font-size: 27px !important;
  padding: 22px 45px !important;
  font-weight: bold !important;
  background-color: #e55a2b !important;
  border-color: #e55a2b !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3) !important;
  transition: all 0.3s ease !important;
}

.add-goods-btn:hover {
  background-color: #d44a1f !important;
  border-color: #d44a1f !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4) !important;
}

.add-goods-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3) !important;
}
</style>
