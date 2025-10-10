import { createRouter, createWebHistory } from 'vue-router'
import GoodsList from '../views/goods_list.vue'
import GoodsEdit from '../views/goods_edit.vue'
import GoodsDetail from '../views/goods_detail.vue'
import GoodsAdd from '../views/goods_add.vue'
import CategoryList from '../views/category_list.vue'
import StockInbound from '../views/stock_inbound.vue'
import StockInboundList from '../views/stock_inbound_list.vue'
import StockOutbound from '../views/stock_outbound.vue'
import StockOutboundList from '../views/stock_outbound_list.vue'
import StockItemsList from '../views/stock_items_list.vue'
import UserList from '../views/user_list.vue'
import UserEdit from '../views/user_edit.vue'
import UserDetail from '../views/user_detail.vue'
import AddressList from '../views/address_list.vue'
import Login from '../views/login.vue'

const routes = [
  { path: '/', redirect: '/goods' },
  { path: '/login', component: Login },
  { path: '/goods', component: GoodsList },
  { path: '/goods/add', component: GoodsAdd },
  { path: '/goods/edit', component: GoodsEdit },
  { path: '/goods/edit/:id', component: GoodsEdit },
  { path: '/goods/detail', component: GoodsDetail },
  { path: '/category', component: CategoryList },
  { path: '/stock/outbound', component: StockOutbound, meta: { title: '出库-新增' } },
  { path: '/stock/outbound/list', component: StockOutboundList, meta: { title: '出库-列表' } },
  { path: '/stock/items/list', component: StockItemsList, meta: { title: '库存操作日志' } },
  { path: '/stock/inbound', component: StockInbound },
  { path: '/stock/inbound/list', component: StockInboundList },
  { path: '/user/list', component: UserList },
  { path: '/user/edit', component: UserEdit },
  { path: '/user/detail', component: UserDetail },
  { path: '/address/list', component: AddressList },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 如果访问登录页面，直接放行
  if (to.path === '/login') {
    next()
    return
  }
  
  // 如果没有token，跳转到登录页
  if (!token) {
    next('/login')
    return
  }
  
  // 有token，正常访问
  next()
})

export default router

