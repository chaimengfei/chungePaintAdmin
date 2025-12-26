import request from './request'

// 获取订单大盘数据，支持自定义超时时间（默认沿用 axios 设置）
export function getDashboardOrders(params) {
  const config = {
    url: '/dashboard/sales',
    method: 'get',
    params,
    timeout: 10000
  }

  return request(config)
}

