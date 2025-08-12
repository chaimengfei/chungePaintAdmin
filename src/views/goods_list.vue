<template>
  <div>
    <el-button type="primary" @click="$router.push('/goods/edit')">新增商品</el-button>
    <el-table :data="goods" style="width: 100%;margin-top:20px">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="商品名"></el-table-column>
      <el-table-column prop="price" label="价格"></el-table-column>
      <el-table-column prop="image" label="图片">
        <template #default="scope">
          <img :src="scope.row.image" style="width:50px;height:50px;object-fit:cover">
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="editGoods(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request'

const goods = ref([])

function loadGoods() {
  request.get('/goods').then(res => {
    goods.value = res.list || []
  })
}

function editGoods(row) {
  router.push(`/goods/edit?id=${row.id}`)
}

onMounted(() => {
  loadGoods()
})
</script>
