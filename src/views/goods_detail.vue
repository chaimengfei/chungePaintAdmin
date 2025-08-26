<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '../api/stock'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const product = ref({})

onMounted(() => {
  const id = route.query.id
  if (id) {
    loadProductDetail(id)
  } else {
    ElMessage.error('商品ID不存在')
    router.push('/goods')
  }
})

function loadProductDetail(id) {
  loading.value = true
  getProductDetail(id).then(res => {
    if (res.code === 0) {
      product.value = res.data
    } else {
      ElMessage.error('获取商品详情失败')
      router.push('/goods')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取商品详情失败')
    router.push('/goods')
  })
}

function goBack() {
  router.push('/goods')
}

function editProduct() {
  router.push(`/goods/edit?id=${product.value.id}`)
}
</script>

<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>商品详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editProduct">编辑</el-button>
      </div>
    </div>
    
    <div v-loading="loading">
      <el-card v-if="product.id" style="max-width: 800px;">
        <el-row :gutter="40">
          <el-col :span="12">
            <div style="text-align: center; margin-bottom: 20px;">
              <el-image 
                v-if="product.image" 
                :src="product.image" 
                style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px;"
                :preview-src-list="[product.image]"
              />
              <div v-else style="width: 300px; height: 300px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #999;">
                暂无图片
              </div>
            </div>
          </el-col>
          
          <el-col :span="12">
            <el-descriptions title="基本信息" :column="1" border>
              <el-descriptions-item label="商品ID">{{ product.id }}</el-descriptions-item>
              <el-descriptions-item label="商品名称">{{ product.name }}</el-descriptions-item>
              <el-descriptions-item label="商品分类">
                <el-tag v-if="product.category_id === 1">油漆类</el-tag>
                <el-tag v-else-if="product.category_id === 2" type="success">工具类</el-tag>
                <el-tag v-else type="info">其他</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="商品规格">{{ product.specification || '无' }}</el-descriptions-item>
              <el-descriptions-item label="商品单位">{{ product.unit }}</el-descriptions-item>
              <el-descriptions-item label="商品状态">
                <el-tag :type="product.is_on_shelf ? 'success' : 'info'">
                  {{ product.is_on_shelf ? '上架' : '下架' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <el-descriptions title="价格信息" :column="1" border style="margin-top: 20px;">
              <el-descriptions-item label="售价">¥{{ product.seller_price }}</el-descriptions-item>
              <el-descriptions-item label="成本">¥{{ product.cost }}</el-descriptions-item>
              <el-descriptions-item label="运费">¥{{ product.shipping_cost || 0 }}</el-descriptions-item>
              <el-descriptions-item label="产品成本">¥{{ product.product_cost }}</el-descriptions-item>
              <el-descriptions-item label="当前库存">{{ product.stock }}</el-descriptions-item>
            </el-descriptions>
            
            <el-descriptions title="其他信息" :column="1" border style="margin-top: 20px;">
              <el-descriptions-item label="商品备注">{{ product.remark || '无' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>
