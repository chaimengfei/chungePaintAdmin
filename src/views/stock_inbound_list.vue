<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">入库-列表</h1>
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
      </div>
    </el-card>
    
    <el-card>
      <el-table :data="inboundList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="operation_no" label="入库单号" width="200" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="入库类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.outbound_type === 1 ? 'success' : 'primary'">
              {{ scope.row.outbound_type === 1 ? '小程序' : '后台' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="100">
          <template #default="scope">
            <span style="color: #67c23a;">{{ scope.row.total_quantity || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.total_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入库时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="商品详情" min-width="300">
          <template #default="scope">
            <div v-if="scope.row.items && scope.row.items.length > 0" style="border: 1px solid #e4e7ed; border-radius: 4px; padding: 8px; background-color: #fafafa;">
              <div v-for="(item, index) in scope.row.items" :key="index" style="margin-bottom: 8px; font-size: 12px; line-height: 1.4;">
                <div style="font-weight: 500; color: #303133; margin-bottom: 4px;">{{ item.product_name }}{{ item.specification ? `(${item.specification})` : '' }}</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>数量:{{ item.quantity }} &nbsp;&nbsp; <span style="color: #67c23a;">库存:{{ item.before_stock }}→{{ item.after_stock }}</span></span>
                </div>
                <div v-if="index < scope.row.items.length - 1" style="border-top: 1px solid #e4e7ed; margin-top: 8px; padding-top: 8px;"></div>
              </div>
            </div>
            <div v-else style="color: #909399; font-size: 12px;">暂无商品明细</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request'

const inboundList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

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
  loadInboundList()
}

// 加载入库列表
function loadInboundList() {
  loading.value = true
  
  // 构建请求参数
  const params = {
    types: 1,
    page: currentPage.value,
    page_size: pageSize.value
  }
  
  // 添加店铺ID参数
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  request.get('/stock/operations', { params }).then(res => {
    if (res.code === 0) {
      inboundList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取入库列表失败')
    }
  }).catch((error) => {
    console.log('网络错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }).finally(() => {
    loading.value = false
  })
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


// 查看详情
function viewDetail(row) {
  // 创建详情对话框
  const detailHtml = `
    <div style="max-width: 800px;">
      <h3 style="margin-bottom: 20px; color: #303133;">入库单详情</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div><strong>入库单号：</strong>${row.operation_no}</div>
        <div><strong>操作人：</strong>${row.operator || '无'}</div>
        <div><strong>入库时间：</strong>${formatDateTime(row.created_at)}</div>
        <div><strong>总数量：</strong>${row.total_quantity || 0}</div>
        <div><strong>总金额：</strong>¥${row.total_amount?.toFixed(2) || '0.00'}</div>
        <div><strong>入库类型：</strong>${row.outbound_type === 1 ? '小程序' : '后台'}</div>
      </div>
      ${row.remark ? `<div style="margin-bottom: 20px;"><strong>备注：</strong>${row.remark}</div>` : ''}
      <div>
        <h4 style="margin-bottom: 10px; color: #606266;">商品明细：</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e4e7ed;">
          <thead>
            <tr style="background-color: #f5f7fa;">
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: left;">商品名称</th>
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: left;">规格</th>
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: center;">数量</th>
            </tr>
          </thead>
          <tbody>
            ${row.items?.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e4e7ed;">${item.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed;">${item.specification || '无'}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed; text-align: center;">${item.quantity}</td>
              </tr>
            `).join('') || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #909399;">暂无商品明细</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `
  
  ElMessageBox.alert(detailHtml, '入库单详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭',
    customClass: 'detail-dialog'
  })
}

// 分页处理
function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadInboundList()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadInboundList()
}

onMounted(() => {
  loadUserInfo()
  loadInboundList()
  
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