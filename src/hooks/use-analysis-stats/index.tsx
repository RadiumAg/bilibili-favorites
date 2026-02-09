import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { type FavoriteMedia } from '@/utils/api'
import dbManager from '@/utils/indexed-db'

interface FavoriteFolder {
  id: number
  fid: number
  title: string
  media_count: number
  ctime?: number
  attr?: number
  fav_state?: number
  mid?: number
}

interface StatsData {
  totalFolders: number
  totalVideos: number
  recentCount: number
  mostActiveFolder?: {
    name: string
    count: number
  }
  folderGrowth?: number
  videoGrowth?: number
}

interface DistributionData {
  name: string
  value: number
  percentage: number
}

interface TrendData {
  date: string
  count: number
  cumulative: number
}

interface UseAnalysisStatsProps {
  favoriteData: FavoriteFolder[]
  allMedias: FavoriteMedia[]
  dateRange: string
}

interface UseAnalysisStatsReturn {
  statsData: StatsData | undefined
  distributionData: DistributionData[]
  trendData: TrendData[]
  calculateStats: (recentCount?: number) => void
  calculateDistribution: () => void
  setTrendData: (data: TrendData[]) => void
  updateRecentCount: (count: number) => void
}

/**
 * 计算和管理分析统计数据
 */
export const useAnalysisStats = (props: UseAnalysisStatsProps): UseAnalysisStatsReturn => {
  const { favoriteData, allMedias, dateRange } = props

  const [statsData, setStatsData] = useState<StatsData>()
  const [distributionData, setDistributionData] = useState<DistributionData[]>([])
  const [trendData, setTrendDataState] = useState<TrendData[]>([])

  // 计算基础统计数据
  const calculateStats = useMemoizedFn((recentCount: number = 0) => {
    if (!favoriteData.length) return

    const totalFolders = favoriteData.length
    const totalVideos = favoriteData.reduce((sum, folder) => sum + folder.media_count, 0)

    const mostActiveFolder = favoriteData.reduce(
      (max, folder) => (folder.media_count > (max?.media_count || 0) ? folder : max),
      favoriteData[0],
    )

    setStatsData({
      totalFolders,
      totalVideos,
      recentCount,
      mostActiveFolder: mostActiveFolder
        ? {
            name: mostActiveFolder.title,
            count: mostActiveFolder.media_count,
          }
        : undefined,
      folderGrowth: 5.2, // 模拟增长数据
      videoGrowth: 8.7,
    })
  })

  // 计算分布数据
  const calculateDistribution = useMemoizedFn(() => {
    if (!favoriteData.length) return

    const data = favoriteData
      .map((folder) => ({
        name: folder.title,
        value: folder.media_count,
        percentage: parseFloat(
          (
            (folder.media_count / favoriteData.reduce((sum, f) => sum + f.media_count, 0)) *
            100
          ).toFixed(1),
        ),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // 只显示前10个

    setDistributionData(data)
  })

  // 更新最近收藏数量
  const updateRecentCount = useMemoizedFn((count: number) => {
    setStatsData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        recentCount: count,
      }
    })
  })

  // 生成趋势数据（空数据占位）
  const generateEmptyTrendData = useMemoizedFn((days: number): TrendData[] => {
    const now = new Date()
    const data: TrendData[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      data.unshift({
        date: dateStr,
        count: 0,
        cumulative: 0,
      })
    }

    return data
  })

  // 设置趋势数据并缓存
  const setTrendData = useMemoizedFn(async (data: TrendData[]) => {
    setTrendDataState(data)

    // 缓存趋势数据
    const trendCacheKey = `trend-data-${dateRange}`
    try {
      await dbManager.set(trendCacheKey, data)
    } catch (err) {
      console.error('Failed to cache trend data:', err)
    }
  })

  return {
    statsData,
    distributionData,
    trendData,
    calculateStats,
    calculateDistribution,
    setTrendData,
    updateRecentCount,
  }
}
