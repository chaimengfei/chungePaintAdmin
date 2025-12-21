<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { addFee } from '../api/order'

const router = useRouter()

// 费用类型选项
const feeTypeOptions = [
  { label: '物流费', value: 6 },
  { label: '快递费', value: 7 },
  { label: '车加油费', value: 8 },
  { label: '请客吃饭的开销', value: 9 },
  { label: '出差', value: 10 },
  { label: '其他费用', value: 11 }
]

// 费用表单
const feeForm = reactive({
  business_type: null,  // 费用类型
  business_desc: '',    // 费用描述
  amount: 0,           // 金额（单位：分）
  remark: ''           // 备注
})

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
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
}

// 获取费用类型描述
const feeTypeLabel = computed(() => {
  const option = feeTypeOptions.find(opt => opt.value === feeForm.business_type)
  return option ? option.label : ''
})

// 提交表单
function submitForm() {
  // 验证费用类型
  if (!feeForm.business_type) {
    ElMessage.error('请选择费用类型')
    return
  }
  
  // 验证费用描述
  if (!feeForm.business_desc || feeForm.business_desc.trim() === '') {
    ElMessage.error('请填写费用描述')
    return
  }
  
  // 验证金额
  if (!feeForm.amount || feeForm.amount <= 0) {
    ElMessage.error('请填写正确的金额')
    return
  }
  
  // 如果是其他费用，必须填写备注
  if (feeForm.business_type === 11 && (!feeForm.remark || feeForm.remark.trim() === '')) {
    ElMessage.error('其他费用必须填写备注')
    return
  }
  
  // 准备提交数据（金额转换为分）
  const data = {
    business_type: feeForm.business_type,
    business_desc: feeForm.business_desc.trim(),
    amount: Math.round(feeForm.amount * 100), // 转换为分
    remark: feeForm.remark.trim() || ''
  }
  
  addFee(data).then((res) => {
    if (res.code === 0) {
      ElMessage.success('费用记录添加成功')
      // 重置表单
      feeForm.business_type = null
      feeForm.business_desc = ''
      feeForm.amount = 0
      feeForm.remark = ''
    } else {
      ElMessage.error(res.message || '费用记录添加失败')
    }
  }).catch((error) => {
    console.error('添加费用记录失败:', error)
    ElMessage.error('费用记录添加失败')
  })
}

onMounted(() => {
  loadUserInfo()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<template>
  <div>
    <el-card>
      <el-form label-width="120px" style="max-width: 800px">
        <!-- 店铺选择 -->
        <el-form-item label="所属店铺" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <!-- Root用户显示店铺选择器 -->
              <el-select
                v-if="isRoot && shopList.length > 0"
                v-model="selectedShopId"
                placeholder="请选择店铺"
                style="flex: 1;"
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
                style="flex: 1;"
              />
            </div>
          </div>
        </el-form-item>
        
        <!-- 费用类型 -->
        <el-form-item label="费用类型" style="margin-bottom: 20px;" required>
          <el-select
            v-model="feeForm.business_type"
            placeholder="请选择费用类型"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="option in feeTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <!-- 补充信息 -->
        <el-form-item 
          label="补充信息" 
          style="margin-bottom: 20px;"
          :required="feeForm.business_type === 11"
        >
          <el-input
            v-model="feeForm.remark"
            placeholder="请输入补充信息（其他费用必须填写）"
            style="width: 100%;"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 金额 -->
        <el-form-item label="金额" style="margin-bottom: 20px;" required>
          <el-input-number
            v-model="feeForm.amount"
            :min="0"
            :precision="2"
            :step="0.01"
            placeholder="请输入金额（元）"
            style="width: 100%;"
          >
            <template #prepend>¥</template>
          </el-input-number>
        </el-form-item>
        
        <!-- 费用描述 -->
        <el-form-item label="费用描述" style="margin-bottom: 20px;" required>
          <el-input
            v-model="feeForm.business_desc"
            type="textarea"
            :rows="4"
            placeholder="请输入费用描述"
            style="width: 100%;"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" size="large" style="font-size: 18px; padding: 12px 40px; font-weight: bold;">确认提交</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.el-input-number {
  width: 100%;
}
</style>

