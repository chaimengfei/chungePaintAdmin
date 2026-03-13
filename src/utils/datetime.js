// 日期时间通用工具函数

// 仅保留日期部分（YYYY-MM-DD）
export function getDateOnly(input) {
  const s = String(input || '').trim()
  if (s.length >= 10) return s.slice(0, 10)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 出入库操作时间：根据日期构造 Unix 时间戳（秒，int64）
// - 如果选的是“今天”：使用当前时分秒
// - 如果是其它日期：时分秒固定为 20:00:00（东八区）
export function buildOperateTimestamp(input) {
  const now = new Date()
  const today = getDateOnly(now.toISOString())
  const datePart = getDateOnly(input || today)

  let target
  if (datePart === today) {
    // 今天：当前时分秒
    target = now
  } else {
    // 其他日期：20:00:00，固定东八区
    target = new Date(`${datePart}T20:00:00+08:00`)
  }

  return Math.floor(target.getTime() / 1000)
}

// 筛选时间范围 → 传给后端的 start_time / end_time（int64 秒级时间戳）
// 1处：开始日期 → 当日 00:00:00（东八区）对应时间戳
// 2处：结束日期 → 当日 23:59:59（东八区）对应时间戳
// 用于 admin/order/operations、admin/finance/list 及各自导出接口
export function dateRangeToQueryTimestamps(startValue, endValue) {
  const startDate = getDateOnly(startValue)
  const endDate = getDateOnly(endValue)
  if (!startDate || !endDate) return {}
  const startTime = Math.floor(new Date(`${startDate}T00:00:00+08:00`).getTime() / 1000)
  const endTime = Math.floor(new Date(`${endDate}T23:59:59+08:00`).getTime() / 1000)
  return { start_time: startTime, end_time: endTime }
}
