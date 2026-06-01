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
 * @param folderMediasMap 每个收藏夹的视频列表（key 为 folderId）
 * @param favoriteData 收藏夹元数据
 */
function calculateFolderRelations(
  folderMediasMap: Record<string, FavoriteMedia[]>,
  favoriteData: FavoriteFolder[],
): {
  nodes: Array<{ name: string; value: number }>
  links: Array<{
    source: string
    target: string
    value: number
    commonUppers: Array<{ mid: number; name: string }>
  }>
} {
  if (!Object.keys(folderMediasMap).length || !favoriteData.length) return { nodes: [], links: [] }

  // 构建每个收藏夹的 UP 主 mid 集合，以及 mid -> name 映射
  const folderUpperSets = new Map<string, Set<number>>()
  const midToName = new Map<number, string>()

  favoriteData.forEach((folder) => {
    const folderId = folder.id.toString()

    const medias = folderMediasMap[folderId]
    if (medias && medias.length > 0) {
      const upperSet = new Set<number>()
      medias.forEach((media) => {
        if (media.upper && media.upper.mid) {
          upperSet.add(media.upper.mid)
          if (media.upper.name) {
            midToName.set(media.upper.mid, media.upper.name)
          }
        }
      })
      folderUpperSets.set(folderId, upperSet)
    }
  })

  // 只保留有视频的收藏夹，最多 15 个节点
  const activeFolders = favoriteData
    .filter(
      (f) =>
        folderUpperSets.has(f.id.toString()) &&
        (folderUpperSets.get(f.id.toString())?.size ?? 0) > 0,
    )
    .slice(0, 15)

  const nodes = activeFolders.map((f) => ({
    name: f.title,
    value: folderMediasMap[f.id.toString()]?.length ?? f.media_count,
  }))

  // 计算任意两个收藏夹的共同 UP 主
  const links: Array<{
    source: string
    target: string
    value: number
    commonUppers: Array<{ mid: number; name: string }>
  }> = []

  for (let i = 0; i < activeFolders.length; i++) {
    for (let j = i + 1; j < activeFolders.length; j++) {
      const setA = folderUpperSets.get(activeFolders[i].id.toString())!
      const setB = folderUpperSets.get(activeFolders[j].id.toString())!

      // 计算交集并收集共同 UP 主信息
      const commonUppers: Array<{ mid: number; name: string }> = []
      const smaller = setA.size < setB.size ? setA : setB
      const larger = setA.size < setB.size ? setB : setA
      for (const mid of smaller) {
        if (larger.has(mid)) {
          commonUppers.push({ mid, name: midToName.get(mid) ?? String(mid) })
        }
      }

      // 只保留共同 UP 主 >= 2 的边，避免图表过于密集
      if (commonUppers.length >= 2) {
        links.push({
          source: activeFolders[i].title,
          target: activeFolders[j].title,
          value: commonUppers.length,
          commonUppers,
        })
      }
    }
  }

  return { nodes, links }
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
        const { folderMediasMap, favoriteData } = data
        result = calculateFolderRelations(folderMediasMap, favoriteData)
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
