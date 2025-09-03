<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background:#f2f2f2">
      <el-menu router :default-active="$route.path">
        <el-sub-menu index="goods">
          <template #title>商品管理</template>
          <el-menu-item index="/goods">商品列表</el-menu-item>
          <el-menu-item index="/goods/add">添加商品</el-menu-item>
          <el-menu-item index="/category">商品分类</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="stock">
          <template #title>库存管理</template>
          <el-menu-item index="/stock/inbound">入库</el-menu-item>
          <el-menu-item index="/stock/outbound">出库</el-menu-item>
          <el-menu-item index="/stock/return">退货</el-menu-item>
          <el-menu-item index="/stock/logs">库存日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff">后台管理系统</el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

