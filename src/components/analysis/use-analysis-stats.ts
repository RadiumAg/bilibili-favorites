import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { type FavoriteMedia } from '@/utils/api'
import dbManager from '@/utils/indexed-db'
import { WorkerMessage } from './use-analysis-worker'

type FavoriteFolder = {
  id: number
  fid: number
  title: string
  media_count: number
  ctime?: number
  attr?: number
  fav_state?: number
  mid?: number
}

type StatsData = {
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

type DistributionData = {
  name: string
  value: number
  percentage: number
}

type TrendData = {
  date: string
  count: number
  cumulative: number
}

type UseAnalysisStatsProps = {
  favoriteData: FavoriteFolder[]
  allMedaisRef: React.RefObject<FavoriteMedia[]>
  dateRange: React.RefObject<string>
  forceRefreshRef: React.RefObject<boolean>
  postWorkerMessage: (message: WorkerMessage) => void
}

/**
 * 计算和管理分析统计数据
 */
export const useAnalysisStats = (props: UseAnalysisStatsProps) => {
  const { favoriteData, dateRange, forceRefreshRef, allMedaisRef, postWorkerMessage } = props
  const [statsData, setStatsData] = React.useState<StatsData>() // 头部数据
  const [distributionData, setDistributionData] = React.useState<DistributionData[]>([]) // 收藏夹视频数量分布
  const [trendData, setTrendDataState] = React.useState<TrendData[]>([]) // 收藏趋势分析

  // 设置趋势数据并缓存
  const setTrendData = useMemoizedFn(async (data: TrendData[]) => {
    setTrendDataState(data)

    // 缓存趋势数据
    const trendCacheKey = `trend-data-${dateRange.current}`
    try {
      await dbManager.set(trendCacheKey, data)
    } catch (err) {
      console.error('Failed to cache trend data:', err)
    }
  })
  // 生成搜藏数据
  const generateTrendData = useMemoizedFn(async () => {
    const days = parseInt(dateRange.current.replace('d', ''))
    const trendCacheKey = `trend-data-${dateRange.current}`
    const allMedias = allMedaisRef.current

    // 检查缓存
    const isExpired = await dbManager.isExpired(trendCacheKey)
    if (!isExpired && !forceRefreshRef.current) {
      const cached = await dbManager.get(trendCacheKey)
      if (cached && cached.data) {
        console.log('[OptionsAnalysisTab] 使用趋势数据缓存')
        setTrendData(cached.data)
        return
      }
    }

    // 使用 Web Worker 计算趋势数据
    if (allMedias.length > 0) {
      postWorkerMessage({
        type: 'calculateTrend',
        data: { medias: allMedias, days },
      })
    }
  })

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
      .slice(0, 10)
      .reverse() // 只显示前10个

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

  return {
    statsData,
    distributionData,
    trendData,
    generateTrendData,
    calculateStats,
    calculateDistribution,
    setTrendData,
    updateRecentCount,
  }
}
