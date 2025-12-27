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
        <!-- 用户选择 -->
        <el-form-item label="选择用户" prop="user_id">
          <el-select
            v-model="rechargeForm.user_id"
            placeholder="请选择用户"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 100%;"
            @change="handleUserChange"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.admin_display_name} (${user.mobile_phone})`"
              :value="user.id"
            />
          </el-select>
          <div v-if="selectedUser" style="margin-top: 8px; color: #909399; font-size: 14px;">
            当前余额：¥{{ (selectedUser.balance || 0) / 100 }}
          </div>
        </el-form-item>

        <!-- 赠送类型 -->
        <el-form-item label="赠送类型" prop="gift_type">
          <el-radio-group v-model="rechargeForm.gift_type" @change="handleGiftTypeChange">
            <el-radio :label="0">只充值，无赠送</el-radio>
            <el-radio :label="1">额外赠送余额</el-radio>
            <el-radio :label="2">送虚拟物品</el-radio>
            <el-radio :label="10">仅赠送余额</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 充值金额 -->
        <el-form-item 
          label="充值金额（元）" 
          prop="amount"
          :rules="amountRules"
        >
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0"
            :precision="2"
            :step="100"
            :disabled="rechargeForm.gift_type === 10"
            placeholder="请输入充值金额"
            style="width: 100%;"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            <span v-if="rechargeForm.gift_type === 10">仅赠送时，充值金额必须为0</span>
            <span v-else>充值金额必须大于0</span>
          </div>
        </el-form-item>

        <!-- 赠送金额 -->
        <el-form-item 
          v-if="rechargeForm.gift_type === 1 || rechargeForm.gift_type === 10"
          label="赠送金额（元）" 
          prop="gift_amount"
          :rules="giftAmountRules"
        >
          <el-input-number
            v-model="rechargeForm.gift_amount"
            :min="0"
            :precision="2"
            :step="10"
            placeholder="请输入赠送金额"
            style="width: 100%;"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            <span v-if="rechargeForm.gift_type === 1">额外赠送时，赠送金额必须大于0</span>
            <span v-else-if="rechargeForm.gift_type === 10">仅赠送时，赠送金额必须大于0</span>
          </div>
        </el-form-item>

        <!-- 支付方式 -->
        <el-form-item 
          v-if="rechargeForm.gift_type !== 10"
          label="支付方式" 
          prop="payment_type"
        >
          <el-select
            v-model="rechargeForm.payment_type"
            placeholder="请选择支付方式"
            style="width: 100%;"
          >
            <el-option label="微信支付" :value="1" />
            <el-option label="余额支付" :value="2" />
            <el-option label="线下转账" :value="3" />
          </el-select>
        </el-form-item>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rechargeUser, getUserList } from '../api/user'

const rechargeFormRef = ref(null)
const submitting = ref(false)
const userSearchLoading = ref(false)
const userOptions = ref([])
const selectedUser = ref(null)

// 充值表单
const rechargeForm = reactive({
  user_id: null,
  amount: null,
  gift_type: 0,
  gift_amount: null,
  payment_type: 1,
  note: ''
})

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])

// 充值金额验证规则
const amountRules = computed(() => {
  return [
    {
      validator: (rule, value, callback) => {
        if (rechargeForm.gift_type === 10) {
          // 仅赠送时，金额必须为0
          if (value !== 0 && value !== null) {
            callback(new Error('仅赠送时，充值金额必须为0'))
          } else {
            callback()
          }
        } else {
          // 其他情况，金额必须大于0
          if (!value || value <= 0) {
            callback(new Error('充值金额必须大于0'))
          } else {
            callback()
          }
        }
      },
      trigger: 'blur'
    }
  ]
})

// 赠送金额验证规则
const giftAmountRules = computed(() => {
  return [
    {
      validator: (rule, value, callback) => {
        if (rechargeForm.gift_type === 1 || rechargeForm.gift_type === 10) {
          if (!value || value <= 0) {
            callback(new Error('赠送金额必须大于0'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 表单验证规则
const rechargeFormRules = {
  user_id: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  gift_type: [
    { required: true, message: '请选择赠送类型', trigger: 'change' }
  ],
  payment_type: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
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

// 搜索用户
function searchUsers(query) {
  if (!query) {
    userOptions.value = []
    return
  }
  
  userSearchLoading.value = true
  
  const params = {
    keyword: query,
    page: 1,
    page_size: 20
  }
  
  // 如果不是root用户，添加店铺筛选
  if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  getUserList(params).then(res => {
    if (res.code === 0) {
      userOptions.value = res.data?.list || []
    } else {
      ElMessage.error(res.message || '搜索用户失败')
      userOptions.value = []
    }
  }).catch(() => {
    ElMessage.error('搜索用户失败')
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

// 赠送类型变化
function handleGiftTypeChange() {
  // 重置相关字段
  if (rechargeForm.gift_type === 2) {
    // 送虚拟物品时，赠送金额必须为0
    rechargeForm.gift_amount = 0
  } else if (rechargeForm.gift_type === 10) {
    // 仅赠送时，充值金额必须为0
    rechargeForm.amount = 0
  }
}

// 提交表单
function submitForm() {
  rechargeFormRef.value.validate((valid) => {
    if (!valid) {
      return false
    }
    
    // 额外验证
    if (rechargeForm.gift_type === 1 && (!rechargeForm.gift_amount || rechargeForm.gift_amount <= 0)) {
      ElMessage.error('额外赠送余额时，赠送金额必须大于0')
      return
    }
    
    if (rechargeForm.gift_type === 2 && rechargeForm.gift_amount !== 0 && rechargeForm.gift_amount !== null) {
      ElMessage.error('送虚拟物品时，赠送金额必须为0')
      return
    }
    
    if (rechargeForm.gift_type === 10 && (rechargeForm.amount !== 0 && rechargeForm.amount !== null)) {
      ElMessage.error('仅赠送时，充值金额必须为0')
      return
    }
    
    if (rechargeForm.gift_type === 10 && (!rechargeForm.gift_amount || rechargeForm.gift_amount <= 0)) {
      ElMessage.error('仅赠送时，赠送金额必须大于0')
      return
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
      amount: Math.round((rechargeForm.amount || 0) * 100), // 转换为分
      gift_type: rechargeForm.gift_type,
      gift_amount: Math.round((rechargeForm.gift_amount || 0) * 100), // 转换为分
      payment_type: rechargeForm.payment_type,
      operator: operatorName,
      operator_id: operatorId,
      note: rechargeForm.note || '',
      shop_id: shopId
    }
    
    ElMessageBox.confirm(
      `确认${rechargeForm.gift_type === 10 ? '赠送' : '充值'}吗？`,
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
  rechargeForm.gift_type = 0
  rechargeForm.gift_amount = null
  rechargeForm.payment_type = 1
  rechargeForm.note = ''
  selectedUser.value = null
  userOptions.value = []
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
</style>

