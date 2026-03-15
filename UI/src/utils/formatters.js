export function formatPrice(n) {
  const num = Number(n)
  if (num !== num) return '0원' // NaN
  return num.toLocaleString('ko-KR') + '원'
}

export function formatDate(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}
