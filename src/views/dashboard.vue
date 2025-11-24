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
      <!-- 1. 按行业统计（饼图） -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">按行业统计</h3>
            <div>
              <el-button text @click="downloadChart('industryChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <!-- 左侧：汇总数据 -->
          <div style="display: flex; flex-direction: column; justify-content: center; padding: 20px; gap: 16px;">
            <div 
              v-for="(item, index) in industrySummary" 
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
            <div v-if="industrySummary.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无数据
            </div>
          </div>
          <!-- 右侧：饼图 -->
          <div>
            <div ref="industryChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 2. 雕塑行业Top5 和 广告行业Top5（柱状图，并排显示） -->
      <el-card style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- 雕塑行业Top5 -->
          <div>
            <h3 style="margin: 0 0 16px 0;">雕塑行业Top5</h3>
            <div ref="sculptTop5ChartRef" style="width: 100%; height: 400px;"></div>
          </div>
          <!-- 广告行业Top5 -->
          <div>
            <h3 style="margin: 0 0 16px 0;">广告行业Top5</h3>
            <div ref="advertTop5ChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 4. 按雇佣分类统计（饼图） -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">按雇佣分类统计</h3>
            <div>
              <el-button text @click="downloadChart('employChart')">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <!-- 左侧：汇总数据 -->
          <div style="display: flex; flex-direction: column; justify-content: center; padding: 20px; gap: 16px;">
            <div 
              v-for="(item, index) in employSummary" 
              :key="item.name" 
              :style="{
                padding: index === 0 ? '32px 40px' : '16px 20px',
                borderRadius: '8px',
                backgroundColor: index === 0 ? '#E8F5E9' : index === 1 ? '#E3F2FD' : '#FFF3E0',
                fontSize: index === 0 ? '32px' : '16px',
                color: '#606266',
                fontWeight: '500'
              }"
            >
              <div :style="{ marginBottom: index === 0 ? '8px' : '4px', fontSize: index === 0 ? '28px' : '14px', color: '#909399' }">{{ item.name }}</div>
              <div :style="{ fontSize: index === 0 ? '36px' : '18px', color: '#303133', fontWeight: '600' }">{{ item.amount }}元</div>
            </div>
            <div v-if="employSummary.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无数据
            </div>
          </div>
          <!-- 右侧：饼图 -->
          <div>
            <div ref="employChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </div>
      </el-card>

      <!-- 5. 工人行业Top10（柱状图） -->
      <el-card>
        <template #header>
          <h3 style="margin: 0;">工人行业Top10</h3>
        </template>
        <div ref="workerTop10ChartRef" style="width: 100%; height: 400px;"></div>
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
const industryChartRef = ref(null)
const sculptTop5ChartRef = ref(null)
const advertTop5ChartRef = ref(null)
const employChartRef = ref(null)
const workerTop10ChartRef = ref(null)
let industryChart = null
let sculptTop5Chart = null
let advertTop5Chart = null
let employChart = null
let workerTop10Chart = null

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

// 行业汇总数据
const industrySummary = computed(() => {
  const stats = dashboardData.value.industry_amount_stats || []
  const industryMap = {
    'sculpt': '雕塑',
    'advert': '广告',
    'other': '其它'
  }
  
  const summary = []
  let totalAmount = 0
  
  stats.forEach(item => {
    const amount = parseFloat(item.order_amount || 0)
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

// 雇佣分类汇总数据
const employSummary = computed(() => {
  const stats = dashboardData.value.employ_stats || []
  const workers = dashboardData.value.worker_top10 || []
  
  // 统计工厂金额
  let factoryAmount = 0
  let factoryCount = 0
  stats.forEach(item => {
    if (item.employ === 'factory') {
      factoryAmount += parseFloat(item.order_amount || 0)
      factoryCount += parseInt(item.order_count || 0)
    }
  })
  
  // 统计工人包活和不包活
  let workerPackageAmount = 0  // 包活金额
  let workerNoPackageAmount = 0  // 不包活金额
  let workerPackageCount = 0
  let workerNoPackageCount = 0
  
  workers.forEach(item => {
    const amount = parseFloat(item.order_amount || 0)
    // 根据后端返回的字段判断是否包活，可能是 is_package, master_proj 等字段
    const isPackage = item.is_package === 1 || item.master_proj === 1 || item.is_package === true
    if (isPackage) {
      workerPackageAmount += amount
      workerPackageCount += 1
    } else {
      workerNoPackageAmount += amount
      workerNoPackageCount += 1
    }
  })
  
  const summary = []
  if (factoryAmount > 0 || factoryCount > 0) {
    summary.push({
      name: '工厂',
      amount: factoryAmount.toFixed(2)
    })
  }
  if (workerPackageAmount > 0 || workerPackageCount > 0) {
    summary.push({
      name: '工人-包活',
      amount: workerPackageAmount.toFixed(2)
    })
  }
  if (workerNoPackageAmount > 0 || workerNoPackageCount > 0) {
    summary.push({
      name: '工人-不包活',
      amount: workerNoPackageAmount.toFixed(2)
    })
  }
  
  return summary
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
  renderIndustryChart()
  renderSculptTop5Chart()
  renderAdvertTop5Chart()
  renderEmployChart()
  renderWorkerTop10Chart()
}

// 1. 按行业统计（饼图）
function renderIndustryChart() {
  if (!industryChartRef.value) return
  
  if (!industryChart) {
    industryChart = echarts.init(industryChartRef.value)
  }
  
  const stats = dashboardData.value.industry_amount_stats || []
  const industryMap = {
    'sculpt': '雕塑',
    'advert': '广告',
    'other': '其它'
  }
  
  if (stats.length === 0) {
    industryChart.setOption({
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
    value: parseFloat(item.order_amount || 0)
  }))
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  industryChart.setOption({
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
        name: '行业金额',
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

// 2. 雕塑行业Top5（柱状图）
function renderSculptTop5Chart() {
  if (!sculptTop5ChartRef.value) return
  
  if (!sculptTop5Chart) {
    sculptTop5Chart = echarts.init(sculptTop5ChartRef.value)
  }
  
  const top5 = dashboardData.value.sculpt_top5 || []
  
  if (top5.length === 0) {
    sculptTop5Chart.setOption({
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
  
  const names = top5.map(item => item.user_name || '未知用户')
  const amounts = top5.map(item => parseFloat(item.order_amount || 0))
  
  sculptTop5Chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const param = params[0]
        return param.name + '<br/>' +
               '总金额: ¥' + param.value.toFixed(2)
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
        name: '总金额',
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

// 3. 广告行业Top5（柱状图）
function renderAdvertTop5Chart() {
  if (!advertTop5ChartRef.value) return
  
  if (!advertTop5Chart) {
    advertTop5Chart = echarts.init(advertTop5ChartRef.value)
  }
  
  const top5 = dashboardData.value.advert_top5 || []
  
  if (top5.length === 0) {
    advertTop5Chart.setOption({
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
  
  const names = top5.map(item => item.user_name || '未知用户')
  const amounts = top5.map(item => parseFloat(item.order_amount || 0))
  
  advertTop5Chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const param = params[0]
        return param.name + '<br/>' +
               '总金额: ¥' + param.value.toFixed(2)
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
        name: '总金额',
        type: 'bar',
        data: amounts,
        itemStyle: {
          color: '#67C23A'
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

// 4. 按雇佣分类统计（饼图：工厂、工人-包活、工人-不包活）
function renderEmployChart() {
  if (!employChartRef.value) return
  
  if (!employChart) {
    employChart = echarts.init(employChartRef.value)
  }
  
  const stats = dashboardData.value.employ_stats || []
  const workers = dashboardData.value.worker_top10 || []
  
  // 统计工厂
  let factoryAmount = 0
  let factoryCount = 0
  stats.forEach(item => {
    if (item.employ === 'factory') {
      factoryAmount += parseFloat(item.order_amount || 0)
      factoryCount += parseInt(item.order_count || 0)
    }
  })
  
  // 统计工人包活和不包活
  let workerPackageAmount = 0
  let workerNoPackageAmount = 0
  let workerPackageCount = 0
  let workerNoPackageCount = 0
  
  workers.forEach(item => {
    const amount = parseFloat(item.order_amount || 0)
    const isPackage = item.is_package === 1 || item.master_proj === 1 || item.is_package === true
    if (isPackage) {
      workerPackageAmount += amount
      workerPackageCount += 1
    } else {
      workerNoPackageAmount += amount
      workerNoPackageCount += 1
    }
  })
  
  const pieData = []
  if (factoryAmount > 0 || factoryCount > 0) {
    pieData.push({
      name: '工厂',
      value: factoryAmount
    })
  }
  if (workerPackageAmount > 0 || workerPackageCount > 0) {
    pieData.push({
      name: '工人-包活',
      value: workerPackageAmount
    })
  }
  if (workerNoPackageAmount > 0 || workerNoPackageCount > 0) {
    pieData.push({
      name: '工人-不包活',
      value: workerNoPackageAmount
    })
  }
  
  if (pieData.length === 0) {
    employChart.setOption({
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
  
  const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0)
  
  employChart.setOption({
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
        name: '雇佣分类',
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

// 5. 工人行业Top10（柱状图）
function renderWorkerTop10Chart() {
  if (!workerTop10ChartRef.value) return
  
  if (!workerTop10Chart) {
    workerTop10Chart = echarts.init(workerTop10ChartRef.value)
  }
  
  const top10 = dashboardData.value.worker_top10 || []
  
  if (top10.length === 0) {
    workerTop10Chart.setOption({
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
  
  const names = top10.map(item => {
    const userName = item.user_name || '未知用户'
    const isPackage = item.is_package === 1 || item.master_proj === 1 || item.is_package === true
    return `${userName}(${isPackage ? '包活' : '不包活'})`
  })
  const amounts = top10.map(item => parseFloat(item.order_amount || 0))
  const colors = top10.map(item => {
    const isPackage = item.is_package === 1 || item.master_proj === 1 || item.is_package === true
    return isPackage ? '#E6A23C' : '#F56C6C'
  })
  
  workerTop10Chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const param = params[0]
        const item = top10[param.dataIndex]
        const isPackage = item.is_package === 1 || item.master_proj === 1 || item.is_package === true
        return param.name + '<br/>' +
               '是否包活: ' + (isPackage ? '是' : '否') + '<br/>' +
               '总金额: ¥' + param.value.toFixed(2)
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
        name: '总金额',
        type: 'bar',
        data: amounts.map((amount, index) => ({
          value: amount,
          itemStyle: {
            color: colors[index]
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '¥{c}'
        }
      }
    ]
  })
}

// 下载图表
function downloadChart(chartType) {
  let chart = null
  let filename = ''
  
  switch (chartType) {
    case 'industryChart':
      chart = industryChart
      filename = '按行业统计'
      break
    case 'employChart':
      chart = employChart
      filename = '按雇佣分类统计'
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
  if (industryChart) industryChart.resize()
  if (sculptTop5Chart) sculptTop5Chart.resize()
  if (advertTop5Chart) advertTop5Chart.resize()
  if (employChart) employChart.resize()
  if (workerTop10Chart) workerTop10Chart.resize()
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
  if (industryChart) {
    industryChart.dispose()
    industryChart = null
  }
  if (sculptTop5Chart) {
    sculptTop5Chart.dispose()
    sculptTop5Chart = null
  }
  if (advertTop5Chart) {
    advertTop5Chart.dispose()
    advertTop5Chart = null
  }
  if (employChart) {
    employChart.dispose()
    employChart = null
  }
  if (workerTop10Chart) {
    workerTop10Chart.dispose()
    workerTop10Chart = null
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
</style>
