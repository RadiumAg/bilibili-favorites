import React, { useRef } from 'react'
import { DataContextType } from '@/utils/data-context'
import { useIsFirstRun } from '../use-first-run'

const useDataContext = () => {
  const [dataContext, setDataContext] = React.useState<Omit<DataContextType, 'dispatch'>>({
    keyword: [],
    favoriteData: [],
    cookie: undefined,
    activeKey: undefined,
    aiConfig: {},
    defaultFavoriteId: undefined,
  })
  const isFirstRun = useIsFirstRun()
  const effectByGetData = React.useRef(false)
  const provideData = React.useMemo<DataContextType>(() => {
    return {
      ...dataContext,
      dispatch: setDataContext,
    }
  }, [...Object.values(dataContext)])

  React.useEffect(() => {
    if (effectByGetData.current) {
      effectByGetData.current = false
      return
    }

    if (isFirstRun.current) {
      return
    }

    chrome.storage.local.set({
      aiConfig: {
        model: dataContext.aiConfig?.model,
        key: dataContext.aiConfig?.key,
        baseUrl: dataContext.aiConfig?.baseUrl,
      },
      cookie: dataContext.cookie,
      activeKey: dataContext.activeKey,
      keyword: dataContext.keyword,
      defaultFavoriteId: dataContext.defaultFavoriteId,
    })
  }, [
    dataContext.activeKey,
    dataContext.cookie,
    dataContext.activeKey,
    dataContext.keyword,
    dataContext.defaultFavoriteId,
    dataContext.aiConfig,
  ])

  React.useEffect(() => {
    let isMount = true

    const getData = async () => {
      const { keyword, activeKey, cookie, aiConfig, defaultFavoriteId } =
        await chrome.storage.local.get([
          'keyword',
          'activeKey',
          'cookie',
          'aiConfig',
          'defaultFavoriteId',
        ])

      if (isMount === false) return

      setDataContext((oldValue) => {
        effectByGetData.current = true

        return {
          ...oldValue,
          activeKey,
          cookie,
          defaultFavoriteId,
          keyword,
          aiConfig: Object.assign({ baseUrl: 'https://api.chatanywhere.tech/v1' }, aiConfig),
        }
      })
    }

    getData()

    return () => {
      isMount = false
    }
  }, [])

  return provideData
}

export { useDataContext }
