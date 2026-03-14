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

        <!-- 收支类型：0-全部 1-收入 2-支出 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">收支类型：</span>
          <el-select
            v-model="transactionType"
            style="width: 120px;"
          >
            <el-option label="全部" :value="0" />
            <el-option label="收入" :value="1" />
            <el-option label="支出" :value="2" />
          </el-select>
        </div>

        <!-- 业务类型：0-全部 1小程序 2出库 3入库 4退货 5充值入账 6其他开支 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">业务类型：</span>
          <el-select
            v-model="businessType"
            style="width: 160px;"
          >
            <el-option label="全部" :value="0" />
            <el-option label="小程序" :value="1" />
            <el-option label="出库" :value="2" />
            <el-option label="入库" :value="3" />
            <el-option label="退货" :value="4" />
            <el-option label="充值入账" :value="5" />
            <el-option label="其他开支" :value="6" />
          </el-select>
        </div>

        <!-- 客户筛选：全部传 0 或不传，否则传 user_id -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">客户：</span>
          <el-select
            v-model="selectedCustomerId"
            placeholder="全部"
            style="width: 180px;"
            filterable
            @change="handleCustomerChange"
          >
            <el-option label="全部" :value="0" />
            <el-option
              v-for="c in customerOptions"
              :key="c.user_id"
              :label="`${c.label} (${c.mobile_phone || ''})`"
              :value="c.user_id"
            />
          </el-select>
        </div>

        <!-- 时间范围：仅展示年月日，传参为 start/end 的 int64 时间戳 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">时间：</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 280px;"
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
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="transaction_no" label="流水号" width="160" />
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="user_name" label="用户" width="80" />
        <el-table-column prop="operator_name" label="操作人" width="70" />
        <el-table-column label="收支类型" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.transaction_type === 1 ? 'success' : 'danger'">
              {{ scope.row.transaction_type === 1 ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务类型" width="100">
          <template #default="scope">
            {{ getBusinessTypeLabel(scope.row.business_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110">
          <template #default="scope">
            <span :style="{ color: scope.row.transaction_type === 1 ? '#67c23a' : '#f56c6c' }">
              {{ scope.row.transaction_type === 1 ? '+' : '-' }}¥{{ formatAmountFlexible(scope.row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="100" />
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
import { dateRangeToQueryTimestamps } from '../utils/datetime'

const financeList = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const transactionType = ref(0) // 0-全部 1-收入 2-支出，默认全部
const businessType = ref(0)   // 0-全部 1-6 见 businessTypeLabels，默认全部
const customerOptions = ref([])
const selectedCustomerId = ref(0)  // 0-全部，>0 为 user_id
const businessTypeLabels = {
  1: '小程序',
  2: '出库',
  3: '入库',
  4: '退货',
  5: '充值入账',
  6: '其他开支',
}
function getBusinessTypeLabel(code) {
  if (code == null || code === '') return '-'
  return businessTypeLabels[code] ?? String(code)
}
const dateRange = ref([])

// 初始化默认时间范围（最近 1 个月，仅日期）
function initDefaultDateRange() {
  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(now.getMonth() - 1)
  const startDate = oneMonthAgo.toISOString().slice(0, 10)
  const endDate = now.toISOString().slice(0, 10)
  dateRange.value = [startDate, endDate]
}

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
  selectedCustomerId.value = 0
  loadCustomerOptions()
  currentPage.value = 1
  loadList()
}

// 加载客户列表（与出库单一致）
function loadCustomerOptions() {
  const shopId = isRoot.value ? selectedShopId.value : shopInfo.value?.id
  if (!shopId) {
    customerOptions.value = []
    return
  }
  request.get('/user/list', {
    params: { page: 1, page_size: 100, shop_id: shopId }
  }).then(res => {
    if (res.code === 0) {
      const list = res.data?.list || []
      customerOptions.value = list.map(item => ({
        label: item.admin_display_name || item.name || '未知用户',
        user_id: item.id,
        mobile_phone: item.mobile_phone || ''
      }))
    } else {
      customerOptions.value = []
    }
  }).catch(() => {
    customerOptions.value = []
  })
}

function handleCustomerChange() {
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
  // 全部(0) 不传；收入传 1，支出传 2
  if (transactionType.value === 1 || transactionType.value === 2) {
    params.transaction_type = transactionType.value
  }
  // 全部(0) 不传；1-6 传对应业务类型
  if (businessType.value >= 1 && businessType.value <= 6) {
    params.business_type = businessType.value
  }
  params.user_id = selectedCustomerId.value > 0 ? selectedCustomerId.value : 0
  if (dateRange.value?.length === 2) {
    const ts = dateRangeToQueryTimestamps(dateRange.value[0], dateRange.value[1])
    if (ts.start_time != null) params.start_time = ts.start_time
    if (ts.end_time != null) params.end_time = ts.end_time
  }
  return params
}

function handleSearch() {
  currentPage.value = 1
  loadList()
}

function handleReset() {
  initDefaultDateRange()
  transactionType.value = 0
  businessType.value = 0
  selectedCustomerId.value = 0
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

// 金额：整数不展示小数点，有小数最多保留 2 位
function formatAmountFlexible(val) {
  if (val == null || val === '') return '0'
  const n = Number(val)
  if (Number.isNaN(n)) return String(val)
  return Number(n.toFixed(2)).toString()
}

function formatDateTime(val) {
  if (val == null || val === '') return '-'
  const s = String(val).trim()
  const num = Number(val)
  // Unix 时间戳：10 位为秒，13 位为毫秒
  if (!Number.isNaN(num) && (s.length === 10 || s.length === 13)) {
    const ms = s.length === 10 ? num * 1000 : num
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) {
      const Y = d.getFullYear()
      const M = String(d.getMonth() + 1).padStart(2, '0')
      const D = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      const sec = String(d.getSeconds()).padStart(2, '0')
      return `${Y}-${M}-${D} ${h}:${m}:${sec}`
    }
  }
  if (s.length >= 19) return s.slice(0, 19).replace('T', ' ')
  return s
}

onMounted(() => {
  loadUserInfo()
  initDefaultDateRange()
  selectedCustomerId.value = 0
  loadCustomerOptions()
  loadList()
})
</script>
