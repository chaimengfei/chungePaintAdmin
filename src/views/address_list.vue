<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">地址列表</h1>
    </div>
    
    <!-- 筛选面板 -->
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <!-- 店铺筛选 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">店铺：</span>
          <!-- Root用户显示店铺选择器 -->
          <el-select
            v-if="isRoot && shopList.length > 0"
            v-model="selectedShopId"
            placeholder="请选择店铺"
            style="width: 150px;"
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
            style="width: 150px;"
          />
        </div>
        
        <!-- 用户选择 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">用户：</span>
          <el-select
            v-model="searchForm.user_id"
            placeholder="请选择用户"
            style="width: 200px;"
            filterable
            clearable
            @change="handleUserChange"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="getUserNameLabel(user)"
              :value="user.id"
            />
          </el-select>
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="loadAddressList">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="warning" @click="showAddDialog" style="font-size: 20px; padding: 16px 32px; font-weight: bold; height: auto;">
            <el-icon style="margin-right: 10px; font-size: 22px;"><Plus /></el-icon>
            新增地址
          </el-button>
        </div>
      </div>
    </el-card>
    
    <el-card>

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
            v-model="addForm.shop_id" 
            placeholder="请选择店铺" 
            style="width: 100%;"
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
            v-model="editForm.shop_id" 
            placeholder="请选择店铺" 
            style="width: 100%;"
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAddressList, addAddress, editAddress as editAddressApi, deleteAddress as deleteAddressApi } from '../api/address'
import { getCurrentShopId } from '../utils/shop'
import { getUserNameList } from '../api/user'

const route = useRoute()
const addressList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

// 用户列表（用于下拉框）
const userList = ref([])

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
        // 优先使用右上角选择的店铺ID
        const currentShopId = getCurrentShopId()
        if (currentShopId) {
          selectedShopId.value = currentShopId
        } else {
          // 如果没有，使用第一个店铺
          selectedShopId.value = shopList.value[0].id
        }
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

// 处理店铺切换（页面内店铺选择器）
function handleShopChange(shopId) {
  selectedShopId.value = shopId
  // 同步到右上角（保存到 localStorage）
  if (isRoot.value && shopId) {
    localStorage.setItem('selected_shop_id', shopId.toString())
    // 触发全局事件，通知其他组件店铺已切换
    window.dispatchEvent(new CustomEvent('shopChanged', { detail: { shopId } }))
  }
  currentPage.value = 1 // 重置到第一页
  loadUserList() // 重新加载用户列表
  loadAddressList()
}

// 处理右上角店铺切换（全局事件）
function handleGlobalShopChange(event) {
  const shopId = event.detail.shopId
  selectedShopId.value = shopId
  currentPage.value = 1 // 重置到第一页
  loadUserList() // 重新加载用户列表
  loadAddressList()
}

// 加载用户列表（用于下拉框）
function loadUserList() {
  const params = {}
  
  // 使用当前选择的店铺ID（优先使用右上角选择的店铺ID）
  const currentShopId = getCurrentShopId()
  if (currentShopId) {
    params.shop_id = currentShopId
  } else if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  getUserNameList(params).then(res => {
    if (res.code === 0) {
      userList.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  }).catch((error) => {
    console.log('获取用户列表错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  })
}

// 获取用户显示名称
function getUserNameLabel(user) {
  const hasWechatName = user.wechat_name && user.wechat_name.trim() !== ''
  const hasAdminName = user.admin_display_name && user.admin_display_name.trim() !== ''
  
  if (hasWechatName && hasAdminName) {
    // 两个都有值，显示 wechat_name (admin_display_name)
    return `${user.wechat_name} (${user.admin_display_name})`
  } else if (hasWechatName) {
    // 只有 wechat_name 有值
    return user.wechat_name
  } else if (hasAdminName) {
    // 只有 admin_display_name 有值
    return user.admin_display_name
  } else {
    // 两个都没有值，显示用户ID
    return `用户${user.id}`
  }
}

// 处理用户切换
function handleUserChange() {
  currentPage.value = 1 // 重置到第一页
  loadAddressList()
}

// 搜索表单
const searchForm = reactive({
  user_id: ''
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
  is_default: false,
  shop_id: null  // 店铺ID
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
  is_default: false,
  shop_id: null  // 店铺ID
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
  
  // 构建请求参数
  const params = {
    page: currentPage.value,
    page_size: pageSize.value
  }
  
  // 添加店铺ID参数（优先使用右上角选择的店铺ID）
  const currentShopId = getCurrentShopId()
  if (currentShopId) {
    params.shop_id = currentShopId
  } else if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  if (searchForm.user_id) {
    params.user_id = searchForm.user_id
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
  currentPage.value = 1
  loadAddressList()
}

// 显示新增地址弹窗
function showAddDialog() {
  addDialogVisible.value = true
  // 重置表单并设置店铺ID（优先使用右上角选择的店铺ID）
  let shopId = getCurrentShopId()
  if (!shopId) {
    if (isRoot.value && selectedShopId.value) {
      shopId = selectedShopId.value
    } else if (!isRoot.value && shopInfo.value) {
      shopId = shopInfo.value.id
    }
  }
  
  Object.assign(addForm, {
    user_id: '',
    recipient_name: '',
    recipient_phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false,
    shop_id: shopId
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
  
  // 设置店铺ID（优先使用地址原有的 shop_id，如果没有则使用右上角选择的店铺ID）
  let shopId = address.shop_id || getCurrentShopId()
  if (!shopId) {
    if (isRoot.value && selectedShopId.value) {
      shopId = selectedShopId.value
    } else if (!isRoot.value && shopInfo.value) {
      shopId = shopInfo.value.id
    }
  }
  
  Object.assign(editForm, {
    id: address.address_id,
    user_id: address.user_id,
    recipient_name: address.recipient_name,
    recipient_phone: address.recipient_phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    is_default: address.is_default,
    shop_id: shopId
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
  loadUserInfo()
  loadUserList() // 加载用户列表
  
  // 检查URL参数，如果有用户信息则自动填充搜索条件
  if (route.query.user_id) {
    searchForm.user_id = route.query.user_id
  }
  
  loadAddressList()
  
  // 监听全局店铺切换事件（右上角店铺切换）
  window.addEventListener('shopChanged', handleGlobalShopChange)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('shopChanged', handleGlobalShopChange)
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
