<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; justify-content: flex-start; align-items: center; gap: 20px;">
      <h2>商品分类</h2>
      <div style="margin-left: auto; margin-right: 25%;">
        <el-button type="primary" size="large" @click="showAddDialog" style="font-size: 18px; padding: 15px 30px;">
          <el-icon style="margin-right: 10px; font-size: 20px;"><Plus /></el-icon>
          添加分类
        </el-button>
      </div>
    </div>
    
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

const formRef = ref()
const form = reactive({
  name: '',
  sort_order: 100
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

// 加载分类列表
function loadCategories() {
  loading.value = true
  getCategoryList().then(res => {
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
}

// 重置表单
function resetForm() {
  form.name = ''
  form.sort_order = 100
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
        sort_order: form.sort_order
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
  loadCategories()
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
