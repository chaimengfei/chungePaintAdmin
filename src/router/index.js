import { createRouter, createWebHistory } from 'vue-router'
import GoodsList from '../views/goods_list.vue'
import GoodsEdit from '../views/goods_edit.vue'
import GoodsDetail from '../views/goods_detail.vue'
import GoodsAdd from '../views/goods_add.vue'
import CategoryList from '../views/category_list.vue'
import OrderInbound from '../views/order_inbound.vue'
import OrderOutbound from '../views/order_outbound.vue'
import OrderOutboundList from '../views/order_list.vue'
import OrderItemsList from '../views/order_items_list.vue'
import OrderFee from '../views/order_fee.vue'
import UserRecharge from '../views/user_recharge.vue'
import UserList from '../views/user_list.vue'
import UserEdit from '../views/user_edit.vue'
import UserDetail from '../views/user_detail.vue'
import AddressList from '../views/address_list.vue'
import Login from '../views/login.vue'
import OrderDashboard from '../views/order_dashboard.vue'
import FinancialDashboard from '../views/financial_dashboard.vue'

const routes = [
  { path: '/', redirect: '/order/dashboard' },
  { path: '/login', component: Login },
  { path: '/order/dashboard', component: OrderDashboard },
  { path: '/financial/dashboard', component: FinancialDashboard },
  { path: '/goods', component: GoodsList },
  { path: '/goods/add', component: GoodsAdd },
  { path: '/goods/edit', component: GoodsEdit },
  { path: '/goods/edit/:id', component: GoodsEdit },
  { path: '/goods/detail', component: GoodsDetail },
  { path: '/category', component: CategoryList },
  { path: '/stock/outbound', component: OrderOutbound, meta: { title: '出库-新增' } },
  { path: '/stock/outbound/list', component: OrderOutboundList, meta: { title: '操作列表' } },
  { path: '/stock/items/list', component: OrderItemsList, meta: { title: '库存明细' } },
  { path: '/stock/inbound', component: OrderInbound },
  { path: '/user/recharge', component: UserRecharge, meta: { title: '会员充值' } },
  { path: '/stock/fee', component: OrderFee, meta: { title: '其它费用' } },
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

