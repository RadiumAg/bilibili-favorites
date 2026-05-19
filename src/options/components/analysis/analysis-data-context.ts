import React from 'react'
import { useAnalysisData, type FetchProgress, type FolderMediasMap } from './use-analysis-data'
import { useFavoriteData } from '@/hooks'
import { useGlobalConfig } from '@/store/global-data'
import { type FavoriteMedia } from '@/utils/api'

type AnalysisDataContextType = {
  allMedias: FavoriteMedia[]
  allMedaisRef: React.RefObject<FavoriteMedia[]>
  folderMediasMapRef: React.RefObject<FolderMediasMap>
  loading: boolean
  fetchProgress?: FetchProgress
  fetchAllMedias: () => Promise<FavoriteMedia[]>
  forceRefreshRef: React.RefObject<boolean>
}

const AnalysisDataContext = React.createContext<AnalysisDataContextType | null>(null)

/**
 * 在 Options 顶层调用，初始化共享的分析数据状态
 */
export const useAnalysisDataProvider = () => {
  const { favoriteData } = useFavoriteData()
  const cookie = useGlobalConfig((state) => state.cookie)
  const forceRefreshRef = React.useRef(false)

  const { allMedias, loading, fetchProgress, allMedaisRef, folderMediasMapRef, fetchAllMedias } =
    useAnalysisData({
      favoriteData,
      cookie,
      forceRefreshRef,
    })

  const valueMemo = React.useMemo(() => {
    return {
      allMedias,
      allMedaisRef,
      folderMediasMapRef,
      loading,
      fetchProgress,
      forceRefreshRef,
      fetchAllMedias,
    }
  }, [allMedaisRef, allMedias, folderMediasMapRef, fetchAllMedias, fetchProgress, loading])

  return {
    value: valueMemo,
  }
}

/**
 * 子组件消费共享的分析数据
 */
export const useAnalysisDataContext = () => {
  const ctx = React.use(AnalysisDataContext)
  if (!ctx) {
    throw new Error('useAnalysisDataContext must be used within AnalysisDataProvider')
  }
  return ctx
}

export { AnalysisDataContext }
