<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const goods = ref([])

function loadGoods() {
  request.get('/api/product/list').then(res => {
    // 后台返回的是 categories + products，这里按你需求可以改成合并
    goods.value = []
    for (const catId in res.products) {
      goods.value.push(...res.products[catId])
    }
  })
}

function editGoods(row) {
  router.push(`/goods/edit?id=${row.id}`)
}

function deleteGoods(row) {
  request.delete(`/admin/product/del/${row.id}`).then(() => {
    loadGoods()
  })
}

onMounted(() => {
  loadGoods()
})
</script>
