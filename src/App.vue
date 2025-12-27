<template>
  <!-- 登录页面 -->
  <div v-if="isLoginPage">
    <router-view></router-view>
  </div>
  
  <!-- 主页面 -->
  <el-container v-else style="height: 100vh">
    <el-aside width="200px" style="background:#f2f2f2">
      <el-menu router :default-active="$route.path" :collapse="false" style="border-right: none;">
        <el-sub-menu index="goods">
          <template #title>
            <span style="font-weight: 500;">商品管理</span>
          </template>
          <el-menu-item index="/goods">商品列表</el-menu-item>
          <el-menu-item index="/goods/add">添加商品</el-menu-item>
          <el-menu-item index="/category">商品分类</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="stock">
          <template #title>
            <span style="font-weight: 500;">订单操作</span>
          </template>
          <el-menu-item index="/stock/outbound" @click="handleOutboundNew">出库单</el-menu-item>
          <el-menu-item index="/stock/inbound">入库单</el-menu-item>
          <el-menu-item index="/user/recharge">会员充值</el-menu-item>
          <el-menu-item index="/stock/fee">其它费用</el-menu-item>
          <el-menu-item index="/stock/outbound/list">操作列表</el-menu-item>
          <el-menu-item index="/stock/items/list">库存明细列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="user">
          <template #title>
            <span style="font-weight: 500;">用户管理</span>
          </template>
          <el-menu-item index="/user/list">用户列表</el-menu-item>
          <el-menu-item index="/address/list">地址列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="dashboard">
          <template #title>
            <span style="font-weight: 500;">数据大盘</span>
          </template>
          <el-menu-item index="/order/dashboard">销售统计</el-menu-item>
          <el-menu-item index="/financial/dashboard">收支统计</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff; border-bottom: 1px solid #e4e7ed; padding: 0 20px; display: flex; align-items: center; justify-content: space-between;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 500; color: #303133;">后台管理系统</h1>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #606266;">
            欢迎，{{ operatorInfo?.real_name || operatorInfo?.name || '未登录用户' }}
          </span>
          
          <!-- 普通管理员显示固定店铺 -->
          <el-tag v-if="!isRoot && shopInfo" size="small" type="info">
            {{ shopInfo.name }}
          </el-tag>
          
          <!-- Root用户显示店铺选择器 -->
          <el-select 
            v-if="isRoot && shopList.length > 0" 
            v-model="selectedShopId" 
            placeholder="选择店铺"
            size="small"
            style="width: 120px;"
            @change="handleShopChange"
          >
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
          
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background: #f5f7fa; padding: 20px;">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const operatorInfo = ref(null)
const shopInfo = ref(null)
const shopList = ref([])
const isRoot = ref(false)
const selectedShopId = ref(null)

// 判断是否为登录页面
const isLoginPage = computed(() => {
  return route.path === '/login'
})

// 加载用户信息
function loadUserInfo() {
  const operator = localStorage.getItem('operator')
  const shop = localStorage.getItem('shop_info')
  const shops = localStorage.getItem('shop_list')
  
  if (operator) {
    try {
      operatorInfo.value = JSON.parse(operator)
      // 判断是否为root用户（根据operator中的is_root字段或shop_info为null）
      isRoot.value = !shop || shop === 'null'
    } catch (error) {
      console.error('解析操作员信息失败:', error)
    }
  } else {
    // 如果没有操作员信息，重置为null
    operatorInfo.value = null
  }
  if (shop && shop !== 'null') {
    try {
      shopInfo.value = JSON.parse(shop)
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  } else {
    shopInfo.value = null
  }
  if (shops && shops !== 'null') {
    try {
      shopList.value = JSON.parse(shops)
      // 如果是root用户且有店铺列表，默认选择第一个店铺
      if (isRoot.value && shopList.value.length > 0) {
        selectedShopId.value = shopList.value[0].id
      }
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  } else {
    shopList.value = []
  }
}

// 处理店铺切换
function handleShopChange(shopId) {
  selectedShopId.value = shopId
  // 触发全局事件，通知其他组件店铺已切换
  window.dispatchEvent(new CustomEvent('shopChanged', { detail: { shopId } }))
}

// 处理出库新增点击
function handleOutboundNew() {
  // 直接跳转到出库新增页面，页面内部会自动检查草稿
  router.push('/stock/outbound')
}

// 退出登录
function handleLogout() {
  ElMessageBox.confirm(
    '确认退出登录吗？',
    '退出确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('operator')
    localStorage.removeItem('shop_info')
    localStorage.removeItem('shop_list')
    
    ElMessage.success('已退出登录')
    
    // 跳转到登录页
    router.push('/login')
  }).catch(() => {
    // 用户取消操作
  })
}

// 监听路由变化，当从登录页跳转出来时重新加载用户信息
watch(() => route.path, (newPath, oldPath) => {
  // 如果从登录页跳转到其他页面，重新加载用户信息
  if (oldPath === '/login' && newPath !== '/login') {
    loadUserInfo()
  }
})

onMounted(() => {
  // 初始加载用户信息
  loadUserInfo()
  
  // 监听 localStorage 变化，当用户信息更新时重新加载
  // 这可以处理登录成功后用户信息被存储的情况
  const handleStorageChange = (e) => {
    if (e.key === 'operator' || e.key === 'shop_info' || e.key === 'shop_list') {
      loadUserInfo()
    }
  }
  window.addEventListener('storage', handleStorageChange)
  
  // 由于 storage 事件只在其他标签页触发，我们需要使用自定义事件
  // 在登录成功后，可以触发这个事件来更新用户信息
  window.addEventListener('userInfoUpdated', loadUserInfo)
})
</script>

<style>
/* 自定义菜单样式 */
.el-menu {
  background-color: #f2f2f2 !important;
}

.el-sub-menu__title {
  background-color: #f2f2f2 !important;
  color: #303133 !important;
  font-weight: 500 !important;
}

.el-sub-menu__title:hover {
  background-color: #e6e6e6 !important;
}

.el-menu-item {
  background-color: #f2f2f2 !important;
  color: #606266 !important;
  padding-left: 50px !important;
}

.el-menu-item:hover {
  background-color: #e6e6e6 !important;
  color: #409eff !important;
}

.el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}

.el-menu-item.is-active:hover {
  background-color: #409eff !important;
  color: #fff !important;
}

/* 子菜单展开时的样式 */
.el-sub-menu .el-menu {
  background-color: #f8f9fa !important;
}

.el-sub-menu .el-menu .el-menu-item {
  background-color: #f8f9fa !important;
  padding-left: 60px !important;
}

.el-sub-menu .el-menu .el-menu-item:hover {
  background-color: #e6e6e6 !important;
  color: #409eff !important;
}

.el-sub-menu .el-menu .el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}
</style>

