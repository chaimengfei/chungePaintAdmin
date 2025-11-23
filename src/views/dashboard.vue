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

    <!-- 统计时间范围提示 -->
    <el-card v-if="dashboardData.range" style="margin-bottom: 20px;">
      <div style="color: #606266; font-size: 14px;">
        <span>统计时间范围：</span>
        <span style="font-weight: 500; color: #303133;">
          {{ formatDateRange(dashboardData.range.start) }} 至 {{ formatDateRange(dashboardData.range.end) }}
        </span>
      </div>
    </el-card>

    <!-- 图表区域 -->
    <div v-loading="loading">
      <!-- 工厂行业统计 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <h3 style="margin: 0;">工厂行业统计（仅统计工厂订单）</h3>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4 style="text-align: center; margin: 0 0 10px 0; color: #606266;">订单金额占比</h4>
            <div ref="industryAmountChartRef" style="width: 100%; height: 400px;"></div>
          </div>
          <div>
            <h4 style="text-align: center; margin: 0 0 10px 0; color: #606266;">订单量占比</h4>
            <div ref="industryCountChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 雇佣分类统计 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <h3 style="margin: 0;">雇佣分类统计</h3>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4 style="text-align: center; margin: 0 0 10px 0; color: #606266;">订单金额占比</h4>
            <div ref="employAmountChartRef" style="width: 100%; height: 400px;"></div>
          </div>
          <div>
            <h4 style="text-align: center; margin: 0 0 10px 0; color: #606266;">订单量占比</h4>
            <div ref="employCountChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 工人包活统计 -->
      <el-card>
        <template #header>
          <h3 style="margin: 0;">工人包活统计（仅统计工人订单）</h3>
        </template>
        <div ref="workerChartRef" style="width: 100%; height: 400px;"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getDashboardOrders } from '../api/dashboard'
import { ElMessage } from 'element-plus'
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
const industryAmountChartRef = ref(null)
const industryCountChartRef = ref(null)
const employAmountChartRef = ref(null)
const employCountChartRef = ref(null)
const workerChartRef = ref(null)
let industryAmountChart = null
let industryCountChart = null
let employAmountChart = null
let employCountChart = null
let workerChart = null

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

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

// 格式化日期范围
function formatDateRange(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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

// 将时间戳转换为日期字符串
function timestampToDate(timestamp) {
  if (!timestamp) return null
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

// 加载数据
function loadData() {
  loading.value = true
  
  const params = {}
  if (query.value.shop_id !== null && query.value.shop_id !== 0) {
    params.shop_id = query.value.shop_id
  }
  if (query.value.start_date) {
    // 转换为时间戳（秒）
    params.start_date = dateToTimestamp(query.value.start_date)
  }
  if (query.value.end_date) {
    // 转换为时间戳（秒）
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

// 渲染图表
function renderCharts() {
  renderIndustryCharts()
  renderEmployCharts()
  renderWorkerChart()
}

// 工厂行业统计图表（两个饼图：金额占比和订单量占比）
function renderIndustryCharts() {
  const stats = dashboardData.value.stats?.industry_stats || []
  const industryMap = {
    'advert': '广告',
    'sculpt': '雕塑',
    'other': '其他'
  }
  
  // 金额占比饼图
  if (industryAmountChartRef.value) {
    if (!industryAmountChart) {
      industryAmountChart = echarts.init(industryAmountChartRef.value)
    }
    
    if (stats.length === 0) {
      industryAmountChart.setOption({
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
    } else {
      const pieData = stats.map(item => ({
        name: industryMap[item.industry] || item.industry,
        value: parseFloat(item.order_amount)
      }))
      
      const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
      
      industryAmountChart.setOption({
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
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '订单金额',
            type: 'pie',
            radius: ['40%', '70%'],
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
  }
  
  // 订单量占比饼图
  if (industryCountChartRef.value) {
    if (!industryCountChart) {
      industryCountChart = echarts.init(industryCountChartRef.value)
    }
    
    if (stats.length === 0) {
      industryCountChart.setOption({
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
    } else {
      const pieData = stats.map(item => ({
        name: industryMap[item.industry] || item.industry,
        value: item.order_count
      }))
      
      const totalCount = pieData.reduce((sum, item) => sum + item.value, 0)
      
      industryCountChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const percent = totalCount > 0 ? ((params.value / totalCount) * 100).toFixed(2) : '0.00'
            return params.name + '<br/>' +
                   '订单量: ' + params.value + ' 单<br/>' +
                   '占比: ' + percent + '%'
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '订单量',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{c}单\n({d}%)'
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
  }
}

// 雇佣分类统计图表（两个饼图：金额占比和订单量占比）
function renderEmployCharts() {
  const stats = dashboardData.value.stats?.employ_stats || []
  const employMap = {
    'worker': '工人',
    'factory': '工厂',
    'other': '其他'
  }
  
  // 金额占比饼图
  if (employAmountChartRef.value) {
    if (!employAmountChart) {
      employAmountChart = echarts.init(employAmountChartRef.value)
    }
    
    if (stats.length === 0) {
      employAmountChart.setOption({
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
    } else {
      const pieData = stats.map(item => ({
        name: employMap[item.employ] || item.employ,
        value: parseFloat(item.order_amount)
      }))
      
      const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
      
      employAmountChart.setOption({
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
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '订单金额',
            type: 'pie',
            radius: ['40%', '70%'],
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
  }
  
  // 订单量占比饼图
  if (employCountChartRef.value) {
    if (!employCountChart) {
      employCountChart = echarts.init(employCountChartRef.value)
    }
    
    if (stats.length === 0) {
      employCountChart.setOption({
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
    } else {
      const pieData = stats.map(item => ({
        name: employMap[item.employ] || item.employ,
        value: item.order_count
      }))
      
      const totalCount = pieData.reduce((sum, item) => sum + item.value, 0)
      
      employCountChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const percent = totalCount > 0 ? ((params.value / totalCount) * 100).toFixed(2) : '0.00'
            return params.name + '<br/>' +
                   '订单量: ' + params.value + ' 单<br/>' +
                   '占比: ' + percent + '%'
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '订单量',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{c}单\n({d}%)'
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
  }
}

// 工人包活统计图表（柱状图：金额和订单量）
function renderWorkerChart() {
  if (!workerChartRef.value) return
  
  if (!workerChart) {
    workerChart = echarts.init(workerChartRef.value)
  }
  
  const stats = dashboardData.value.stats?.worker_mater_stats || []
  if (stats.length === 0) {
    workerChart.setOption({
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
  
  const categories = stats.map(item => item.master_proj === 1 ? '包活' : '非包活')
  const orderCountData = stats.map(item => item.order_count)
  const orderAmountData = stats.map(item => parseFloat(item.order_amount))
  
  workerChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          if (param.seriesName === '订单量') {
            result += param.marker + param.seriesName + ': ' + param.value + ' 单<br/>'
          } else {
            result += param.marker + param.seriesName + ': ¥' + param.value.toFixed(2) + '<br/>'
          }
        })
        return result
      }
    },
    legend: {
      data: ['订单量', '订单金额'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: [
      {
        type: 'value',
        name: '订单量',
        position: 'left'
      },
      {
        type: 'value',
        name: '订单金额(元)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        data: orderCountData,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '订单金额',
        type: 'bar',
        yAxisIndex: 1,
        data: orderAmountData,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  })
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
  if (industryAmountChart) industryAmountChart.resize()
  if (industryCountChart) industryCountChart.resize()
  if (employAmountChart) employAmountChart.resize()
  if (employCountChart) employCountChart.resize()
  if (workerChart) workerChart.resize()
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
  if (industryAmountChart) {
    industryAmountChart.dispose()
    industryAmountChart = null
  }
  if (industryCountChart) {
    industryCountChart.dispose()
    industryCountChart = null
  }
  if (employAmountChart) {
    employAmountChart.dispose()
    employAmountChart = null
  }
  if (employCountChart) {
    employCountChart.dispose()
    employCountChart = null
  }
  if (workerChart) {
    workerChart.dispose()
    workerChart = null
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
</style>

