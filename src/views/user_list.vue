<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #303133;">用户列表</h1>
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
        
        <!-- 用户搜索 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #606266; white-space: nowrap;">用户名：</span>
          <el-input
            v-model="searchKeyword"
            placeholder="请输入用户名"
            style="width: 200px;"
            clearable
            @keyup.enter="loadUserList"
          />
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-button type="primary" @click="loadUserList">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="warning" @click="showAddDialog" style="font-size: 20px; padding: 16px 32px; font-weight: bold; height: auto;">
            <el-icon style="margin-right: 10px; font-size: 22px;"><Plus /></el-icon>
            添加用户
          </el-button>
        </div>
      </div>
    </el-card>
    
    <el-card>

      <!-- 用户表格 -->
      <el-table :data="userList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户名" width="150">
          <template #default="scope">
            <span v-if="scope.row.wechat_name">
              {{ scope.row.wechat_name }}{{ scope.row.admin_display_name ? ` (${scope.row.admin_display_name})` : '' }}
            </span>
            <span v-else>{{ scope.row.admin_display_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="mobile_phone" label="手机号" width="150" />
        <el-table-column label="来源" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.source === 1 ? 'warning' : 'primary'">
              {{ scope.row.source === 1 ? '小程序' : '后台添加' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="微信绑定" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.has_wechat_bind === 1 ? 'primary' : 'info'">
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
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px; flex-wrap: nowrap;">
              <el-button type="info" size="small" @click="viewUserDetail(scope.row)">查看</el-button>
              <el-button type="warning" size="small" @click="editUser(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteUser(scope.row)">删除</el-button>
              <el-button type="primary" size="small" @click="viewUserAddress(scope.row)">地址信息</el-button>
            </div>
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
        
        <el-form-item label="分类" prop="employ">
          <el-radio-group v-model="addForm.employ" @change="handleEmployChange">
            <el-radio :label="1">工厂</el-radio>
            <el-radio :label="2">工人-包活</el-radio>
            <el-radio :label="3">工人-不包活</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="行业" prop="industry">
          <el-radio-group v-model="addForm.industry" :disabled="addForm.employ !== 1">
            <el-radio :label="1">雕塑</el-radio>
            <el-radio :label="2">广告</el-radio>
          </el-radio-group>
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

    <!-- 编辑用户弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="所属店铺" prop="shop_id">
          <el-input 
            :value="editForm.shop_name" 
            disabled 
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="用户名" prop="admin_display_name">
          <el-input
            v-model="editForm.admin_display_name"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="mobile_phone">
          <el-input
            v-model="editForm.mobile_phone"
            placeholder="请输入手机号"
            disabled
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="分类" prop="employ">
          <el-radio-group v-model="editForm.employ" disabled>
            <el-radio :label="1">工厂</el-radio>
            <el-radio :label="2">工人-包活</el-radio>
            <el-radio :label="3">工人-不包活</el-radio>
          </el-radio-group>
          <span v-if="!editForm.employ || editForm.employ === 0" style="color: #909399; margin-left: 10px;">默认</span>
        </el-form-item>
        
        <el-form-item label="行业" prop="industry">
          <el-radio-group v-model="editForm.industry" disabled>
            <el-radio :label="1">雕塑</el-radio>
            <el-radio :label="2">广告</el-radio>
          </el-radio-group>
          <span v-if="!editForm.industry || editForm.industry === 0" style="color: #909399; margin-left: 10px;">默认</span>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_enable">
          <el-radio-group v-model="editForm.is_enable">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
            clearable
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUserList, deleteUser as deleteUserApi, addUser, getUserDetail, editUser as editUserApi } from '../api/user'
import { getCurrentShopId } from '../utils/shop'

const router = useRouter()

const userList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

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
  loadUserList()
}

// 处理右上角店铺切换（全局事件）
function handleGlobalShopChange(event) {
  const shopId = event.detail.shopId
  selectedShopId.value = shopId
  currentPage.value = 1 // 重置到第一页
  loadUserList()
}

// 新增用户相关
const addDialogVisible = ref(false)
const addSubmitting = ref(false)
const addFormRef = ref()
const addForm = reactive({
  admin_display_name: '',
  mobile_phone: '',
  shop_id: null, // 店铺ID，由权限控制设置
  employ: null, // 雇佣分类（1:工厂, 2:工人-包活, 3:工人-不包活）
  industry: null, // 行业（1:雕塑, 2:广告）
  remark: ''
})

// 编辑用户相关
const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  admin_display_name: '',
  mobile_phone: '',
  shop_id: null,
  shop_name: '', // 店铺名称（只读显示）
  employ: null, // 雇佣分类（1:工厂, 2:工人-包活, 3:工人-不包活）
  industry: null, // 行业（1:雕塑, 2:广告）
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

// 加载用户列表
function loadUserList() {
  loading.value = true
  
  // 构建请求参数
  const params = {
    page: currentPage.value,
    page_size: pageSize.value,
    name: searchKeyword.value
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
  
  getUserList(params).then(res => {
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
    admin_display_name: '',
    mobile_phone: '',
    shop_id: shopId,
    employ: null,
    industry: null,
    remark: ''
  })
}

// 处理分类变化
function handleEmployChange(value) {
  // 当 employ 不是 1（工厂）时，industry 自动设置为 0（默认）
  if (value !== 1) {
    addForm.industry = 0
  } else {
    // 当选择工厂时，如果 industry 是 0，则重置为 null，让用户选择
    if (addForm.industry === 0) {
      addForm.industry = null
    }
  }
}

// 提交新增表单
function submitAddForm() {
  addFormRef.value.validate((valid) => {
    if (valid) {
      addSubmitting.value = true
      
      // 确保逻辑正确：当 employ 不是 1 时，industry 必须是 0
      const submitData = {
        ...addForm,
        employ: addForm.employ || 0,
        industry: addForm.employ === 1 ? (addForm.industry || 0) : 0
      }
      
      addUser(submitData).then(res => {
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
  editDialogVisible.value = true
  
  // 先加载用户详情
  loading.value = true
  getUserDetail(user.id).then(res => {
    if (res.code === 0) {
      const userData = res.data
      
      // 获取用户当前的店铺ID和名称
      const userShopId = userData.shop_id
      let shopName = '未知店铺'
      
      // 从店铺列表中查找店铺名称
      if (shopList.value.length > 0) {
        const shop = shopList.value.find(s => s.id === userShopId)
        if (shop) {
          shopName = shop.name
        }
      } else if (userShopId === 1) {
        shopName = '燕郊店'
      } else if (userShopId === 2) {
        shopName = '涞水店'
      }
      
      Object.assign(editForm, {
        id: userData.id,
        admin_display_name: userData.admin_display_name || '',
        mobile_phone: userData.mobile_phone || '',
        shop_id: userShopId,
        shop_name: shopName,
        employ: userData.employ || null,
        industry: userData.industry || null,
        is_enable: userData.is_enable,
        remark: userData.remark || ''
      })
    } else {
      ElMessage.error(res.message || '获取用户详情失败')
      editDialogVisible.value = false
    }
  }).catch((error) => {
    console.log('获取用户详情错误:', error)
    ElMessage.error('网络错误，请稍后重试')
    editDialogVisible.value = false
  }).finally(() => {
    loading.value = false
  })
}

// 提交编辑表单
function submitEditForm() {
  editFormRef.value.validate((valid) => {
    if (valid) {
      editSubmitting.value = true
      
      editUserApi({
        id: editForm.id,
        admin_display_name: editForm.admin_display_name,
        mobile_phone: editForm.mobile_phone,
        shop_id: editForm.shop_id,
        is_enable: editForm.is_enable,
        remark: editForm.remark
      }).then(res => {
        if (res.code === 0) {
          ElMessage.success('编辑用户成功')
          editDialogVisible.value = false
          loadUserList()
        } else {
          ElMessage.error(res.message || '编辑用户失败')
        }
      }).catch((error) => {
        console.log('编辑用户错误:', error)
        ElMessage.error('网络错误，请稍后重试')
      }).finally(() => {
        editSubmitting.value = false
      })
    } else {
      ElMessage.error('请检查表单信息')
    }
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
  loadUserInfo()
  loadUserList()
  
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
