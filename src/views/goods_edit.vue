<template>
  <div>
    <el-form :model="form" label-width="80px" style="max-width:500px">
      <el-form-item label="商品名">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="价格">
        <el-input type="number" v-model="form.price" />
      </el-form-item>
      <el-form-item label="图片">
        <input type="file" @change="handleUpload" />
        <img v-if="form.image" :src="form.image" style="width:100px;margin-top:10px">
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveGoods">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import request from '../api/request'
import { uploadGoodsImage } from '../api/oss'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const form = reactive({
  id: route.query.id || '',
  name: '',
  price: '',
  image: ''
})

if (form.id) {
  request.get(`/goods/${form.id}`).then(res => {
    Object.assign(form, res)
  })
}

function handleUpload(e) {
  const file = e.target.files[0]
  const fd = new FormData()
  fd.append('file', file)

  uploadGoodsImage(fd).then(res => {
    form.image = res.url
  })
}

function saveGoods() {
  if (form.id) {
    request.put(`/goods/${form.id}`, form).then(() => {
      router.push('/goods')
    })
  } else {
    request.post('/goods', form).then(() => {
      router.push('/goods')
    })
  }
}
</script>
