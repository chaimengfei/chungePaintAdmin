<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">入库列表</h1>
    </div>
    
    <el-card>
      <el-table :data="inboundList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="入库单号" width="120" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="total_amount" label="总金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.total_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="item_count" label="商品数量" width="100" />
        <el-table-column prop="operator_name" label="操作员" width="120" />
        <el-table-column prop="created_at" label="入库时间" width="180" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDetail(scope.row)">查看详情</el-button>
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
import { getInboundList } from '../api/stock'

const inboundList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载入库列表
function loadInboundList() {
  loading.value = true
  getInboundList({
    page: currentPage.value,
    page_size: pageSize.value
  }).then(res => {
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

// 查看详情
function viewDetail(row) {
  // TODO: 实现查看详情功能
  ElMessage.info('查看详情功能待实现')
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
  loadInboundList()
})
</script>

<style scoped>
.el-table {
  margin-top: 20px;
}
</style>
