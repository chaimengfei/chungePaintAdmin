<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <!-- 店铺筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">店铺：</span>
          <el-select
            v-if="isRoot && shopList.length > 0"
            v-model="query.shop_id"
            placeholder="全部店铺"
            style="width: 150px;"
            clearable
            @change="handleQuery"
          >
            <el-option label="全部店铺" :value="0" />
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
        
        <!-- 日期范围选择 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">日期范围：</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 300px;"
            @change="handleDateChange"
          />
        </div>
        
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 图表区域 -->
    <div v-loading="loading">
      <!-- 1. 收入支出汇总 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">收入支出汇总</h3>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- 总收入 -->
          <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
            <div style="font-size: 16px; margin-bottom: 12px; opacity: 0.9;">总收入</div>
            <div style="font-size: 32px; font-weight: 600;">¥{{ totalIncome }}</div>
          </div>
          <!-- 总支出 -->
          <div style="padding: 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; color: white;">
            <div style="font-size: 16px; margin-bottom: 12px; opacity: 0.9;">总支出</div>
            <div style="font-size: 32px; font-weight: 600;">¥{{ totalExpense }}</div>
          </div>
        </div>
        <!-- 净收入 -->
        <div style="margin-top: 20px; padding: 20px; background: #f5f7fa; border-radius: 8px; text-align: center;">
          <div style="font-size: 14px; color: #909399; margin-bottom: 8px;">净收入</div>
          <div :style="{ fontSize: '28px', fontWeight: '600', color: netIncome >= 0 ? '#67C23A' : '#F56C6C' }">
            ¥{{ netIncome }}
          </div>
        </div>
      </el-card>

      <!-- 2. 支出饼状图 -->
      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">支出统计</h3>
            <div>
              <el-button text @click="downloadChart('expenseChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div>
          <div ref="expenseChartRef" style="width: 100%; height: 400px;"></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { getDashboardFinancial } from '../api/dashboard'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const loading = ref(false)
const financialData = ref({})
const query = ref({
  shop_id: null,
  start_date: null,
  end_date: null
})
const dateRange = ref(null)

// 图表相关
const expenseChartRef = ref(null)
let expenseChart = null

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

// 业务类型名称映射
const businessTypeMap = {
  'sales': '销售订单',
  'inbound': '入库',
  'outbound': '出库',
  'return': '退货',
  'logistics': '物流费',
  'delivery': '快递费',
  'refuel': '车加油',
  'meal': '请客吃饭',
  'trip': '出差',
  'other': '其他费用'
}

// 总收入
const totalIncome = computed(() => {
  const income = parseFloat(financialData.value.total_income || 0)
  return income.toFixed(2)
})

// 总支出
const totalExpense = computed(() => {
  const expense = parseFloat(financialData.value.total_expense || 0)
  return expense.toFixed(2)
})

// 净收入
const netIncome = computed(() => {
  const income = parseFloat(financialData.value.total_income || 0)
  const expense = parseFloat(financialData.value.total_expense || 0)
  return (income - expense).toFixed(2)
})

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  isRoot.value = !shop || shop === 'null'
  
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
      query.value.shop_id = shopInfo.value.id
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

// 获取当前店铺名称
function getCurrentShopName() {
  if (!isRoot.value && shopInfo.value) {
    return shopInfo.value.name
  }
  return '未知店铺'
}

// 获取默认日期范围（月初到今天）
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(1) // 设置为月初
  
  return [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 将日期转换为时间戳（秒）
function dateToTimestamp(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr + ' 00:00:00')
  return Math.floor(date.getTime() / 1000)
}

// 加载数据
function loadData() {
  loading.value = true
  
  const params = {}
  if (query.value.shop_id !== null && query.value.shop_id !== 0) {
    params.shop_id = query.value.shop_id
  }
  if (query.value.start_date) {
    params.start_date = dateToTimestamp(query.value.start_date)
  }
  if (query.value.end_date) {
    params.end_date = dateToTimestamp(query.value.end_date)
  }
  
  getDashboardFinancial(params).then(res => {
    if (res.code === 0) {
      financialData.value = res.data || {}
      nextTick(() => {
        renderExpenseChart()
      })
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取数据失败')
  })
}

// 渲染支出饼图
function renderExpenseChart() {
  if (!expenseChartRef.value) return
  
  if (!expenseChart) {
    expenseChart = echarts.init(expenseChartRef.value)
  }
  
  const expenseList = financialData.value.expense_by_business_type || []
  
  if (expenseList.length === 0) {
    expenseChart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: '#999',
          fontSize: 16
        }
      }
    })
    return
  }
  
  const pieData = expenseList.map(item => ({
    name: businessTypeMap[item.business_type] || item.business_type,
    value: parseFloat(item.amount || 0)
  }))
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  expenseChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const percent = totalAmount > 0 ? ((params.value / totalAmount) * 100).toFixed(1) : '0.0'
        return params.name + '<br/>' +
               '金额: ¥' + params.value.toFixed(2) + '<br/>' +
               '占比: ' + percent + '%'
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: 'bottom',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '支出统计',
        type: 'pie',
        radius: '70%',
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            const percent = totalAmount > 0 ? ((params.value / totalAmount) * 100).toFixed(1) : '0.0'
            return percent + '%'
          },
          fontSize: 14,
          fontWeight: 'bold',
          color: '#333'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: pieData
      }
    ]
  })
}

// 下载图表
function downloadChart(chartType) {
  let chart = null
  let filename = ''
  
  switch (chartType) {
    case 'expenseChart':
      chart = expenseChart
      filename = '支出统计'
      break
  }
  
  if (chart) {
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    const link = document.createElement('a')
    link.download = `${filename}_${new Date().getTime()}.png`
    link.href = url
    link.click()
  }
}

// 处理查询
function handleQuery() {
  loadData()
}

// 处理重置
function handleReset() {
  query.value.shop_id = isRoot.value ? null : (shopInfo.value?.id || null)
  dateRange.value = getDefaultDateRange()
  query.value.start_date = dateRange.value[0]
  query.value.end_date = dateRange.value[1]
  loadData()
}

// 处理日期变化
function handleDateChange(dates) {
  if (dates && dates.length === 2) {
    query.value.start_date = dates[0]
    query.value.end_date = dates[1]
  } else {
    query.value.start_date = null
    query.value.end_date = null
  }
}

// 窗口大小变化时重新调整图表
function handleResize() {
  if (expenseChart) expenseChart.resize()
}

onMounted(() => {
  loadUserInfo()
  
  // 设置默认日期范围
  dateRange.value = getDefaultDateRange()
  query.value.start_date = dateRange.value[0]
  query.value.end_date = dateRange.value[1]
  
  loadData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 监听店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      query.value.shop_id = event.detail.shopId
      loadData()
    }
  })
})

onUnmounted(() => {
  // 销毁图表实例
  if (expenseChart) {
    expenseChart.dispose()
    expenseChart = null
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
</style>

