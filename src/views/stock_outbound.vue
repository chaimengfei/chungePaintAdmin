<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api/request'
import { batchOutboundStock } from '../api/stock'

const router = useRouter()

// 批量出库表单
const batchForm = reactive({
  items: [{ product_id: '', quantity: 1 }],
  user_name: '',
  user_id: '',
  user_account: '',
  purchase_time: '',
  operator: '',
  operator_id: '',
  remark: ''
})

const goodsOptions = ref([])

function loadGoodsOptions() {
  request.get('/api/product/list').then(res => {
    const list = []
    for (const catId in res.products) {
      list.push(...res.products[catId])
    }
    goodsOptions.value = list.map(item => ({ label: item.name, value: item.id }))
  })
}

function addBatchItem() {
  batchForm.items.push({ product_id: '', quantity: 1 })
}

function removeBatchItem(index) {
  if (batchForm.items.length > 1) {
    batchForm.items.splice(index, 1)
  }
}

function submitBatchForm() {
  if (!batchForm.user_name || !batchForm.user_id || !batchForm.operator || !batchForm.operator_id) {
    alert('请填写客户信息和操作员信息')
    return
  }
  
  const validItems = batchForm.items.filter(item => item.product_id && item.quantity)
  if (validItems.length === 0) {
    alert('请至少添加一个商品')
    return
  }
  
  const data = {
    items: validItems,
    user_name: batchForm.user_name,
    user_id: Number(batchForm.user_id),
    user_account: batchForm.user_account,
    purchase_time: batchForm.purchase_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
    operator: batchForm.operator,
    operator_id: Number(batchForm.operator_id),
    remark: batchForm.remark
  }
  
  batchOutboundStock(data).then(() => {
    router.push('/stock/logs')
  })
}

onMounted(() => {
  loadGoodsOptions()
})
</script>

<template>
  <div>
    <el-form label-width="100px" style="max-width: 800px">
      <el-form-item label="客户姓名">
        <el-input v-model="batchForm.user_name" placeholder="请输入客户姓名" style="width: 300px" />
      </el-form-item>
      <el-form-item label="客户ID">
        <el-input v-model.number="batchForm.user_id" type="number" placeholder="请输入客户ID" style="width: 300px" />
      </el-form-item>
      <el-form-item label="客户账号">
        <el-input v-model="batchForm.user_account" placeholder="请输入客户账号/手机号" style="width: 300px" />
      </el-form-item>
      <el-form-item label="购买时间">
        <el-input v-model="batchForm.purchase_time" placeholder="格式：2024-01-15 14:30:00" style="width: 300px" />
      </el-form-item>
      <el-form-item label="操作员姓名">
        <el-input v-model="batchForm.operator" placeholder="请输入操作员姓名" style="width: 300px" />
      </el-form-item>
      <el-form-item label="操作员ID">
        <el-input v-model.number="batchForm.operator_id" type="number" placeholder="请输入操作员ID" style="width: 300px" />
      </el-form-item>
      <el-form-item label="商品列表">
        <div v-for="(item, index) in batchForm.items" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
          <el-select v-model="item.product_id" placeholder="选择商品" filterable style="width: 300px">
            <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input v-model.number="item.quantity" type="number" min="1" placeholder="数量" style="width: 120px" />
          <el-button type="danger" size="small" @click="removeBatchItem(index)" :disabled="batchForm.items.length === 1">删除</el-button>
        </div>
        <el-button type="primary" @click="addBatchItem">添加商品</el-button>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="batchForm.remark" type="textarea" rows="3" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitBatchForm">批量出库</el-button>
      </el-form-item>
    </el-form>
  </div>
</template> 