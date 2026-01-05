<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>用户详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editUser">编辑</el-button>
      </div>
    </div>
    
    <div v-loading="loading">
      <el-card v-if="user.id" style="max-width: 800px;">
        <el-descriptions title="基本信息" :column="1" border>
          <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ user.admin_display_name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ user.mobile_phone }}</el-descriptions-item>
          <el-descriptions-item label="所属店铺">
            <el-tag :type="user.shop_id === 1 ? 'primary' : 'success'">
              {{ user.shop_id === 1 ? '燕郊店' : '涞水店' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag :type="user.source === 1 ? 'success' : 'primary'">
              {{ user.source === 1 ? '小程序' : '后台添加' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="微信绑定">
            <el-tag :type="user.has_wechat_bind === 1 ? 'success' : 'info'">
              {{ user.has_wechat_bind === 1 ? '已绑定' : '未绑定' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="user.is_enable === 1 ? 'success' : 'danger'">
              {{ user.is_enable === 1 ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="user.is_test === 1" label="账号标识">
            测试号
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            <span v-if="user.employ === 1">工厂</span>
            <span v-else-if="user.employ === 2">工人-包活</span>
            <span v-else-if="user.employ === 3">工人-不包活</span>
            <span v-else style="color: #909399;">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="行业">
            <span v-if="user.industry === 1">雕塑</span>
            <span v-else-if="user.industry === 2">广告</span>
            <span v-else style="color: #909399;">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ user.remark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(user.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserDetail } from '../api/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const user = ref({})

onMounted(() => {
  const id = route.query.id
  if (id) {
    loadUserDetail(id)
  } else {
    ElMessage.error('用户ID不存在')
    router.push('/user/list')
  }
})

function loadUserDetail(id) {
  loading.value = true
  getUserDetail(id).then(res => {
    if (res.code === 0) {
      user.value = res.data
    } else {
      ElMessage.error('获取用户详情失败')
      router.push('/user/list')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取用户详情失败')
    router.push('/user/list')
  })
}

function goBack() {
  router.push('/user/list')
}

function editUser() {
  router.push(`/user/edit?id=${user.value.id}`)
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.el-card {
  margin-top: 20px;
}
</style>

