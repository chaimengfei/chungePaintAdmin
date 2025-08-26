<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api/request'
import { returnStock, getProductList } from '../api/stock'

const router = useRouter()
const form = reactive({
  product_id: '',
  quantity: 1,
  remark: ''
})

const goodsOptions = ref([])

function loadGoodsOptions() {
  getProductList({ page: 1, page_size: 100 }).then(res => {
    if (res.code === 0) {
      const list = res.data.list || []
      goodsOptions.value = list.map(item => ({ label: item.name, value: item.id }))
    }
  })
}

function submitForm() {
  if (!form.product_id || !form.quantity) return
  returnStock({ product_id: form.product_id, quantity: Number(form.quantity), remark: form.remark }).then(() => {
    router.push('/stock/logs')
  })
}

onMounted(() => {
  loadGoodsOptions()
})
</script>

<template>
  <div>
    <el-form label-width="80px" style="max-width: 480px">
      <el-form-item label="商品">
        <el-select v-model="form.product_id" placeholder="请选择商品" filterable style="width:100%">
          <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input v-model.number="form.quantity" type="number" min="1" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" rows="3" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">退货</el-button>
      </el-form-item>
    </el-form>
  </div>
</template> 