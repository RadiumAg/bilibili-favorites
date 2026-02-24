import React from 'react'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { useMemoizedFn } from 'ahooks'
import type { DataContextType } from '@/utils/data-context'

type FavoriteDataItem = DataContextType['favoriteData'][number]

type GetAllFavoriteFlagRes = {
  code: number
  data: { list: FavoriteDataItem[] }
}

type UseFavoriteDataReturn = {
  favoriteData: FavoriteDataItem[]
  loading: boolean
  fetchFavoriteData: () => Promise<FavoriteDataItem[]>
}

let pendingPromise: Promise<FavoriteDataItem[]> | null = null

const useFavoriteData = (): UseFavoriteDataReturn => {
  const { favoriteData, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      favoriteData: state.favoriteData,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [loading, setLoading] = React.useState(false)

  const fetchFavoriteData = useMemoizedFn(async (): Promise<FavoriteDataItem[]> => {
    if (pendingPromise) {
      return pendingPromise
    }

    setLoading(true)

    pendingPromise = queryAndSendMessage<GetAllFavoriteFlagRes>({
      type: MessageEnum.getAllFavoriteFlag,
    })
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
  })

  React.useEffect(() => {
    if (favoriteData.length === 0) {
      fetchFavoriteData()
    }
  }, [])

  return { favoriteData, loading, fetchFavoriteData }
}

export { useFavoriteData }
