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
}

let favorIteData: FavoriteDataItem[] = []

const useFavoriteData = (): UseFavoriteDataReturn => {
  const { favoriteData, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      favoriteData: state.favoriteData,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [loading, setLoading] = React.useState(false)

  const fetchFavoriteData = useMemoizedFn(async () => {
    if (favorIteData && favoriteData.length > 0) {
      setGlobalData({ favoriteData })
      return
    }

    setLoading(true)

    queryAndSendMessage<GetAllFavoriteFlagRes>({
      type: MessageEnum.getAllFavoriteFlag,
    })
      .then((response) => {
        const list = response.data?.list ?? []
        setGlobalData({ favoriteData: list, defaultFavoriteId: list[0]?.id })
        favorIteData = list
        return list
      })
      .finally(() => {
        setLoading(false)
      })
  })

  React.useEffect(() => {
    if (favoriteData == null || favoriteData.length === 0) {
      fetchFavoriteData()
    }
  }, [])

  return { favoriteData, loading }
}

export { useFavoriteData }
