<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>后台管理系统</h2>
        <p>请登录您的账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="operator_name">
          <el-input
            v-model="loginForm.operator_name"
            placeholder="请输入账号名"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'

const router = useRouter()

const loginFormRef = ref()
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  operator_name: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  operator_name: [
    { required: true, message: '请输入账号名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 处理登录
function handleLogin() {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      login(loginForm).then(res => {
        if (res.code === 0) {
          // 保存token和用户信息到localStorage
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('operator', JSON.stringify(res.data.operator))
          localStorage.setItem('shop_info', JSON.stringify(res.data.shop_info))
          localStorage.setItem('shop_list', JSON.stringify(res.data.shop_list))
          
          // 触发自定义事件，通知 App.vue 更新用户信息
          window.dispatchEvent(new CustomEvent('userInfoUpdated'))
          
          ElMessage.success('登录成功')
          
          // 跳转到出库单页面
          router.push('/stock/outbound')
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      }).catch((error) => {
        console.log('登录错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        loading.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #303133;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  height: 45px;
  border-radius: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
