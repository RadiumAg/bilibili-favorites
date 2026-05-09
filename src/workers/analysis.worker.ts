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

  console.log('[DEBUG] calculateDailyFavorites', medias)
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

type FavoriteFolder = {
  id: number
  fid: number
  title: string
  media_count: number
}

/**
 * 计算热力图数据（最近 N 天按天统计）
 */
function calculateHeatmapData(
  medias: FavoriteMedia[],
  days: number,
): Array<{ date: string; count: number; dayOfWeek: number }> {
  if (!medias.length) return []

  const now = new Date()
  const data: Array<{ date: string; count: number; dayOfWeek: number }> = []
  const dailyMap = new Map<string, { count: number; dayOfWeek: number }>()

  // 初始化所有日期
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    dailyMap.set(dateStr, { count: 0, dayOfWeek: date.getDay() })
  }

  // 统计每天收藏数量
  medias.forEach((media) => {
    const favDate = new Date(media.fav_time * 1000)
    const dateStr = `${favDate.getMonth() + 1}/${favDate.getDate()}`
    const entry = dailyMap.get(dateStr)
    if (entry) {
      entry.count += 1
    }
  })

  // 构建结果
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const entry = dailyMap.get(dateStr)!
    data.push({
      date: dateStr,
      count: entry.count,
      dayOfWeek: entry.dayOfWeek,
    })
  }

  return data
}

/**
 * 计算收藏夹关系数据（基于共同 UP 主）
 */
function calculateFolderRelations(
  medias: FavoriteMedia[],
  favoriteData: FavoriteFolder[],
): {
  nodes: Array<{ name: string; value: number }>
  links: Array<{ source: string; target: string; value: number }>
} {
  if (!medias.length || !favoriteData.length) return { nodes: [], links: [] }

  // 按收藏夹分组，收集每个收藏夹的 UP 主 mid 集合
  const folderUpperMap = new Map<number, Set<number>>()
  const folderTitleMap = new Map<number, string>()
  const folderCountMap = new Map<number, number>()

  favoriteData.forEach((folder) => {
    folderUpperMap.set(folder.id, new Set())
    folderTitleMap.set(folder.id, folder.title)
    folderCountMap.set(folder.id, folder.media_count)
  })

  // 遍历所有视频，按收藏夹收集 UP 主
  medias.forEach((media) => {
    // medias 中不包含文件夹 ID，需要通过 fav_time 关联
    // 实际上 medias 是全量所有视频，需要通过其他方式关联
    // 这里我们简化处理：假设 medias 已经是全部视频，通过 upper.mid 统计
  })

  // 由于 medias 是全量数据不包含 folder_id，我们改用另一种方式：
  // 按 upper.mid 分组统计，再根据收藏夹的 mid 推断关联
  // 但这样不够准确，我们改为：如果两个收藏夹有大量相同的 UP 主视频，则认为有关联

  // 简化方案：直接用 favoriteData 的 media_count 做节点，无边显示
  const nodes = favoriteData
    .filter((f) => f.media_count > 0)
    .map((f) => ({
      name: f.title,
      value: f.media_count,
    }))
    .slice(0, 15) // 最多显示 15 个节点

  // 由于 medias 不包含 folder_id，无法准确计算收藏夹间的 UP 主交集
  // 返回空 links，图表会显示"暂无关联"
  return { nodes, links: [] }
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

      // 计算收藏趋势
      case 'calculateTrend': {
        const { medias, days } = data
        result = calculateDailyFavorites(medias, days)
        break
      }

      // 计算热力图数据
      case 'calculateHeatmap': {
        const { medias, days } = data
        result = calculateHeatmapData(medias, days)
        break
      }

      // 计算收藏夹关系
      case 'calculateFolderRelations': {
        const { medias, favoriteData } = data
        result = calculateFolderRelations(medias, favoriteData)
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
