<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">编辑用户</h1>
    </div>
    
    <el-card>
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="120px"
        style="max-width: 600px;"
      >
        <el-form-item label="用户名" prop="admin_display_name">
          <el-input
            v-model="userForm.admin_display_name"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="mobile_phone">
          <el-input
            v-model="userForm.mobile_phone"
            placeholder="请输入手机号"
            clearable
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="所属店铺" prop="shop_id">
          <!-- 普通管理员显示固定店铺 -->
          <el-input 
            v-if="!isRoot && shopInfo" 
            :value="shopInfo.name" 
            disabled 
            style="width: 100%;"
          />
          <!-- Root用户显示店铺选择器 -->
          <el-select 
            v-else-if="isRoot && shopList.length > 0"
            v-model="userForm.shop_id" 
            placeholder="请选择店铺" 
            style="width: 100%;"
            @change="handleShopChange"
          >
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
          <span v-else style="color: #909399;">暂无店铺信息</span>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_enable">
          <el-radio-group v-model="userForm.is_enable">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="userForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            更新用户
          </el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserDetail, editUser } from '../api/user'

const router = useRouter()
const route = useRoute()

const userFormRef = ref()
const submitting = ref(false)
const loading = ref(false)

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
  userForm.shop_id = shopId
}

// 表单数据
const userForm = reactive({
  id: null,
  admin_display_name: '',
  mobile_phone: '',
  shop_id: null, // 店铺ID，由权限控制设置
  is_enable: 1,
  remark: ''
})

// 表单验证规则
const userFormRules = {
  admin_display_name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  mobile_phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  is_enable: [
    { required: true, message: '请选择用户状态', trigger: 'change' }
  ]
}

// 加载用户详情
function loadUserDetail() {
  const userId = route.query.id
  if (!userId) {
    ElMessage.error('用户ID不存在')
    router.push('/user/list')
    return
  }
  
  loading.value = true
  getUserDetail(userId).then(res => {
    if (res.code === 0) {
      const user = res.data
      userForm.id = user.id
      userForm.admin_display_name = user.admin_display_name || ''
      userForm.mobile_phone = user.mobile_phone || ''
      userForm.shop_id = user.shop_id || null
      userForm.is_enable = user.is_enable
      userForm.remark = user.remark || ''
      
      // 如果是root用户，设置选中的店铺ID
      if (isRoot.value && user.shop_id) {
        selectedShopId.value = user.shop_id
      }
    } else {
      ElMessage.error(res.message || '获取用户详情失败')
      router.push('/user/list')
    }
  }).catch((error) => {
    console.log('获取用户详情错误:', error)
    ElMessage.error('网络错误，请稍后重试')
    router.push('/user/list')
  }).finally(() => {
    loading.value = false
  })
}

// 提交表单
function submitForm() {
  userFormRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      
      editUser({
        id: userForm.id,
        admin_display_name: userForm.admin_display_name,
        mobile_phone: userForm.mobile_phone,
        shop_id: userForm.shop_id,
        is_enable: userForm.is_enable,
        remark: userForm.remark
      }).then(res => {
        if (res.code === 0) {
          ElMessage.success('更新用户成功')
          router.push('/user/list')
        } else {
          ElMessage.error(res.message || '更新用户失败')
        }
      }).catch((error) => {
        console.log('更新用户错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        submitting.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
  })
}

// 重置表单
function resetForm() {
  loadUserDetail()
}

// 返回
function goBack() {
  router.push('/user/list')
}

onMounted(() => {
  loadUserInfo()
  loadUserDetail()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<style scoped>
.el-form {
  margin-top: 20px;
}
</style>
