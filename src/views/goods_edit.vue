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
  seller_price: '',
  image: '',
  unit: '',
  remark: ''
})

if (form.id) {
  request.get(`/admin/product/${form.id}`).then(res => {
    Object.assign(form, res.data)
  })
}

function handleUpload(e) {
  const file = e.target.files[0]
  const fd = new FormData()
  fd.append('file', file)

  uploadGoodsImage(fd).then(res => {
    form.image = res.data
  })
}

function saveGoods() {
  if (form.id) {
    request.put(`/admin/product/edit/${form.id}`, form).then(() => {
      router.push('/goods')
    })
  } else {
    request.post('/admin/product/add', form).then(() => {
      router.push('/goods')
    })
  }
}
</script>
