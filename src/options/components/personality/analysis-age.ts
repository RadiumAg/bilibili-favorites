const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_DAYS = 30
const MONTHS_PER_YEAR = 12

const getAnalysisAgeText = (analyzedAt: number, now = Date.now()): string => {
  const elapsedDays = Math.floor(Math.max(0, now - analyzedAt) / DAY_MS)

  if (elapsedDays === 0) return '刚刚分析过'
  if (elapsedDays < MONTH_DAYS) return `已经${elapsedDays}天啦`

  const elapsedMonths = Math.floor(elapsedDays / MONTH_DAYS)
  if (elapsedMonths < MONTHS_PER_YEAR) return `已经${elapsedMonths}个月啦`

  const elapsedYears = Math.floor(elapsedMonths / MONTHS_PER_YEAR)
  const remainingMonths = elapsedMonths % MONTHS_PER_YEAR
  if (remainingMonths === 0) return `已经${elapsedYears}年啦`

  return `已经${elapsedYears}年${remainingMonths}个月啦`
}

export { getAnalysisAgeText }
