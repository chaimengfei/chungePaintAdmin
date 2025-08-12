import { createRouter, createWebHistory } from 'vue-router'
import GoodsList from '../views/goods_list.vue'
import GoodsEdit from '../views/goods_edit.vue'

const routes = [
  { path: '/', redirect: '/goods' },
  { path: '/goods', component: GoodsList },
  { path: '/goods/edit', component: GoodsEdit },
  { path: '/goods/edit/:id', component: GoodsEdit }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
export default router

