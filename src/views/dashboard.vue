<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>订单大盘</h2>
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
      <!-- 1. 按行业销售额统计（饼图） -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">按行业销售额统计</h3>
            <div>
              <el-button text @click="downloadChart('salesByIndustryChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <!-- 左侧：汇总数据 -->
          <div style="display: flex; flex-direction: column; justify-content: center; padding: 20px; gap: 16px;">
            <div 
              v-for="(item, index) in salesByIndustrySummary" 
              :key="item.name" 
              :style="{
                padding: index === 0 ? '32px 40px' : '16px 20px',
                borderRadius: '8px',
                backgroundColor: index === 0 ? '#E8F5E9' : index === 1 ? '#E3F2FD' : index === 2 ? '#FFF3E0' : '#F3E5F5',
                fontSize: index === 0 ? '32px' : '16px',
                color: '#606266',
                fontWeight: '500'
              }"
            >
              <div :style="{ marginBottom: index === 0 ? '8px' : '4px', fontSize: index === 0 ? '28px' : '14px', color: '#909399' }">{{ item.name }}</div>
              <div :style="{ fontSize: index === 0 ? '36px' : '18px', color: '#303133', fontWeight: '600' }">{{ item.amount }}元</div>
            </div>
            <div v-if="salesByIndustrySummary.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无数据
            </div>
          </div>
          <!-- 右侧：饼图 -->
          <div>
            <div ref="salesByIndustryChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 2. 客户销售总额排名（柱状图） -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">客户销售总额排名</h3>
            <div>
              <el-button text @click="downloadChart('customerRankingChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div ref="customerRankingChartRef" style="width: 100%; height: 400px;"></div>
      </el-card>

      <!-- 3. 现金订单统计（饼图） -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">现金订单统计</h3>
            <div>
              <el-button text @click="downloadChart('cashByIndustryChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <!-- 左侧：汇总数据 -->
          <div style="display: flex; flex-direction: column; justify-content: center; padding: 20px; gap: 16px;">
            <div 
              v-for="(item, index) in cashByIndustrySummary" 
              :key="item.name" 
              :style="{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: index === 0 ? '#E8F5E9' : index === 1 ? '#E3F2FD' : '#FFF3E0',
                fontSize: '16px',
                color: '#606266',
                fontWeight: '500'
              }"
            >
              <div :style="{ marginBottom: '4px', fontSize: '14px', color: '#909399' }">{{ item.name }}</div>
              <div :style="{ fontSize: '18px', color: '#303133', fontWeight: '600' }">{{ item.amount }}元</div>
            </div>
            <div v-if="cashByIndustrySummary.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无数据
            </div>
          </div>
          <!-- 右侧：饼图 -->
          <div>
            <div ref="cashByIndustryChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 4. 赊账订单统计（饼图） -->
      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">赊账订单统计</h3>
            <div>
              <el-button text @click="downloadChart('creditByIndustryChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <!-- 左侧：汇总数据 -->
          <div style="display: flex; flex-direction: column; justify-content: center; padding: 20px; gap: 16px;">
            <div 
              v-for="(item, index) in creditByIndustrySummary" 
              :key="item.name" 
              :style="{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: index === 0 ? '#E8F5E9' : index === 1 ? '#E3F2FD' : '#FFF3E0',
                fontSize: '16px',
                color: '#606266',
                fontWeight: '500'
              }"
            >
              <div :style="{ marginBottom: '4px', fontSize: '14px', color: '#909399' }">{{ item.name }}</div>
              <div :style="{ fontSize: '18px', color: '#303133', fontWeight: '600' }">{{ item.amount }}元</div>
            </div>
            <div v-if="creditByIndustrySummary.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无数据
            </div>
          </div>
          <!-- 右侧：饼图 -->
          <div>
            <div ref="creditByIndustryChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { getDashboardOrders } from '../api/dashboard'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const loading = ref(false)
const dashboardData = ref({})
const query = ref({
  shop_id: null,
  start_date: null,
  end_date: null
})
const dateRange = ref(null)

// 图表相关
const salesByIndustryChartRef = ref(null)
const customerRankingChartRef = ref(null)
const cashByIndustryChartRef = ref(null)
const creditByIndustryChartRef = ref(null)
let salesByIndustryChart = null
let customerRankingChart = null
let cashByIndustryChart = null
let creditByIndustryChart = null

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

// 行业名称映射
const industryMap = {
  'factory_advert': '工厂-广告',
  'factory_sculpt': '工厂-雕塑',
  'worker': '工人'
}

// 将分转换为元
function centsToYuan(cents) {
  return (cents / 100).toFixed(2)
}

// 按行业销售额汇总数据
const salesByIndustrySummary = computed(() => {
  const stats = dashboardData.value.sales_by_industry || []
  const summary = []
  let totalAmount = 0
  
  stats.forEach(item => {
    const amount = parseFloat(item.order_amount || 0) / 100 // 分转元
    totalAmount += amount
    summary.push({
      name: industryMap[item.industry] || item.industry,
      amount: amount.toFixed(2)
    })
  })
  
  if (totalAmount > 0) {
    summary.unshift({
      name: '总金额',
      amount: totalAmount.toFixed(2)
    })
  }
  
  return summary
})

// 现金订单汇总数据
const cashByIndustrySummary = computed(() => {
  const stats = dashboardData.value.cash_by_industry || []
  return stats.map(item => ({
    name: industryMap[item.industry] || item.industry,
    amount: (parseFloat(item.order_amount || 0) / 100).toFixed(2) // 分转元
  }))
})

// 赊账订单汇总数据
const creditByIndustrySummary = computed(() => {
  const stats = dashboardData.value.credit_by_industry || []
  return stats.map(item => ({
    name: industryMap[item.industry] || item.industry,
    amount: (parseFloat(item.order_amount || 0) / 100).toFixed(2) // 分转元
  }))
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
  
  getDashboardOrders(params).then(res => {
    if (res.code === 0) {
      dashboardData.value = res.data || {}
      nextTick(() => {
        renderCharts()
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

// 渲染所有图表
function renderCharts() {
  renderSalesByIndustryChart()
  renderCustomerRankingChart()
  renderCashByIndustryChart()
  renderCreditByIndustryChart()
}

// 1. 按行业销售额统计（饼图）
function renderSalesByIndustryChart() {
  if (!salesByIndustryChartRef.value) return
  
  if (!salesByIndustryChart) {
    salesByIndustryChart = echarts.init(salesByIndustryChartRef.value)
  }
  
  const stats = dashboardData.value.sales_by_industry || []
  
  if (stats.length === 0) {
    salesByIndustryChart.setOption({
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
  
  const pieData = stats.map(item => ({
    name: industryMap[item.industry] || item.industry,
    value: parseFloat(item.order_amount || 0) / 100 // 分转元
  }))
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  salesByIndustryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const percent = totalAmount > 0 ? ((params.value / totalAmount) * 100).toFixed(2) : '0.00'
        return params.name + '<br/>' +
               '金额: ¥' + params.value.toFixed(2) + '<br/>' +
               '占比: ' + percent + '%'
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '行业销售额',
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
          formatter: '{b}\n¥{c}\n({d}%)'
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

// 2. 客户销售总额排名（柱状图）
function renderCustomerRankingChart() {
  if (!customerRankingChartRef.value) return
  
  if (!customerRankingChart) {
    customerRankingChart = echarts.init(customerRankingChartRef.value)
  }
  
  const ranking = dashboardData.value.customer_ranking || []
  
  if (ranking.length === 0) {
    customerRankingChart.setOption({
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
  
  // 按金额降序排序
  const sortedRanking = [...ranking].sort((a, b) => {
    return parseFloat(b.order_amount || 0) - parseFloat(a.order_amount || 0)
  })
  
  const names = sortedRanking.map(item => item.user_name || '未知用户')
  const amounts = sortedRanking.map(item => parseFloat(item.order_amount || 0) / 100) // 分转元
  
  customerRankingChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const param = params[0]
        return param.name + '<br/>' +
               '销售总额: ¥' + param.value.toFixed(2)
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '金额(元)'
    },
    series: [
      {
        name: '销售总额',
        type: 'bar',
        data: amounts,
        itemStyle: {
          color: '#409EFF'
        },
        label: {
          show: true,
          position: 'top',
          formatter: '¥{c}'
        }
      }
    ]
  })
}

// 3. 现金订单统计（饼图）
function renderCashByIndustryChart() {
  if (!cashByIndustryChartRef.value) return
  
  if (!cashByIndustryChart) {
    cashByIndustryChart = echarts.init(cashByIndustryChartRef.value)
  }
  
  const stats = dashboardData.value.cash_by_industry || []
  
  if (stats.length === 0) {
    cashByIndustryChart.setOption({
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
  
  const pieData = stats.map(item => ({
    name: industryMap[item.industry] || item.industry,
    value: parseFloat(item.order_amount || 0) / 100 // 分转元
  }))
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  cashByIndustryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const percent = totalAmount > 0 ? ((params.value / totalAmount) * 100).toFixed(2) : '0.00'
        return params.name + '<br/>' +
               '金额: ¥' + params.value.toFixed(2) + '<br/>' +
               '占比: ' + percent + '%'
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '现金订单',
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
          formatter: '{b}\n¥{c}\n({d}%)'
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

// 4. 赊账订单统计（饼图）
function renderCreditByIndustryChart() {
  if (!creditByIndustryChartRef.value) return
  
  if (!creditByIndustryChart) {
    creditByIndustryChart = echarts.init(creditByIndustryChartRef.value)
  }
  
  const stats = dashboardData.value.credit_by_industry || []
  
  if (stats.length === 0) {
    creditByIndustryChart.setOption({
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
  
  const pieData = stats.map(item => ({
    name: industryMap[item.industry] || item.industry,
    value: parseFloat(item.order_amount || 0) / 100 // 分转元
  }))
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  creditByIndustryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const percent = totalAmount > 0 ? ((params.value / totalAmount) * 100).toFixed(2) : '0.00'
        return params.name + '<br/>' +
               '金额: ¥' + params.value.toFixed(2) + '<br/>' +
               '占比: ' + percent + '%'
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '赊账订单',
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
          formatter: '{b}\n¥{c}\n({d}%)'
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
    case 'salesByIndustryChart':
      chart = salesByIndustryChart
      filename = '按行业销售额统计'
      break
    case 'customerRankingChart':
      chart = customerRankingChart
      filename = '客户销售总额排名'
      break
    case 'cashByIndustryChart':
      chart = cashByIndustryChart
      filename = '现金订单统计'
      break
    case 'creditByIndustryChart':
      chart = creditByIndustryChart
      filename = '赊账订单统计'
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
  if (salesByIndustryChart) salesByIndustryChart.resize()
  if (customerRankingChart) customerRankingChart.resize()
  if (cashByIndustryChart) cashByIndustryChart.resize()
  if (creditByIndustryChart) creditByIndustryChart.resize()
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
  if (salesByIndustryChart) {
    salesByIndustryChart.dispose()
    salesByIndustryChart = null
  }
  if (customerRankingChart) {
    customerRankingChart.dispose()
    customerRankingChart = null
  }
  if (cashByIndustryChart) {
    cashByIndustryChart.dispose()
    cashByIndustryChart = null
  }
  if (creditByIndustryChart) {
    creditByIndustryChart.dispose()
    creditByIndustryChart = null
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
</style>

