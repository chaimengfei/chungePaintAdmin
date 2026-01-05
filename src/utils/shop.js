/**
 * 获取当前选择的店铺ID
 * 优先级：localStorage中的selected_shop_id > shop_info中的id
 * @returns {number|null} 店铺ID，如果没有则返回null
 */
export function getCurrentShopId() {
  // 优先从 localStorage 获取右上角选择的店铺ID（root用户选择后保存的）
  const selectedShopId = localStorage.getItem('selected_shop_id')
  if (selectedShopId) {
    return parseInt(selectedShopId)
  }
  
  // 如果没有，则从 shop_info 获取（普通管理员）
  const shopInfo = localStorage.getItem('shop_info')
  if (shopInfo && shopInfo !== 'null') {
    try {
      const shop = JSON.parse(shopInfo)
      return shop.id || null
    } catch (error) {
      console.error('解析店铺信息失败:', error)
      return null
    }
  }
  
  return null
}

/**
 * 获取当前店铺信息
 * @returns {object|null} 店铺信息对象，包含id和name等
 */
export function getCurrentShopInfo() {
  const shopId = getCurrentShopId()
  if (!shopId) return null
  
  // 从 shop_list 中查找店铺信息
  const shopList = localStorage.getItem('shop_list')
  if (shopList && shopList !== 'null') {
    try {
      const shops = JSON.parse(shopList)
      const shop = shops.find(s => s.id === shopId)
      if (shop) return shop
    } catch (error) {
      console.error('解析店铺列表失败:', error)
    }
  }
  
  // 如果 shop_list 中没有，尝试从 shop_info 获取
  const shopInfo = localStorage.getItem('shop_info')
  if (shopInfo && shopInfo !== 'null') {
    try {
      const shop = JSON.parse(shopInfo)
      if (shop.id === shopId) return shop
    } catch (error) {
      console.error('解析店铺信息失败:', error)
    }
  }
  
  return null
}



