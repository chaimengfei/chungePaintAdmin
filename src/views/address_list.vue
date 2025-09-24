<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">地址列表</h1>
    </div>
    
    <el-card>
      <!-- 搜索区域 -->
      <div style="margin-bottom: 20px; display: flex; gap: 16px; align-items: center;">
        <el-input
          v-model="searchForm.user_id"
          placeholder="请输入用户ID"
          style="width: 150px;"
          clearable
        />
        <el-input
          v-model="searchForm.user_name"
          placeholder="请输入用户姓名"
          style="width: 200px;"
          clearable
        />
        <el-button type="primary" @click="loadAddressList">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="success" @click="showAddDialog">新增地址</el-button>
      </div>

      <!-- 地址表格 -->
      <el-table :data="addressList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="address_id" label="地址ID" width="100" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="recipient_name" label="收货人" width="120" />
        <el-table-column prop="recipient_phone" label="收货电话" width="150" />
        <el-table-column label="地址" min-width="300">
          <template #default="scope">
            {{ scope.row.province }}{{ scope.row.city }}{{ scope.row.district }}{{ scope.row.detail }}
          </template>
        </el-table-column>
        <el-table-column label="默认地址" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_default ? 'success' : 'info'">
              {{ scope.row.is_default ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="warning" size="small" @click="editAddress(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteAddress(scope.row)">删除</el-button>
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

    <!-- 新增地址弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增地址"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addressFormRules"
        label-width="100px"
      >
        <el-form-item label="用户ID" prop="user_id">
          <el-input
            v-model="addForm.user_id"
            placeholder="请输入用户ID"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="收货人" prop="recipient_name">
          <el-input
            v-model="addForm.recipient_name"
            placeholder="请输入收货人姓名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="收货电话" prop="recipient_phone">
          <el-input
            v-model="addForm.recipient_phone"
            placeholder="请输入收货电话"
            clearable
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="省份" prop="province">
          <el-input
            v-model="addForm.province"
            placeholder="请输入省份"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="城市" prop="city">
          <el-input
            v-model="addForm.city"
            placeholder="请输入城市"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="区县" prop="district">
          <el-input
            v-model="addForm.district"
            placeholder="请输入区县"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="addForm.detail"
            type="textarea"
            placeholder="请输入详细地址"
            :rows="3"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="默认地址" prop="is_default">
          <el-switch
            v-model="addForm.is_default"
            active-text="是"
            inactive-text="否"
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

    <!-- 编辑地址弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑地址"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="addressFormRules"
        label-width="100px"
      >
        <el-form-item label="用户ID" prop="user_id">
          <el-input
            v-model="editForm.user_id"
            placeholder="请输入用户ID"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="收货人" prop="recipient_name">
          <el-input
            v-model="editForm.recipient_name"
            placeholder="请输入收货人姓名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="收货电话" prop="recipient_phone">
          <el-input
            v-model="editForm.recipient_phone"
            placeholder="请输入收货电话"
            clearable
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="省份" prop="province">
          <el-input
            v-model="editForm.province"
            placeholder="请输入省份"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="城市" prop="city">
          <el-input
            v-model="editForm.city"
            placeholder="请输入城市"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="区县" prop="district">
          <el-input
            v-model="editForm.district"
            placeholder="请输入区县"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="editForm.detail"
            type="textarea"
            placeholder="请输入详细地址"
            :rows="3"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="默认地址" prop="is_default">
          <el-switch
            v-model="editForm.is_default"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm" :loading="editSubmitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAddressList, addAddress, editAddress as editAddressApi, deleteAddress as deleteAddressApi } from '../api/address'

const route = useRoute()
const addressList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  user_id: '',
  user_name: ''
})

// 新增地址相关
const addDialogVisible = ref(false)
const addSubmitting = ref(false)
const addFormRef = ref()
const addForm = reactive({
  user_id: '',
  recipient_name: '',
  recipient_phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

// 编辑地址相关
const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  user_id: '',
  recipient_name: '',
  recipient_phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

// 表单验证规则
const addressFormRules = {
  user_id: [
    { required: true, message: '请输入用户ID', trigger: 'blur' },
    { pattern: /^\d+$/, message: '用户ID必须为数字', trigger: 'blur' }
  ],
  recipient_name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '收货人姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  recipient_phone: [
    { required: true, message: '请输入收货电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请输入省份', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  district: [
    { required: true, message: '请输入区县', trigger: 'blur' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 加载地址列表
function loadAddressList() {
  loading.value = true
  const params = {
    page: currentPage.value,
    page_size: pageSize.value
  }
  
  if (searchForm.user_id) {
    params.user_id = searchForm.user_id
  }
  if (searchForm.user_name) {
    params.user_name = searchForm.user_name
  }
  
  getAddressList(params).then(res => {
    if (res.code === 0) {
      addressList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取地址列表失败')
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
  searchForm.user_id = ''
  searchForm.user_name = ''
  currentPage.value = 1
  loadAddressList()
}

// 显示新增地址弹窗
function showAddDialog() {
  addDialogVisible.value = true
  // 重置表单
  Object.assign(addForm, {
    user_id: '',
    recipient_name: '',
    recipient_phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false
  })
}

// 提交新增表单
function submitAddForm() {
  addFormRef.value.validate((valid) => {
    if (valid) {
      addSubmitting.value = true
      
      addAddress(addForm).then(res => {
        if (res.code === 0) {
          ElMessage.success('新增地址成功')
          addDialogVisible.value = false
          loadAddressList()
        } else {
          ElMessage.error(res.message || '新增地址失败')
        }
      }).catch((error) => {
        console.log('新增地址错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        addSubmitting.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
  })
}

// 编辑地址
function editAddress(address) {
  editDialogVisible.value = true
  Object.assign(editForm, {
    id: address.address_id,
    user_id: address.user_id,
    recipient_name: address.recipient_name,
    recipient_phone: address.recipient_phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    is_default: address.is_default
  })
}

// 提交编辑表单
function submitEditForm() {
  editFormRef.value.validate((valid) => {
    if (valid) {
      editSubmitting.value = true
      
      editAddressApi(editForm).then(res => {
        if (res.code === 0) {
          ElMessage.success('编辑地址成功')
          editDialogVisible.value = false
          loadAddressList()
        } else {
          ElMessage.error(res.message || '编辑地址失败')
        }
      }).catch((error) => {
        console.log('编辑地址错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        editSubmitting.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
  })
}

// 删除地址
function deleteAddress(address) {
  ElMessageBox.confirm(
    `确认删除地址 "${address.recipient_name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteAddressApi(address.address_id).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        loadAddressList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch((error) => {
      console.log('删除地址错误:', error)
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
  loadAddressList()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadAddressList()
}

onMounted(() => {
  // 检查URL参数，如果有用户信息则自动填充搜索条件
  if (route.query.user_id) {
    searchForm.user_id = route.query.user_id
  }
  if (route.query.user_name) {
    searchForm.user_name = route.query.user_name
  }
  
  loadAddressList()
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
