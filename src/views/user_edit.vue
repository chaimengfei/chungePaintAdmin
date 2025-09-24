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

// 表单数据
const userForm = reactive({
  id: null,
  admin_display_name: '',
  mobile_phone: '',
  shop_id: 1, // 默认燕郊店
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
      userForm.shop_id = user.shop_id || 1
      userForm.is_enable = user.is_enable
      userForm.remark = user.remark || ''
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
  loadUserDetail()
})
</script>

<style scoped>
.el-form {
  margin-top: 20px;
}
</style>
