<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">出库-列表</h1>
    </div>
    
    <el-card>
      <el-table :data="outboundList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="operation_no" label="出库单号" width="200" />
        <el-table-column prop="user_name" label="客户" width="120" />
        <el-table-column label="出库类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.outbound_type === 1 ? 'success' : 'primary'">
              {{ scope.row.outbound_type === 1 ? '小程序' : '后台' }}
            </el-tag>
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
        <el-table-column prop="payment_finish_status" label="支付状态" width="150">
          <template #default="scope">
            <el-tooltip 
              v-if="scope.row.payment_finish_status === 3 && scope.row.payment_finish_time" 
              :content="`支付时间: ${formatDateTime(scope.row.payment_finish_time)}`" 
              placement="top"
            >
              <el-tag type="success">支付完成</el-tag>
            </el-tooltip>
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
        <el-table-column prop="created_at" label="出库时间" width="180">
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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
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

const outboundList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载出库列表
function loadOutboundList() {
  loading.value = true
  request.get('/stock/operations', {
    params: {
      types: 2,
      page: currentPage.value,
      page_size: pageSize.value
    }
  }).then(res => {
    if (res.code === 0) {
      outboundList.value = res.data.list || []
      total.value = res.data.total || 0
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

// 设置支付状态
function setPaymentStatus(row) {
  ElMessageBox.confirm(
    `确认将出库单 ${row.operation_no} 设置为已支付状态吗？`,
    '设置支付状态',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 设置加载状态
    row.settingPayment = true
    
    const data = {
      operation_id: row.id,
      payment_finish_status: 3,
      operator: "我是操作人",
      operator_id: 1001
    }
    
    request.post('/stock/set/payment-status', data).then(res => {
      if (res.code === 0) {
        ElMessage.success('设置支付状态成功')
        // 更新本地数据
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

// 查看详情
function viewDetail(row) {
  // 创建详情对话框
  const detailHtml = `
    <div style="max-width: 800px;">
      <h3 style="margin-bottom: 20px; color: #303133;">出库单详情</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div><strong>出库单号：</strong>${row.operation_no}</div>
        <div><strong>客户：</strong>${row.user_name || '无'}</div>
        <div><strong>操作人：</strong>${row.operator || '无'}</div>
        <div><strong>出库时间：</strong>${formatDateTime(row.created_at)}</div>
        <div><strong>总金额：</strong>¥${row.total_amount?.toFixed(2) || '0.00'}</div>
        <div><strong>总利润：</strong><span style="color: ${row.total_profit >= 0 ? '#67c23a' : '#f56c6c'}">¥${row.total_profit?.toFixed(2) || '0.00'}</span></div>
        <div><strong>支付状态：</strong>${row.payment_finish_status === 3 ? '支付完成' : '未支付'}${row.payment_finish_status === 3 && row.payment_finish_time ? ` (${formatDateTime(row.payment_finish_time)})` : ''}</div>
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
  loadOutboundList()
})
</script>

<style scoped>
.el-table {
  margin-top: 20px;
}
</style>
