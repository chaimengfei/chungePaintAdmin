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

// 出入库操作时间：根据日期构造带时分秒的 ISO 字符串
// - 如果选的是“今天”：使用当前时分秒
// - 如果是其它日期：时分秒固定为 20:00:00
export function buildOperateTimeIso(input) {
  const now = new Date()
  const today = getDateOnly(now.toISOString())
  const datePart = getDateOnly(input || today)

  if (datePart === today) {
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    return `${datePart}T${h}:${m}:${s}+08:00`
  }

  return `${datePart}T20:00:00+08:00`
}

