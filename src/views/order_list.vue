<template>
  <div>
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

        <!-- 订单类型筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">订单类型：</span>
          <el-select
            v-model="orderType"
            placeholder="选择订单类型"
            style="width: 150px;"
            @change="handleOrderTypeChange"
          >
            <el-option v-for="opt in orderTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        
        <!-- 时间范围筛选 -->
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
            @change="handleDateRangeChange"
            clearable
          />
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>
    
    <el-card>
      <!-- 批量操作按钮 -->
      <div v-if="selectedRows.length > 0" style="margin-bottom: 16px; padding: 12px; background-color: #f5f7fa; border-radius: 4px; display: flex; align-items: center; gap: 12px;">
        <span style="color: #606266;">已选择 <strong style="color: #409eff;">{{ selectedRows.length }}</strong> 项</span>
        <el-button type="primary" @click="batchSetPaymentStatus" :loading="batchSettingPayment">
          批量设置支付
        </el-button>
        <el-button @click="clearSelection">取消选择</el-button>
      </div>
      
      <el-table 
        ref="tableRef"
        :data="outboundList" 
        style="width: 100%" 
        v-loading="loading" 
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_no" label="单号" width="200" />
        <el-table-column prop="user_name" label="客户" width="120" />
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column label="出库类型" width="100">
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
        <el-table-column prop="total_profit" label="总利润" width="120">
          <template #default="scope">
            <span :style="{ color: scope.row.total_profit >= 0 ? '#67c23a' : '#f56c6c' }">
              ¥{{ scope.row.total_profit?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="支付状态" width="150">
          <template #default="scope">
            <div v-if="scope.row.payment_status === 3" style="display: flex; align-items: center; gap: 4px;">
              <el-tag type="success">支付成功</el-tag>
              <el-tooltip 
                :content="getPaymentTypeText(scope.row.payment_type)" 
                placement="top"
              >
                <el-icon style="cursor: pointer; color: #909399; font-size: 14px;">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div v-else-if="scope.row.payment_status === 2" style="display: flex; align-items: center; gap: 8px;">
              <el-tag type="info">支付中</el-tag>
            </div>
            <div v-else style="display: flex; align-items: center; gap: 8px;">
              <el-tag type="warning">未支付</el-tag>
              <el-button 
                type="primary" 
                size="small" 
                @click="setPaymentStatus(scope.row)"
                :loading="scope.row.settingPayment"
              >
                设置支付
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
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
                  <span>数量:{{ item.quantity }} &nbsp;&nbsp; <span style="color: #909399;">库存:{{ item.before_stock }}→{{ item.after_stock }}</span></span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>单价:{{ item.unit_price?.toFixed(2) || '0.00' }} &nbsp;&nbsp; <span style="font-weight: 500; color: #409eff;">小计:{{ item.total_price?.toFixed(2) || '0.00' }}</span></span>
                  <span style="color: #67c23a;">利润:{{ item.profit?.toFixed(2) || '0.00' }}</span>
                </div>
                <div v-if="index < scope.row.items.length - 1" style="border-top: 1px solid #e4e7ed; margin-top: 8px; padding-top: 8px;"></div>
              </div>
            </div>
            <div v-else style="color: #909399; font-size: 12px;">暂无商品明细</div>
          </template>
        </el-table-column>
        <el-table-column label="单据" width="500" min-width="500">
          <template #default="scope">
            <div 
              v-if="scope.row.invoice_url" 
              @dblclick="viewInvoice(scope.row.invoice_url, scope.row.invoice_html)"
              style="width: 100%; height: 300px; border: 1px solid #e4e7ed; border-radius: 4px; overflow: hidden; background: #fff; position: relative; cursor: pointer;"
              title="双击查看大图"
            >
              <iframe
                v-if="scope.row.invoice_html"
                :srcdoc="scope.row.invoice_html"
                style="width: 200%; height: 200%; border: none; transform: scale(0.5); transform-origin: 0 0; pointer-events: none;"
                frameborder="0"
                scrolling="no"
              ></iframe>
              <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399;">
                <span>加载中...</span>
              </div>
            </div>
            <span v-else style="color: #909399;">无单据</span>
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

    <!-- 单据预览对话框 -->
    <el-dialog
      v-model="invoiceDialogVisible"
      title="单据预览"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
    >
      <div v-loading="invoiceLoading" style="height: 70vh; overflow: hidden; background: #fff;">
        <iframe
          v-if="invoiceHtmlContent"
          :srcdoc="invoiceHtmlContent"
          style="width: 100%; height: 100%; border: none;"
          frameborder="0"
        ></iframe>
        <div v-else-if="!invoiceLoading" style="text-align: center; padding: 40px; color: #909399;">
          暂无内容
        </div>
      </div>
      <template #footer>
        <el-button @click="invoiceDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openInvoiceInNewWindow">下载文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import request from '../api/request'

const outboundList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const orderType = ref(1) // 0-全部,1-出库,2-入库,3-退货，默认出库
const selectedRows = ref([]) // 选中的行
const batchSettingPayment = ref(false) // 批量设置支付加载状态
const tableRef = ref(null) // 表格实例引用
const orderTypeOptions = [
  { label: '全部', value: 0 },
  { label: '出库', value: 1 },
  { label: '入库', value: 2 },
  { label: '退货', value: 3 },
]

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)
const operatorInfo = ref(null) // 当前操作员信息

// 单据预览相关
const invoiceDialogVisible = ref(false)
const currentInvoiceUrl = ref('')
const invoiceHtmlContent = ref('')
const invoiceLoading = ref(false)

// 时间范围筛选
const dateRange = ref([])
const startTime = ref('')
const endTime = ref('')

// 初始化默认时间范围（最近半年）
function initDefaultDateRange() {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  
  // 设置默认时间范围
  const startDate = sixMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')
  const endDate = now.toISOString().slice(0, 19).replace('T', ' ')
  
  startTime.value = startDate
  endTime.value = endDate
  dateRange.value = [startDate, endDate]
}

// 加载用户权限信息
function loadUserInfo() {
  const operator = localStorage.getItem('operator')
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  // 获取操作员信息
  if (operator) {
    try {
      operatorInfo.value = JSON.parse(operator)
    } catch (error) {
      console.error('解析操作员信息失败:', error)
    }
  }
  
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
  loadOutboundList()
}

// 处理时间范围变化
function handleDateRangeChange(value) {
  if (value && value.length === 2) {
    startTime.value = value[0]
    endTime.value = value[1]
  } else {
    startTime.value = ''
    endTime.value = ''
  }
}

// 订单类型变化
function handleOrderTypeChange() {
  currentPage.value = 1
  loadOutboundList()
}

// 查询按钮处理
function handleSearch() {
  currentPage.value = 1 // 重置到第一页
  loadOutboundList()
}

// 重置按钮处理
function handleReset() {
  dateRange.value = []
  startTime.value = ''
  endTime.value = ''
  currentPage.value = 1
  orderType.value = 1 // 重置为出库
  loadOutboundList()
}

// 加载出库列表
function loadOutboundList() {
  loading.value = true
  
  // 构建请求参数
  const params = {
    page: currentPage.value,
    page_size: pageSize.value
  }
  // 订单类型
  params.types = orderType.value
  
  // 添加店铺ID参数
  // Root用户可以选择店铺，普通管理员只能查看自己店铺（后端会自动处理）
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  }
  // 普通管理员不需要传shop_id，后端会根据token自动识别
  
  // 添加时间范围参数
  if (startTime.value) {
    params.start_time = startTime.value
  }
  if (endTime.value) {
    params.end_time = endTime.value
  }
  
  request.get('/order/operations', { params }).then(res => {
    if (res.code === 0) {
      outboundList.value = res.data.list || []
      total.value = res.data.total || 0
      
      // 为每个有 invoice_url 的行加载 HTML 内容
      outboundList.value.forEach((row, index) => {
        if (row.invoice_url) {
          loadInvoiceHtml(row, index)
        }
      })
    } else {
      ElMessage.error(res.message || '获取出库列表失败')
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
  if (!dateTimeStr && dateTimeStr !== 0) return ''
  // 支持时间戳（秒或毫秒）与 ISO 字符串
  let ts = dateTimeStr
  if (typeof ts === 'number') {
    if (ts < 1e12) ts = ts * 1000 // 如果是秒级时间戳，转为毫秒
    ts = Number(ts)
  }
  const date = new Date(ts)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取支付类型文本
function getPaymentTypeText(paymentType) {
  const typeMap = {
    1: '微信支付',
    2: '余额支付',
    3: '线下转账'
  }
  return typeMap[paymentType] || '未知支付方式'
}

// 获取支付状态文本
function getPaymentStatusText(paymentStatus) {
  const statusMap = {
    1: '未支付',
    2: '支付中',
    3: '支付成功'
  }
  return statusMap[paymentStatus] || '未知状态'
}

// 处理表格选择变化
function handleSelectionChange(selection) {
  selectedRows.value = selection
}

// 清空选择
function clearSelection() {
  selectedRows.value = []
  // 使用表格实例清空选择
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

// 批量设置支付状态
function batchSetPaymentStatus() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要设置支付的订单')
    return
  }
  
  // 过滤出未支付的订单
  const unpaidOrders = selectedRows.value.filter(row => row.payment_status !== 3)
  
  if (unpaidOrders.length === 0) {
    ElMessage.warning('所选订单均已支付，无需重复设置')
    return
  }
  
  ElMessageBox.confirm(
    `确认将 ${unpaidOrders.length} 个订单设置为已支付状态吗？`,
    '批量设置支付状态',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    batchSettingPayment.value = true
    
    // 获取当前操作员信息
    const operator = operatorInfo.value ? (operatorInfo.value.real_name || operatorInfo.value.name || '未知用户') : '未知用户'
    const operatorId = operatorInfo.value ? (operatorInfo.value.id || 0) : 0
    
    // 构建订单ID数组
    const orderIds = unpaidOrders.map(row => row.id)
    
    const data = {
      order_ids: orderIds,
      payment_finish_status: 3,
      operator: operator,
      operator_id: operatorId
    }
    
    request.post('/order/set/payment-status', data).then(res => {
      if (res.code === 0) {
        ElMessage.success(`成功设置 ${unpaidOrders.length} 个订单的支付状态`)
        // 更新本地数据
        unpaidOrders.forEach(row => {
          row.payment_status = 3
          row.payment_finish_status = 3
          row.payment_finish_time = new Date().toISOString()
        })
        // 清空选择
        selectedRows.value = []
        if (tableRef.value) {
          tableRef.value.clearSelection()
        }
      } else {
        ElMessage.error(res.message || '批量设置支付状态失败')
      }
    }).catch((error) => {
      console.log('批量设置支付状态错误:', error)
      ElMessage.error('网络错误，请稍后重试')
    }).finally(() => {
      batchSettingPayment.value = false
    })
  }).catch(() => {
    // 用户取消操作
  })
}

// 设置支付状态
function setPaymentStatus(row) {
  ElMessageBox.confirm(
    `确认将出库单 ${row.order_no || row.operation_no || 'N/A'} 设置为已支付状态吗？`,
    '设置支付状态',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 设置加载状态
    row.settingPayment = true
    
    // 获取当前操作员信息
    const operator = operatorInfo.value ? (operatorInfo.value.real_name || operatorInfo.value.name || '未知用户') : '未知用户'
    const operatorId = operatorInfo.value ? (operatorInfo.value.id || 0) : 0
    
    const data = {
      order_ids: [row.id],
      payment_finish_status: 3,
      operator: operator,
      operator_id: operatorId
    }
    
    request.post('/order/set/payment-status', data).then(res => {
      if (res.code === 0) {
        ElMessage.success('设置支付状态成功')
        // 更新本地数据
        row.payment_status = 3
        // 兼容旧字段
        row.payment_finish_status = 3
        row.payment_finish_time = new Date().toISOString()
      } else {
        ElMessage.error(res.message || '设置支付状态失败')
      }
    }).catch((error) => {
      console.log('设置支付状态错误:', error)
      ElMessage.error('网络错误，请稍后重试')
    }).finally(() => {
      row.settingPayment = false
    })
  }).catch(() => {
    // 用户取消操作
  })
}

// 查看单据（双击时调用，可以传入已有的 HTML 内容）
async function viewInvoice(invoiceUrl, invoiceHtml = null) {
  if (!invoiceUrl) {
    ElMessage.warning('暂无单据')
    return
  }
  
  // 在对话框中预览单据
  currentInvoiceUrl.value = invoiceUrl
  invoiceDialogVisible.value = true
  
  // 如果已经传入了 HTML 内容，直接使用
  if (invoiceHtml) {
    invoiceHtmlContent.value = invoiceHtml
    invoiceLoading.value = false
    return
  }
  
  // 否则重新获取
  invoiceLoading.value = true
  invoiceHtmlContent.value = ''
  
  try {
    // 使用 fetch 获取 HTML 内容，添加 mode: 'cors' 处理跨域
    const response = await fetch(invoiceUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const htmlText = await response.text()
    invoiceHtmlContent.value = htmlText
  } catch (error) {
    console.error('加载单据内容失败:', error)
    
    // 如果 fetch 失败（可能是 CORS 问题），显示提示信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      ElMessage.warning('无法直接加载内容，请使用"下载文件"查看')
      invoiceHtmlContent.value = `
        <div style="text-align: center; padding: 40px;">
          <p style="color: #909399; margin-bottom: 20px;">由于跨域限制，无法直接预览</p>
          <p style="color: #606266;">请点击下方"下载文件"按钮查看单据内容</p>
        </div>
      `
    } else {
      ElMessage.error('加载单据内容失败，请稍后重试')
      invoiceHtmlContent.value = '<div style="text-align: center; padding: 40px; color: #f56c6c;">加载失败，请检查网络连接</div>'
    }
  } finally {
    invoiceLoading.value = false
  }
}

// 下载文件（在新窗口打开）
function openInvoiceInNewWindow() {
  if (currentInvoiceUrl.value) {
    window.open(currentInvoiceUrl.value, '_blank')
  }
}

// 加载单个单据的 HTML 内容（用于表格中直接显示）
async function loadInvoiceHtml(row, index) {
  if (!row.invoice_url) return
  
  try {
    const response = await fetch(row.invoice_url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (response.ok) {
      const htmlText = await response.text()
      // 使用 Vue 的响应式更新
      row.invoice_html = htmlText
    }
  } catch (error) {
    console.error('加载单据内容失败:', error)
    // 如果加载失败，可以设置一个错误提示
    row.invoice_html = '<div style="text-align: center; padding: 20px; color: #909399;">加载失败</div>'
  }
}

// 查看详情
function viewDetail(row) {
  // 创建详情对话框
  const detailHtml = `
    <div style="max-width: 800px;">
      <h3 style="margin-bottom: 20px; color: #303133;">出库单详情</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div><strong>单号：</strong>${row.order_no || row.operation_no || '无'}</div>
        <div><strong>客户：</strong>${row.user_name || '无'}</div>
        <div><strong>操作人：</strong>${row.operator_name || row.operator || '无'}</div>
        <div><strong>出库时间：</strong>${formatDateTime(row.created_at)}</div>
        <div><strong>总数量：</strong><span style="color: #67c23a;">${row.total_quantity || 0}</span></div>
        <div><strong>总金额：</strong>¥${row.total_amount?.toFixed(2) || '0.00'}</div>
        <div><strong>总利润：</strong><span style="color: ${row.total_profit >= 0 ? '#67c23a' : '#f56c6c'}">¥${row.total_profit?.toFixed(2) || '0.00'}</span></div>
        <div><strong>支付状态：</strong>${getPaymentStatusText(row.payment_status)}${row.payment_status === 3 && row.payment_type ? ` (${getPaymentTypeText(row.payment_type)})` : ''}</div>
        <div><strong>出库类型：</strong>${row.outbound_type === 1 ? '小程序' : '后台'}</div>
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
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: right;">单价</th>
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: right;">总价</th>
              <th style="padding: 8px; border: 1px solid #e4e7ed; text-align: right;">利润</th>
            </tr>
          </thead>
          <tbody>
            ${row.items?.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e4e7ed;">${item.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed;">${item.specification || '无'}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed; text-align: right;">¥${item.unit_price?.toFixed(2) || '0.00'}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed; text-align: right;">¥${item.total_price?.toFixed(2) || '0.00'}</td>
                <td style="padding: 8px; border: 1px solid #e4e7ed; text-align: right; color: ${item.profit >= 0 ? '#67c23a' : '#f56c6c'}">¥${item.profit?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('') || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #909399;">暂无商品明细</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `
  
  ElMessageBox.alert(detailHtml, '出库单详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭',
    customClass: 'detail-dialog'
  })
}

// 分页处理
function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadOutboundList()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadOutboundList()
}

onMounted(() => {
  loadUserInfo()
  initDefaultDateRange() // 初始化默认时间范围
  orderType.value = 1 // 默认出库
  loadOutboundList()
  
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
