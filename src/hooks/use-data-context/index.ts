import React from 'react'
import { log } from '@/utils/log'
import { DataContextType } from '@/utils/data-context'

const useDataContext = () => {
  const [dataContext, setDataContext] = React.useState<Omit<DataContextType, 'dispatch'>>({
    keyword: [],
    favoriteData: [],
    cookie: undefined,
    activeKey: undefined,
    aiConfig: {},
    defaultFavoriteId: undefined,
  })
  const isFirstMount = React.useRef<boolean>(true)
  const provideData = React.useMemo<DataContextType>(() => {
    return {
      ...dataContext,
      dispatch: setDataContext,
    }
  }, [...Object.values(dataContext)])

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
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
  }, [...Object.values(dataContext)])

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

  log('provideData', provideData)
  return provideData
}

export { useDataContext }
