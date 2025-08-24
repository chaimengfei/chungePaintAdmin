<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request'
import { getStockLogs } from '../api/stock'

const logs = ref([])
const goodsOptions = ref([])
const query = ref({ product_id: '', page: 1, page_size: 20 })
const total = ref(0)
const loading = ref(false)

function loadGoodsOptions() {
  request.get('/api/product/list').then(res => {
    const list = []
    for (const catId in res.products) {
      list.push(...res.products[catId])
    }
    goodsOptions.value = list.map(item => ({ label: item.name, value: item.id }))
  })
}

function loadLogs() {
  loading.value = true
  getStockLogs({ product_id: query.value.product_id, page: query.value.page, page_size: query.value.page_size }).then(res => {
    logs.value = res.data.list || []
    total.value = res.data.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function getOperationTypeText(type, outboundType) {
  if (type === 1) return '入库'
  if (type === 2) {
    if (outboundType === 1) return '销售出库'
    return '其他出库'
  }
  return '未知'
}

function getOperatorText(item) {
  if (item.operator_type === 1) {
    return item.user_name || '小程序用户'
  }
  return item.operator || '后台操作'
}

function handlePageChange(page) {
  query.value.page = page
  loadLogs()
}

onMounted(() => {
  loadGoodsOptions()
  loadLogs()
})
</script>

<template>
  <div>
    <div style="margin-bottom: 12px; display:flex; gap: 8px; align-items:center;">
      <el-select v-model="query.product_id" placeholder="筛选商品" clearable filterable style="width: 240px">
        <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="loadLogs">查询</el-button>
    </div>

    <el-table :data="logs" border style="width:100%" v-loading="loading">
      <el-table-column prop="operation_no" label="操作编号" width="200" />
      <el-table-column label="操作类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.types === 1 ? 'success' : 'danger'">
            {{ getOperationTypeText(row.types, row.outbound_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作人" width="120">
        <template #default="{ row }">
          {{ getOperatorText(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="总金额" width="120">
        <template #default="{ row }">
          ¥{{ row.total_amount }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="商品详情" min-width="300">
        <template #default="{ row }">
          <div v-if="row.items && row.items.length > 0">
            <div v-for="item in row.items" :key="item.id" style="margin-bottom: 8px; padding: 8px; border: 1px solid #eee; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: bold;">{{ item.product_name }}</span>
                <span style="color: #666;">{{ item.specification }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span>数量: {{ item.quantity }}</span>
                <span>单价: ¥{{ item.unit_price }}</span>
                <span>小计: ¥{{ item.total_price }}</span>
              </div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">
                库存: {{ item.before_stock }} → {{ item.after_stock }}
              </div>
            </div>
          </div>
          <span v-else style="color: #999;">暂无商品详情</span>
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
  </div>
</template> 