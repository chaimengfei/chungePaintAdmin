<template>
  <div>
    <!-- 筛选面板 -->
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <!-- 店铺筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">店铺：</span>
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
          <el-input
            v-else
            :value="getCurrentShopName()"
            disabled
            style="width: 150px;"
          />
        </div>

        <!-- 收支类型 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">收支类型：</span>
          <el-select
            v-model="transactionType"
            placeholder="全部"
            style="width: 120px;"
            clearable
          >
            <el-option label="收入" :value="1" />
            <el-option label="支出" :value="2" />
          </el-select>
        </div>

        <!-- 业务类型 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">业务类型：</span>
          <el-select
            v-model="businessType"
            placeholder="全部"
            style="width: 120px;"
            clearable
          >
            <el-option v-for="n in 6" :key="n" :label="`类型${n}`" :value="n" />
          </el-select>
        </div>

        <!-- 时间范围 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">时间：</span>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px;"
            clearable
          />
        </div>

        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button
            type="danger"
            @click="handleExport"
            :loading="exportLoading"
            style="background-color: #e8919e; border-color: #d97a8a; color: #fff;"
          >
            导出
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-table :data="financeList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="transaction_no" label="流水号" width="160" />
        <el-table-column prop="order_no" label="订单号" width="140" />
        <el-table-column label="收支类型" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.transaction_type === 1 ? 'success' : 'danger'">
              {{ scope.row.transaction_type === 1 ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="business_type" label="业务类型" width="90" />
        <el-table-column prop="sub_business_type" label="子业务类型" width="100" />
        <el-table-column prop="amount" label="金额" width="110">
          <template #default="scope">
            <span :style="{ color: scope.row.transaction_type === 1 ? '#67c23a' : '#f56c6c' }">
              {{ scope.row.transaction_type === 1 ? '+' : '-' }}¥{{ formatAmount(scope.row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="用户" width="100" />
        <el-table-column prop="operator_name" label="操作人" width="90" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="170">
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
import request from '../api/request'

const financeList = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const transactionType = ref(null) // 1-收入 2-支出
const businessType = ref(null)   // 1-6
const dateRange = ref([])

// 用户权限
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  isRoot.value = !shop || shop === 'null'
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
    } catch (e) {
      console.error(e)
    }
  }
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      if (isRoot.value && shopList.value.length > 0) {
        const saved = localStorage.getItem('selected_shop_id')
        const id = saved ? parseInt(saved, 10) : shopList.value[0].id
        selectedShopId.value = shopList.value.find(s => s.id === id) ? id : shopList.value[0].id
      }
    } catch (e) {
      console.error(e)
    }
  }
}

function getCurrentShopName() {
  if (isRoot.value && selectedShopId.value) {
    const s = shopList.value.find(shop => shop.id === selectedShopId.value)
    return s ? s.name : '请选择店铺'
  }
  if (!isRoot.value && shopInfo.value) return shopInfo.value.name
  return '未知店铺'
}

function handleShopChange(shopId) {
  selectedShopId.value = shopId
  if (isRoot.value) localStorage.setItem('selected_shop_id', String(shopId))
  currentPage.value = 1
  loadList()
}

function buildParams(forExport = false) {
  const params = {}
  if (!forExport) {
    params.page = currentPage.value
    params.page_size = pageSize.value
  }
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  }
  if (transactionType.value != null && transactionType.value !== '') {
    params.transaction_type = transactionType.value
  }
  if (businessType.value != null && businessType.value !== '') {
    params.business_type = businessType.value
  }
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_time = dateRange.value[0]
    params.end_time = dateRange.value[1]
  }
  return params
}

function handleSearch() {
  currentPage.value = 1
  loadList()
}

function handleReset() {
  dateRange.value = []
  transactionType.value = null
  businessType.value = null
  currentPage.value = 1
  loadList()
}

function handleExport() {
  const params = buildParams(true)
  exportLoading.value = true
  request.get('/finance/export', { params })
    .then((res) => {
      if (res.code === 0 && res.data && res.data.url) {
        window.open(res.data.url, '_blank')
        ElMessage.success('导出成功，请查看下载')
      } else {
        ElMessage.error(res.message || '导出失败')
      }
    })
    .catch((err) => {
      ElMessage.error(err?.message || '导出失败')
    })
    .finally(() => {
      exportLoading.value = false
    })
}

function loadList() {
  loading.value = true
  const params = buildParams(false)
  request.get('/finance/list', { params })
    .then((res) => {
      if (res.code === 0) {
        financeList.value = res.data.list || []
        total.value = res.data.total || 0
      } else {
        ElMessage.error(res.message || '获取财务流水失败')
      }
    })
    .catch(() => {
      ElMessage.error('网络错误，请稍后重试')
    })
    .finally(() => {
      loading.value = false
    })
}

function handleSizeChange() {
  currentPage.value = 1
  loadList()
}

function handleCurrentChange() {
  loadList()
}

function formatAmount(val) {
  if (val == null || val === '') return '0.00'
  const n = Number(val)
  return isNaN(n) ? '0.00' : n.toFixed(2)
}

function formatDateTime(val) {
  if (!val) return '-'
  const s = String(val)
  if (s.length >= 19) return s.slice(0, 19).replace('T', ' ')
  return s
}

onMounted(() => {
  loadUserInfo()
  loadList()
})
</script>
