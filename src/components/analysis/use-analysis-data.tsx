import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { getFavoriteDetail, type FavoriteMedia } from '@/utils/api'
import dbManager from '@/utils/indexed-db'

type UseAnalysisDataProps = {
  favoriteData: Array<{
    id: number
    fid: number
    title: string
    media_count: number
  }>
  cookie?: string
  forceRefreshRef: React.RefObject<boolean>
}

/**
 * 管理分析数据的获取和缓存
 */
export const useAnalysisData = (props: UseAnalysisDataProps) => {
  const { favoriteData, forceRefreshRef, cookie } = props
  const [allMedias, setAllMedias] = React.useState<FavoriteMedia[]>([])
  const [loading, setLoading] = React.useState(false)

  // 生成缓存键
  const getCacheKey = useMemoizedFn((): string => {
    const folderIds = favoriteData
      .map((f) => f.fid)
      .sort()
      .join('-')
    return `analysis-medias-${folderIds}`
  })

  // 获取所有收藏夹的媒体数据
  const fetchAllMedias = useMemoizedFn(async (): Promise<FavoriteMedia[]> => {
    if (!favoriteData.length || !cookie) return []

    setLoading(true)
    const cacheKey = getCacheKey()
    try {
      // 如果不是强制刷新，先尝试从缓存获取
      if (!forceRefreshRef.current) {
        const isExpired = await dbManager.isExpired(cacheKey)
        if (!isExpired) {
          const cached = await dbManager.get(cacheKey)
          if (cached && cached.data) {
            console.log('[useAnalysisData] 使用缓存数据')
            setAllMedias(cached.data)
            setLoading(false)
            return cached.data
          }
        }
      }

      // 缓存过期或强制刷新，重新获取数据
      console.log('[useAnalysisData] 从API获取数据')
      const allMedias: FavoriteMedia[] = []

      // 遍历所有收藏夹，获取媒体数据
      for (const folder of favoriteData) {
        try {
          const response = await getFavoriteDetail(folder.id.toString())
          if (response.code === 0 && response.data.medias) {
            allMedias.push(...response.data.medias)
          }
        } catch (error) {
          console.error(`Failed to fetch medias for folder ${folder.id}:`, error)
        }
      }

      // 保存到缓存
      await dbManager.set(cacheKey, allMedias)
      setAllMedias(allMedias)
      setLoading(false)
      return allMedias
    } catch (error) {
      console.error('Failed to fetch all medias:', error)
      setLoading(false)
      return []
    }
  })

  return {
    allMedias,
    loading,
    fetchAllMedias,
  }
}
