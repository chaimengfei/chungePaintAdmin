<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProductList, deleteProduct, batchCopyProduct } from '../api/order'
import { getCategoryList } from '../api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, Plus } from '@element-plus/icons-vue'
import { getCurrentShopId } from '../utils/shop'

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

// 批量复制相关
const selectedProducts = ref([]) // 选中的商品
const copyDialogVisible = ref(false)
const copySubmitting = ref(false)
const targetShopId = ref(null)

// 分类相关
const categoryMap = ref({}) // 分类ID到分类名称的映射

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
        // 优先使用右上角选择的店铺ID
        const currentShopId = getCurrentShopId()
        if (currentShopId) {
          selectedShopId.value = currentShopId
          query.shop_id = currentShopId
        } else {
          // 如果没有，使用第一个店铺
          selectedShopId.value = shopList.value[0].id
          query.shop_id = selectedShopId.value
        }
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

// 加载分类列表
function loadCategories() {
  getCategoryList().then(res => {
    if (res.code === 0) {
      const categories = res.data || []
      // 构建分类ID到名称的映射
      const map = {}
      categories.forEach(category => {
        map[category.id] = category.name
      })
      categoryMap.value = map
    }
  }).catch(() => {
    console.error('获取分类列表失败')
  })
}

// 获取分类名称
function getCategoryName(categoryId) {
  if (!categoryId) return '-'
  return categoryMap.value[categoryId] || '-'
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

// 处理表格选择变化
function handleSelectionChange(selection) {
  selectedProducts.value = selection
}

// 显示批量复制弹窗
function showBatchCopyDialog() {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请先选择要复制的商品')
    return
  }
  
  if (selectedProducts.value.length > 10) {
    ElMessage.warning('每次最多只能复制10个商品')
    return
  }
  
  if (!selectedShopId.value) {
    ElMessage.warning('请先选择源店铺')
    return
  }
  
  // 过滤掉当前店铺，只显示其他店铺作为目标
  const availableShops = shopList.value.filter(shop => shop.id !== selectedShopId.value)
  if (availableShops.length === 0) {
    ElMessage.warning('没有可用的目标店铺')
    return
  }
  
  targetShopId.value = availableShops[0].id
  copyDialogVisible.value = true
}

// 提交批量复制
function submitBatchCopy() {
  if (!targetShopId.value) {
    ElMessage.warning('请选择目标店铺')
    return
  }
  
  if (targetShopId.value === selectedShopId.value) {
    ElMessage.warning('源店铺和目标店铺不能相同')
    return
  }
  
  copySubmitting.value = true
  
  const productIds = selectedProducts.value.map(item => item.id)
  
  batchCopyProduct({
    source_shop_id: selectedShopId.value,
    target_shop_id: targetShopId.value,
    product_ids: productIds
  }).then(res => {
    if (res.code === 0) {
      const data = res.data
      const message = res.message || `复制成功 ${data.success_count} 个，未复制成功 ${data.failed_count} 个`
      
      if (data.failed_count > 0 && data.failed_items && data.failed_items.length > 0) {
        // 有失败项，显示详细信息
        const failedItemsText = data.failed_items.join('\n')
        ElMessageBox.alert(
          `${message}\n\n失败详情：\n${failedItemsText}`,
          '复制结果',
          {
            confirmButtonText: '确定',
            type: data.success_count > 0 ? 'warning' : 'error'
          }
        )
      } else {
        // 全部成功
        ElMessage.success(message)
      }
      
      copyDialogVisible.value = false
      selectedProducts.value = [] // 清空选择
      loadGoods() // 刷新列表
    } else {
      ElMessage.error(res.message || '复制失败')
    }
  }).catch((error) => {
    console.log('批量复制错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }).finally(() => {
    copySubmitting.value = false
  })
}

onMounted(() => {
  loadUserInfo()
  loadCategories() // 加载分类列表
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
          v-if="isRoot && selectedProducts.length > 0"
          type="success" 
          @click="showBatchCopyDialog" 
          style="font-size: 16px; padding: 12px 24px; font-weight: bold; height: auto;"
        >
          批量复制 ({{ selectedProducts.length }})
        </el-button>
        <el-button 
          type="warning" 
          @click="addGoods" 
          style="font-size: 20px; padding: 16px 32px; font-weight: bold; height: auto;"
        >
          <el-icon style="margin-right: 10px; font-size: 22px;"><Plus /></el-icon>
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
    
    <el-table 
      :data="goods" 
      style="width: 100%" 
      v-loading="loading" 
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column 
        v-if="isRoot"
        type="selection" 
        width="55" 
        :selectable="() => true"
      />
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
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          {{ getCategoryName(row.category_id) }}
        </template>
      </el-table-column>
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

    <!-- 批量复制弹窗 -->
    <el-dialog
      v-model="copyDialogVisible"
      title="批量复制商品"
      width="500px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px;">
        <p style="color: #606266; margin-bottom: 10px;">已选择 <strong>{{ selectedProducts.length }}</strong> 个商品</p>
        <div style="max-height: 150px; overflow-y: auto; border: 1px solid #e4e7ed; border-radius: 4px; padding: 10px;">
          <div 
            v-for="product in selectedProducts" 
            :key="product.id"
            style="padding: 5px 0; border-bottom: 1px solid #f0f0f0;"
          >
            {{ product.name }} (ID: {{ product.id }})
          </div>
        </div>
      </div>
      
      <el-form label-width="100px">
        <el-form-item label="源店铺">
          <el-input 
            :value="getCurrentShopName()" 
            disabled 
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="目标店铺" required>
          <el-select 
            v-model="targetShopId" 
            placeholder="请选择目标店铺" 
            style="width: 100%;"
          >
            <el-option
              v-for="shop in shopList.filter(s => s.id !== selectedShopId)"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <div style="margin-top: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px;">
        <p style="margin: 0; color: #909399; font-size: 12px;">
          <strong>提示：</strong>每次最多只能复制10个商品。如果目标店铺中已存在相同商品，将跳过该商品。
        </p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchCopy" :loading="copySubmitting">
            确定复制
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
</style>
