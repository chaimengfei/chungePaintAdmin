import { createRouter, createWebHistory } from 'vue-router'
import GoodsList from '../views/goods_list.vue'
import GoodsEdit from '../views/goods_edit.vue'
import GoodsDetail from '../views/goods_detail.vue'
import GoodsAdd from '../views/goods_add.vue'
import CategoryList from '../views/category_list.vue'
import StockInbound from '../views/stock_inbound.vue'
import StockOutbound from '../views/stock_outbound.vue'
import StockReturn from '../views/stock_return.vue'
import StockLogs from '../views/stock_logs.vue'

const routes = [
  { path: '/', redirect: '/goods' },
  { path: '/goods', component: GoodsList },
  { path: '/goods/add', component: GoodsAdd },
  { path: '/goods/edit', component: GoodsEdit },
  { path: '/goods/edit/:id', component: GoodsEdit },
  { path: '/goods/detail', component: GoodsDetail },
  { path: '/category', component: CategoryList },
  { path: '/stock/inbound', component: StockInbound },
  { path: '/stock/outbound', component: StockOutbound },
  { path: '/stock/return', component: StockReturn },
  { path: '/stock/logs', component: StockLogs }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
export default router

