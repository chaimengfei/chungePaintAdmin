<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2>商品分类</h2>
      <div style="display: flex; align-items: center; gap: 16px;">
        <el-button type="primary" size="large" @click="showAddDialog" style="font-size: 18px; padding: 15px 30px;">
          <el-icon style="margin-right: 10px; font-size: 20px;"><Plus /></el-icon>
          添加分类
        </el-button>
      </div>
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
      </div>
    </el-card>
    
    <el-table :data="categories" style="width: 100%;" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" label="分类名称" width="180" />
      <el-table-column prop="sort_order" label="排序" width="120" sortable>
        <template #header>
          <span>排序</span>
          <el-tooltip content="值越大展示越靠前" placement="top">
            <el-icon style="margin-left: 4px; color: #909399; cursor: pointer;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div style="display: flex; gap: 15px;">
            <el-button type="primary" size="default" @click="showEditDialog(row)" style="min-width: 70px;">编辑</el-button>
            <el-button type="danger" size="default" @click="handleDelete(row)" style="min-width: 70px;">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <!-- 店铺选择 -->
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
            v-model="form.shop_id" 
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
        
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" placeholder="请输入排序值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, QuestionFilled } from '@element-plus/icons-vue'
import { getCategoryList, addCategory, editCategory, deleteCategory } from '../api/category'

const categories = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const currentId = ref(null)

// 用户权限相关
const isRoot = ref(false)
const shopInfo = ref(null)
const shopList = ref([])
const selectedShopId = ref(null)

const formRef = ref()
const form = reactive({
  name: '',
  sort_order: 100,
  shop_id: null
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  sort_order: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

const dialogTitle = ref('添加分类')

// 加载用户权限信息
function loadUserInfo() {
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  // 判断是否为root用户
  isRoot.value = !shop || shop === 'null'
  
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
      // 普通管理员设置默认店铺ID
      if (!isRoot.value) {
        form.shop_id = shopInfo.value.id
      }
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      if (isRoot.value && shopList.value.length > 0) {
        selectedShopId.value = shopList.value[0].id
        // Root用户设置默认店铺ID
        form.shop_id = shopList.value[0].id
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
  loadCategories()
}

// 加载分类列表
function loadCategories() {
  loading.value = true
  
  // 构建请求参数
  const params = {}
  if (isRoot.value && selectedShopId.value) {
    params.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    params.shop_id = shopInfo.value.id
  }
  
  getCategoryList(params).then(res => {
    if (res.code === 0) {
      categories.value = res.data || []
    } else {
      ElMessage.error('获取分类列表失败')
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取分类列表失败')
  })
}

// 显示添加对话框
function showAddDialog() {
  isEdit.value = false
  dialogTitle.value = '添加分类'
  dialogVisible.value = true
  resetForm()
}

// 显示编辑对话框
function showEditDialog(row) {
  isEdit.value = true
  currentId.value = row.id
  dialogTitle.value = '编辑分类'
  dialogVisible.value = true
  form.name = row.name
  form.sort_order = row.sort_order
  // 设置店铺ID
  if (isRoot.value && selectedShopId.value) {
    form.shop_id = selectedShopId.value
  } else if (!isRoot.value && shopInfo.value) {
    form.shop_id = shopInfo.value.id
  }
}

// 重置表单
function resetForm() {
  form.name = ''
  form.sort_order = 100
  // 重置店铺ID为当前用户的默认店铺
  if (isRoot.value && shopList.value.length > 0) {
    form.shop_id = selectedShopId.value || shopList.value[0].id
  } else if (!isRoot.value && shopInfo.value) {
    form.shop_id = shopInfo.value.id
  } else {
    form.shop_id = null
  }
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      submitLoading.value = true
      
      const submitData = {
        name: form.name,
        sort_order: form.sort_order,
        shop_id: form.shop_id
      }

      const request = isEdit.value 
        ? editCategory(currentId.value, { ...submitData, id: currentId.value })
        : addCategory(submitData)

      request.then(res => {
        if (res.code === 0) {
          ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
          dialogVisible.value = false
          loadCategories()
        } else {
          ElMessage.error(res.message || (isEdit.value ? '编辑失败' : '添加失败'))
        }
        submitLoading.value = false
      }).catch(() => {
        ElMessage.error(isEdit.value ? '编辑失败' : '添加失败')
        submitLoading.value = false
      })
    }
  })
}

// 删除分类
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除分类"${row.name}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteCategory(row.id).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        loadCategories()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch(() => {
      ElMessage.error('删除失败')
    })
  })
}

onMounted(() => {
  loadUserInfo()
  loadCategories()
  
  // 监听全局店铺切换事件
  window.addEventListener('shopChanged', (event) => {
    if (isRoot.value) {
      handleShopChange(event.detail.shopId)
    }
  })
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
