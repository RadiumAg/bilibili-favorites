import React from 'react'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { useMemoizedFn, useMount, useToggle } from 'ahooks'
import type { DataContextType } from '@/utils/data-context'

type FavoriteDataItem = DataContextType['favoriteData'][number]

type GetAllFavoriteFlagRes = {
  code: number
  data: { list: FavoriteDataItem[] }
}

const useFavoriteData = () => {
  const { favoriteData, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      favoriteData: state.favoriteData,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [loading, setLoading] = React.useState(false)

  const refresh = useMemoizedFn(() => {
    fetchFavoriteData()
  })

  const fetchFavoriteData = useMemoizedFn(async () => {
    setLoading(true)

    queryAndSendMessage<GetAllFavoriteFlagRes>({
      type: MessageEnum.getAllFavoriteFlag,
    })
      .then((response) => {
        const list = response.data?.list ?? []
        setGlobalData({ favoriteData: list })
        return list
      })
      .finally(() => {
        setLoading(false)
      })
  })

  useMount(() => {
    if (favoriteData == null || favoriteData.length === 0) {
      fetchFavoriteData()
    }
  })

  return { favoriteData, loading, refresh }
}

export { useFavoriteData }
