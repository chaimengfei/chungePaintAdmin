<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api/request'
import { batchInboundStock, getProductList } from '../api/stock'

const router = useRouter()

// 批量入库表单
const batchForm = reactive({
  items: [{ 
    product_id: '', 
    quantity: 1, 
    cost: 0,
    shipping_cost: 0,
    product_cost: 0,
    total_price: 0,
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  }],
  operator: '',
  operator_id: '',
  remark: ''
})

const goodsOptions = ref([])
const goodsMap = ref({})

function loadGoodsOptions() {
  getProductList({ page: 1, page_size: 100 }).then(res => {
    if (res.code === 0) {
      const list = res.data.list || []
      goodsOptions.value = list.map(item => ({ 
        label: `${item.name} (${item.specification || '无规格'})`, 
        value: item.id 
      }))
      goodsMap.value = {}
      list.forEach(item => {
        goodsMap.value[item.id] = item
      })
    }
  })
}

function addBatchItem() {
  batchForm.items.push({ 
    product_id: '', 
    quantity: 1, 
    cost: 0,
    shipping_cost: 0,
    product_cost: 0,
    total_price: 0,
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  })
}

function removeBatchItem(index) {
  if (batchForm.items.length > 1) {
    batchForm.items.splice(index, 1)
  }
}

function onProductChange(item, productId) {
  if (productId && goodsMap.value[productId]) {
    const product = goodsMap.value[productId]
    item.product_name = product.name
    item.unit = product.unit || '个'
    item.specification = product.specification || ''
  } else {
    item.product_name = ''
    item.unit = ''
    item.specification = ''
  }
  calculateItemTotal(item)
}

function calculateItemTotal(item) {
  if (item.quantity && item.cost) {
    item.product_cost = item.cost - (item.shipping_cost || 0)
    item.total_price = item.quantity * item.cost
  }
}

const totalAmount = computed(() => {
  return batchForm.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

function submitBatchForm() {
  if (!batchForm.operator || !batchForm.operator_id) {
    alert('请填写操作员信息')
    return
  }
  
  const validItems = batchForm.items.filter(item => 
    item.product_id && item.quantity && item.cost
  )
  if (validItems.length === 0) {
    alert('请至少添加一个商品并填写完整信息')
    return
  }
  
  const data = {
    items: validItems,
    total_amount: totalAmount.value,
    operator: batchForm.operator,
    operator_id: Number(batchForm.operator_id),
    remark: batchForm.remark
  }
  
  batchInboundStock(data).then(() => {
    router.push('/stock/logs')
  })
}

onMounted(() => {
  loadGoodsOptions()
})
</script>

<template>
  <div>
    <el-form label-width="120px" style="max-width: 1000px">
      <el-form-item label="操作员姓名">
        <el-input v-model="batchForm.operator" placeholder="请输入操作员姓名" style="width: 300px" />
      </el-form-item>
      <el-form-item label="操作员ID">
        <el-input v-model.number="batchForm.operator_id" type="number" placeholder="请输入操作员ID" style="width: 300px" />
      </el-form-item>
      <el-form-item label="商品列表">
        <div v-for="(item, index) in batchForm.items" :key="index" style="border: 1px solid #dcdfe6; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <el-select 
              v-model="item.product_id" 
              placeholder="选择商品" 
              filterable 
              style="width: 100%"
              @change="(val) => onProductChange(item, val)"
            >
              <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-input v-model.number="item.quantity" type="number" min="1" placeholder="数量" style="width: 100%" @input="calculateItemTotal(item)" />
            <el-input v-model.number="item.cost" type="number" min="0" step="0.01" placeholder="成本单价" style="width: 100%" @input="calculateItemTotal(item)" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <el-input v-model.number="item.shipping_cost" type="number" min="0" step="0.01" placeholder="运费" style="width: 100%" @input="calculateItemTotal(item)" />
            <el-input v-model.number="item.product_cost" type="number" min="0" step="0.01" placeholder="产品成本" style="width: 100%" readonly />
            <el-input v-model.number="item.total_price" type="number" min="0" step="0.01" placeholder="总价" style="width: 100%" readonly />
            <el-button type="danger" size="small" @click="removeBatchItem(index)" :disabled="batchForm.items.length === 1">删除</el-button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <el-input v-model="item.product_name" placeholder="商品名称" style="width: 100%" readonly />
            <el-input v-model="item.unit" placeholder="单位" style="width: 100%" readonly />
            <el-input v-model="item.specification" placeholder="规格" style="width: 100%" readonly />
          </div>
          <el-input v-model="item.remark" placeholder="商品备注" style="width: 100%" />
        </div>
        <el-button type="primary" @click="addBatchItem">添加商品</el-button>
      </el-form-item>
      <el-form-item label="总金额">
        <el-input v-model.number="totalAmount" type="number" readonly style="width: 300px" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="batchForm.remark" type="textarea" rows="3" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitBatchForm">批量入库</el-button>
      </el-form-item>
    </el-form>
  </div>
</template> 