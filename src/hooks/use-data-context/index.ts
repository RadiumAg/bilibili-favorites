import React, { useEffect } from 'react'
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

  const getData = async () => {
    const { keyword, activeKey, cookie, aiConfig, defaultFavoriteId } =
      await chrome.storage.local.get([
        'keyword',
        'activeKey',
        'cookie',
        'aiConfig',
        'defaultFavoriteId',
      ])

    setDataContext((oldValue) => {
      return {
        ...oldValue,
        activeKey,
        cookie,
        defaultFavoriteId,
        aiConfig: aiConfig,
        keyword,
      }
    })
  }

  React.useEffect(() => {
    getData()
  }, [])

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    chrome.storage.local.set({
      aiConfig: {
        key: dataContext.aiConfig?.key,
        baseUrl: dataContext.aiConfig?.baseUrl,
      },
      cookie: dataContext.cookie,
      activeKey: dataContext.activeKey,
      keyword: dataContext.keyword,
      defaultFavoriteId: dataContext.defaultFavoriteId,
    })
  }, [...Object.values(dataContext)])

  log('provideData', provideData)
  return provideData
}

export { useDataContext }
