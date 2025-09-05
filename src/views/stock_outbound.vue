<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import request from '../api/request'
import { batchOutboundStock, getProductList } from '../api/stock'

const router = useRouter()

// 批量出库表单
const batchForm = reactive({
  items: [{ 
    product_id: '', 
    quantity: '', 
    unit_price: 0,
    default_price: 0,
    total_price: 0,
    product_name: '',
    unit: '',
    specification: '',
    remark: ''
  }],
  customer: '',
  operate_time: new Date().toLocaleString('sv-SE').slice(0, 19), // 默认当前本地日期时间
  remark: ''
})

const goodsOptions = ref([])
const goodsMap = ref({})
const customerOptions = ref([
  { label: '张三', value: '张三', user_id: 123 },
  { label: '李四', value: '李四', user_id: 456 }
])

function loadGoodsOptions() {
  getProductList({ page: 1, page_size: 100 }).then(res => {
    if (res.code === 0) {
      const list = res.data.list || []
      goodsOptions.value = list.map(item => ({ 
        label: item.name, 
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
    quantity: '', 
    unit_price: 0,
    default_price: 0,
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
  if (productId) {
    // 调用商品详情接口获取最新信息
    request.get(`/product/${productId}`).then(res => {
      if (res.code === 0 && res.data) {
        const product = res.data
        item.product_name = product.name
        item.unit = product.unit || '个'
        item.specification = product.specification || ''
        item.default_price = product.seller_price || 0
        // 不自动填充单价，让用户手动输入
        item.unit_price = 0
        item.total_price = 0
      }
    }).catch(() => {
      ElMessage.error('获取商品信息失败')
    })
  } else {
    item.product_name = ''
    item.unit = ''
    item.specification = ''
    item.unit_price = 0
    item.default_price = 0
    item.total_price = 0
  }
}

function calculateItemTotal(item) {
  if (item.quantity && item.unit_price) {
    item.total_price = item.quantity * item.unit_price
  }
}

// 单价输入框获得焦点时，清空默认价格提示
function onPriceFocus(item) {
  if (item.unit_price === 0 && item.default_price > 0) {
    item.unit_price = ''
  }
}

// 单价输入框失去焦点时，如果为空则恢复默认价格提示
function onPriceBlur(item) {
  if (!item.unit_price && item.default_price > 0) {
    item.unit_price = 0
  }
}

const totalAmount = computed(() => {
  return batchForm.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

function submitBatchForm() {
  if (!batchForm.customer) {
    ElMessage.error('请选择客户')
    return
  }
  
  const validItems = batchForm.items.filter(item => 
    item.product_id && item.quantity && item.unit_price && item.quantity > 0
  )
  if (validItems.length === 0) {
    ElMessage.error('请至少添加一个商品并填写完整信息')
    return
  }
  
  // 获取选中客户的user_id
  const selectedCustomer = customerOptions.value.find(customer => customer.value === batchForm.customer)
  
  const data = {
    items: validItems,
    total_amount: totalAmount.value,
    user_name: batchForm.customer,
    user_id: selectedCustomer ? selectedCustomer.user_id : null,
    operate_time: batchForm.operate_time.replace(' ', 'T') + '+08:00', // 保持本地时间，添加时区信息
    operator: "操作者",
    operator_id: 1001,
    remark: batchForm.remark
  }
  
  batchOutboundStock(data).then(() => {
    ElMessage.success('出库成功')
    router.push('/stock/outbound/list')
  }).catch(() => {
    ElMessage.error('出库失败')
  })
}

onMounted(() => {
  loadGoodsOptions()
})
</script>

<style scoped>
.product-item {
  border: 1px solid #dcdfe6;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: #fafafa;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: end;
}

.item-row.three-columns {
  grid-template-columns: 2fr 1fr 1fr;
}

.item-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group.half-width {
  grid-column: span 1;
}



.form-group label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.el-input:not([style*="flex"]),
.el-select {
  width: 100%;
}

.el-button {
  align-self: end;
}

/* 默认价格提示样式 */
.el-input__inner::placeholder {
  color: #c0c4cc;
  font-style: italic;
}
</style>

<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">出库-新增单</h1>
    </div>
    
    <el-card>
      <el-form label-width="120px" style="max-width: 1200px">
        <el-form-item>
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #606266;">客户</label>
              <el-select v-model="batchForm.customer" placeholder="请选择客户" style="width: 100%;">
                <el-option 
                  v-for="customer in customerOptions" 
                  :key="customer.value" 
                  :label="customer.label" 
                  :value="customer.value" 
                />
              </el-select>
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #606266;">出库日期</label>
              <el-date-picker
                v-model="batchForm.operate_time"
                type="datetime"
                placeholder="选择出库日期时间"
                style="width: 100%;"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </div>
        </el-form-item>
        
        
        <el-form-item label="商品列表">
          <div v-for="(item, index) in batchForm.items" :key="index" class="product-item">
            <!-- 第一行：名称、规格、单位 -->
            <div class="item-row">
              <div class="form-group">
                <label>名称</label>
                <el-select 
                  v-model="item.product_id" 
                  placeholder="选择商品" 
                  filterable 
                  style="width: 100%"
                  @change="(val) => onProductChange(item, val)"
                >
                  <el-option v-for="opt in goodsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </div>
              <div class="form-group">
                <label>规格</label>
                <el-input v-model="item.specification" placeholder="规格" readonly />
              </div>
              <div class="form-group">
                <label>单位</label>
                <el-input v-model="item.unit" placeholder="单位" readonly />
              </div>
            </div>
            
            <!-- 第二行：单价、数量、金额 -->
            <div class="item-row">
              <div class="form-group">
                <label>
                  单价
                  <el-tooltip content="可以使用默认的金额，也可以手动填充" placement="top">
                    <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </label>
                <el-input 
                  v-model.number="item.unit_price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  :placeholder="item.default_price ? `默认: ¥${item.default_price}` : '单价'"
                  @input="calculateItemTotal(item)"
                  @focus="onPriceFocus(item)"
                  @blur="onPriceBlur(item)"
                />
              </div>
              <div class="form-group">
                <label>数量</label>
                <el-input v-model.number="item.quantity" type="number" min="1" placeholder="请输入数量" @input="calculateItemTotal(item)" />
              </div>
              <div class="form-group">
                <label>金额</label>
                <el-input v-model.number="item.total_price" type="number" min="0" step="0.01" placeholder="金额" readonly />
              </div>
            </div>
            
            <!-- 第三行：备注 -->
            <div class="item-row three-columns">
              <div class="form-group">
                <label>备注</label>
                <el-input v-model="item.remark" placeholder="填写备注信息" />
              </div>
              <div class="form-group">
                <label>&nbsp;</label>
                <div style="height: 32px;"></div>
              </div>
              <div class="form-group">
                <el-button type="danger" size="small" @click="removeBatchItem(index)" :disabled="batchForm.items.length === 1">删除商品</el-button>
              </div>
            </div>
          </div>
          
          <el-button type="primary" @click="addBatchItem" style="margin-top: 16px;">添加商品</el-button>
        </el-form-item>
        
        <el-form-item label="总金额">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1;">
              <el-input v-model="totalAmount" readonly style="width: 200px;">
                <template #prepend>¥</template>
              </el-input>
            </div>
            <div style="flex: 5; display: flex; align-items: center; gap: 12px;">
              <label style="font-size: 14px; color: #606266; white-space: nowrap;">其它说明</label>
              <el-input v-model="batchForm.remark" placeholder="整体备注信息" style="flex: 1; width: 100%;" />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitBatchForm" size="large" style="font-size: 20px; padding: 15px 40px; font-weight: bold;">确认</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template> 