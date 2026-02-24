import React from 'react'
import { getAllFavoriteFlag } from '@/utils/api'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import type { DataContextType } from '@/utils/data-context'

type FavoriteDataItem = DataContextType['favoriteData'][number]

type UseFavoriteDataReturn = {
  favoriteData: FavoriteDataItem[]
  loading: boolean
  fetchFavoriteData: () => Promise<FavoriteDataItem[]>
}

let pendingPromise: Promise<FavoriteDataItem[]> | null = null

const useFavoriteData = (): UseFavoriteDataReturn => {
  const { cookie, favoriteData, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      cookie: state.cookie,
      favoriteData: state.favoriteData,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [loading, setLoading] = React.useState(false)

  const fetchFavoriteData = React.useCallback(async (): Promise<FavoriteDataItem[]> => {
    if (pendingPromise) {
      return pendingPromise
    }

    setLoading(true)

    pendingPromise = getAllFavoriteFlag(cookie)
      .then((response) => {
        const list = response.data?.list ?? []
        setGlobalData({ favoriteData: list })
        return list
      })
      .finally(() => {
        pendingPromise = null
        setLoading(false)
      })

    return pendingPromise
  }, [cookie, setGlobalData])

  React.useEffect(() => {
    if (favoriteData.length === 0 && cookie) {
      fetchFavoriteData()
    }
  }, [cookie])

  return { favoriteData, loading, fetchFavoriteData }
}

export { useFavoriteData }
