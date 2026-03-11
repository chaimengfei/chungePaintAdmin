<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">会员充值</h1>
    </div>

    <el-card>
      <el-form
        ref="rechargeFormRef"
        :model="rechargeForm"
        :rules="rechargeFormRules"
        label-width="140px"
        style="max-width: 800px;"
      >
        <!-- 选择用户、充值金额：一行展示，各占 1/2，顶部对齐 -->
        <div style="display: flex; gap: 24px; align-items: flex-start; margin-bottom: 18px;">
          <el-form-item label="选择用户" prop="user_id" style="flex: 1; margin-bottom: 0;">
            <el-select
              v-model="rechargeForm.user_id"
              placeholder="请选择用户"
              filterable
              :loading="userSearchLoading"
              style="width: 100%;"
              @change="handleUserChange"
            >
              <el-option
                v-for="user in userOptions"
                :key="user.id"
                :label="`${user.admin_display_name || user.name || '未知用户'} (${user.mobile_phone || ''})`"
                :value="user.id"
              />
            </el-select>
            <div v-if="selectedUser" style="margin-top: 8px; color: #909399; font-size: 14px;">
              <template v-if="selectedUser.first_recharge_at">
                当前余额：¥{{ selectedUser.balance ?? 0 }}
              </template>
              <template v-else>
                之前未充值过
              </template>
            </div>
          </el-form-item>
          <el-form-item 
            label="充值金额（元）" 
            prop="amount"
            :rules="amountRules"
            style="flex: 1; margin-bottom: 0;"
          >
            <el-input-number
              v-model="rechargeForm.amount"
              :min="0"
              :precision="2"
              :step="100"
              placeholder="请输入充值金额"
              style="width: 100%;"
            />
          </el-form-item>
        </div>

        <!-- 备注 -->
        <el-form-item label="备注" prop="note">
          <el-input
            v-model="rechargeForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitForm">确认充值</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request'
import { rechargeUser } from '../api/user'

const rechargeFormRef = ref(null)
const submitting = ref(false)
const userSearchLoading = ref(false)
const userOptions = ref([])
const selectedUser = ref(null)

// 充值表单
const rechargeForm = reactive({
  user_id: null,
  amount: null,
  note: ''
})

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

// 充值金额验证规则
const amountRules = [
  {
    validator: (rule, value, callback) => {
      if (value == null || value === '' || Number(value) <= 0) {
        callback(new Error('充值金额必须大于0'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
]

// 表单验证规则
const rechargeFormRules = {
  user_id: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ]
}

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
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
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
}

// 获取当前店铺ID（与出库单逻辑一致）
function getCurrentShopId() {
  if (!isRoot.value && shopInfo.value) return shopInfo.value.id
  if (isRoot.value && shopList.value.length > 0) return shopList.value[0]?.id ?? null
  return null
}

// 加载客户列表：与出库单一致，使用 /user/list + shop_id
function loadCustomerOptions() {
  const shopId = getCurrentShopId()
  if (!shopId) {
    userOptions.value = []
    return
  }
  userSearchLoading.value = true
  request.get('/user/list', {
    params: { page: 1, page_size: 100, shop_id: shopId }
  }).then(res => {
    if (res.code === 0) {
      userOptions.value = res.data?.list || []
    } else {
      ElMessage.error(res.message || '获取客户列表失败')
      userOptions.value = []
    }
  }).catch(() => {
    ElMessage.error('获取客户列表失败')
    userOptions.value = []
  }).finally(() => {
    userSearchLoading.value = false
  })
}

// 用户选择变化
function handleUserChange(userId) {
  if (userId) {
    const user = userOptions.value.find(u => u.id === userId)
    if (user) {
      selectedUser.value = user
    } else {
      // 如果不在选项中，尝试获取用户详情
      selectedUser.value = { id: userId, balance: 0 }
    }
  } else {
    selectedUser.value = null
  }
}

// 提交表单
function submitForm() {
  rechargeFormRef.value.validate((valid) => {
    if (!valid) {
      return false
    }
    
    // 获取操作员信息
    const operator = localStorage.getItem('operator')
    let operatorName = '管理员'
    let operatorId = 0
    
    if (operator && operator !== 'null') {
      try {
        const operatorInfo = JSON.parse(operator)
        operatorName = operatorInfo.real_name || operatorInfo.name || '管理员'
        operatorId = operatorInfo.id || 0
      } catch (error) {
        console.error('解析操作员信息失败:', error)
      }
    }
    
    // 获取店铺ID
    let shopId = null
    if (!isRoot.value && shopInfo.value) {
      shopId = shopInfo.value.id
    } else if (isRoot.value && shopList.value.length > 0) {
      // root用户可以选择店铺，这里默认使用第一个店铺
      shopId = shopList.value[0]?.id || null
    }
    
    const data = {
      user_id: rechargeForm.user_id,
      amount: Number((rechargeForm.amount || 0).toFixed(2)), // 单位：元，原样传递
      operator: operatorName,
      operator_id: operatorId,
      note: rechargeForm.note || '',
      shop_id: shopId
    }
    
    ElMessageBox.confirm(
      '确认充值吗？',
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      submitting.value = true
      
      rechargeUser(data).then(res => {
        if (res.code === 0) {
          ElMessage.success(res.message || '操作成功')
          resetForm()
          // 刷新用户信息
          if (rechargeForm.user_id) {
            handleUserChange(rechargeForm.user_id)
          }
        } else {
          ElMessage.error(res.message || '操作失败')
        }
      }).catch(() => {
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        submitting.value = false
      })
    }).catch(() => {
      // 用户取消
    })
  })
}

// 重置表单
function resetForm() {
  rechargeFormRef.value?.resetFields()
  rechargeForm.user_id = null
  rechargeForm.amount = null
  rechargeForm.note = ''
  selectedUser.value = null
  loadCustomerOptions()
}

onMounted(() => {
  loadUserInfo()
  loadCustomerOptions()
})
</script>

<style scoped>
</style>

