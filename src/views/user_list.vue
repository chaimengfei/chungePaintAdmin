<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">用户列表</h1>
    </div>
    
    <el-card>
      <!-- 搜索区域 -->
      <div style="margin-bottom: 20px; display: flex; gap: 16px; align-items: center;">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入用户姓名或手机号"
          style="width: 300px;"
          clearable
          @keyup.enter="loadUserList"
        />
        <el-button type="primary" @click="loadUserList">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="success" @click="showAddDialog">添加用户</el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="userList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="admin_display_name" label="用户名" width="150" />
        <el-table-column prop="mobile_phone" label="手机号" width="150" />
        <el-table-column label="所属店铺" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.shop_id === 1 ? 'primary' : 'success'">
              {{ scope.row.shop_id === 1 ? '燕郊店' : '涞水店' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.source === 1 ? 'success' : 'primary'">
              {{ scope.row.source === 1 ? '小程序' : '后台添加' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="微信绑定" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.has_wechat_bind === 1 ? 'success' : 'info'">
              {{ scope.row.has_wechat_bind === 1 ? '已绑定' : '未绑定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_enable === 1 ? 'success' : 'danger'">
              {{ scope.row.is_enable === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="info" size="small" @click="viewUserDetail(scope.row)">查看详情</el-button>
            <el-button type="primary" size="small" @click="viewUserAddress(scope.row)">查看地址</el-button>
            <el-button type="warning" size="small" @click="editUser(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增用户弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增用户"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="admin_display_name">
          <el-input
            v-model="addForm.admin_display_name"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="mobile_phone">
          <el-input
            v-model="addForm.mobile_phone"
            placeholder="请输入手机号"
            clearable
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="所属店铺" prop="shop_id">
          <el-select
            v-model="addForm.shop_id"
            placeholder="请选择店铺"
            style="width: 100%"
          >
            <el-option label="燕郊店" :value="1" />
            <el-option label="涞水店" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="addForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
            clearable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddForm" :loading="addSubmitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, deleteUser as deleteUserApi, addUser } from '../api/user'

const router = useRouter()

const userList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

// 新增用户相关
const addDialogVisible = ref(false)
const addSubmitting = ref(false)
const addFormRef = ref()
const addForm = reactive({
  admin_display_name: '',
  mobile_phone: '',
  shop_id: 1, // 默认燕郊店
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
  ]
}

// 加载用户列表
function loadUserList() {
  loading.value = true
  getUserList({
    page: currentPage.value,
    page_size: pageSize.value,
    keyword: searchKeyword.value
  }).then(res => {
    if (res.code === 0) {
      userList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  }).catch((error) => {
    console.log('网络错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }).finally(() => {
    loading.value = false
  })
}

// 重置搜索
function resetSearch() {
  searchKeyword.value = ''
  currentPage.value = 1
  loadUserList()
}

// 显示新增用户弹窗
function showAddDialog() {
  addDialogVisible.value = true
  // 重置表单
  Object.assign(addForm, {
    admin_display_name: '',
    mobile_phone: '',
    shop_id: 1, // 默认燕郊店
    remark: ''
  })
}

// 提交新增表单
function submitAddForm() {
  addFormRef.value.validate((valid) => {
    if (valid) {
      addSubmitting.value = true
      
      addUser(addForm).then(res => {
        if (res.code === 0) {
          ElMessage.success('添加用户成功')
          addDialogVisible.value = false
          loadUserList()
        } else {
          ElMessage.error(res.message || '添加用户失败')
        }
      }).catch((error) => {
        console.log('添加用户错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        addSubmitting.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
  })
}

// 查看用户详情
function viewUserDetail(user) {
  router.push({
    path: '/user/detail',
    query: { id: user.id }
  })
}

// 查看用户地址
function viewUserAddress(user) {
  router.push({
    path: '/address/list',
    query: { 
      user_id: user.id,
      user_name: user.admin_display_name 
    }
  })
}

// 编辑用户
function editUser(user) {
  router.push({
    path: '/user/edit',
    query: { id: user.id }
  })
}

// 删除用户
function deleteUser(user) {
  ElMessageBox.confirm(
    `确认删除用户 "${user.admin_display_name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteUserApi(user.id).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        loadUserList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch((error) => {
      console.log('删除用户错误:', error)
      ElMessage.error('网络错误，请稍后重试')
    })
  }).catch(() => {
    // 用户取消操作
  })
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

// 分页处理
function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadUserList()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadUserList()
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.el-table {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
