<template>
  <el-container style="height: 100vh">
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
            <span style="font-weight: 500;">库存管理</span>
          </template>
          <el-menu-item index="/stock/inbound">入库-新增</el-menu-item>
          <el-menu-item index="/stock/inbound/list">入库列表</el-menu-item>
          <el-menu-item index="/stock/outbound">出库-新增</el-menu-item>
          <el-menu-item index="/stock/outbound/list">出库-列表</el-menu-item>
          <el-menu-item index="/stock/return">退货</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff; border-bottom: 1px solid #e4e7ed; padding: 0 20px; display: flex; align-items: center;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 500; color: #303133;">后台管理系统</h1>
      </el-header>
      <el-main style="background: #f5f7fa; padding: 20px;">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
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

