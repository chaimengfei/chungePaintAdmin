<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProductList, deleteProduct } from '../api/stock'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const goods = ref([])
const loading = ref(false)
const total = ref(0)
const query = reactive({
  page: 1,
  page_size: 10
})

function loadGoods() {
  loading.value = true
  getProductList(query).then(res => {
    if (res.code === 0) {
      goods.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error('获取商品列表失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取商品列表失败')
  })
}

function editGoods(row) {
  router.push(`/goods/edit?id=${row.id}`)
}

function viewGoods(row) {
  router.push(`/goods/detail?id=${row.id}`)
}

function deleteGoods(row) {
  ElMessageBox.confirm(
    `确定要删除商品"${row.name}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteProduct(row.id).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        loadGoods()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch(() => {
      ElMessage.error('删除失败')
    })
  })
}

function handlePageChange(page) {
  query.page = page
  loadGoods()
}

function addGoods() {
  router.push('/goods/edit')
}

onMounted(() => {
  loadGoods()
})
</script>

<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>商品管理</h2>
      <el-button type="primary" @click="addGoods">添加商品</el-button>
    </div>
    
    <el-table :data="goods" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="商品图片" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.image" 
            :src="row.image" 
            style="width: 60px; height: 60px; object-fit: cover;"
            :preview-src-list="[row.image]"
          />
          <div v-else style="width: 60px; height: 60px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999;">
            无图
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column prop="specification" label="规格" width="120" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="seller_price" label="售价" width="100">
        <template #default="{ row }">
          ¥{{ row.seller_price }}
        </template>
      </el-table-column>
      <el-table-column prop="cost" label="成本" width="100">
        <template #default="{ row }">
          ¥{{ row.cost }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_on_shelf ? 'success' : 'info'">
            {{ row.is_on_shelf ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewGoods(row)">查看</el-button>
          <el-button size="small" type="primary" @click="editGoods(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteGoods(row)">删除</el-button>
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
