/**
 * Analysis Worker - 处理收藏数据分析的 Web Worker
 */

import type { FavoriteMedia } from '../utils/api'

type WorkerMessage = {
  type: string
  data: any
}

type WorkerResponse = {
  type: string
  data: any
}

/**
 * 计算最近 N 天的收藏数量
 */
function calculateRecentFavorites(medias: FavoriteMedia[], days: number): number {
  if (!medias.length) return 0

  // 获取今天的 00:00:00 作为起点
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 计算 N 天前的 00:00:00
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1) // +1 是为了包含今天

  const threshold = startDate.getTime()

  return medias.filter((media) => {
    // fav_time 是秒级时间戳,需要转换为毫秒
    return media.fav_time * 1000 >= threshold
  }).length
}

/**
 * 计算每天收藏数量分布
 */
function calculateDailyFavorites(
  medias: FavoriteMedia[],
  days: number,
): Array<{ date: string; count: number; cumulative: number }> {
  if (!medias.length) return []

  const now = new Date()
  const data: Array<{ date: string; count: number; cumulative: number }> = []
  const dailyMap = new Map<string, number>()

  // 初始化所有日期的计数为0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    dailyMap.set(dateStr, 0)
  }

  // 统计每天的收藏数量
  medias.forEach((media) => {
    const favDate = new Date(media.fav_time * 1000)
    const dateStr = `${favDate.getMonth() + 1}/${favDate.getDate()}`
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1)
    }
  })

  // 构建结果数组,包含累计数量
  let cumulative = 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const count = dailyMap.get(dateStr) || 0
    cumulative += count

    data.unshift({
      date: dateStr,
      count,
      cumulative,
    })
  }

  return data
}

// 监听主线程消息
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data

  try {
    let result: any

    switch (type) {
      case 'calculateRecentFavorites': {
        const { medias, days } = data
        result = calculateRecentFavorites(medias, days)
        break
      }

      case 'calculateDistribution': {
        const { medias, days } = data
        result = calculateDailyFavorites(medias, days)
        break
      }

      case 'calculateTrend': {
        const { medias, days } = data
        result = calculateDailyFavorites(medias, days)
        break
      }

      default:
        throw new Error(`Unknown worker message type: ${type}`)
    }

    const response: WorkerResponse = {
      type,
      data: result,
    }

    self.postMessage(response)
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
    }
    self.postMessage(errorResponse)
  }
})

export {}
