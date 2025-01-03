import React from 'react'
import { DataContextType } from '@/utils/data-context'
import { log } from '@/utils/log'

const useDataContext = () => {
  const [dataContext, setDataContext] = React.useState<Omit<DataContextType, 'dispatch'>>({
    keyword: [],
    favoriteData: [],
    cookie: undefined,
    activeKey: undefined,
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
    const { keyword, activeKey, cookie, defaultFavoriteId } = await chrome.storage.sync.get([
      'keyword',
      'activeKey',
      'cookie',
      'defaultFavoriteId',
    ])

    setDataContext((oldValue) => {
      return { ...oldValue, keyword: JSON.parse(keyword), activeKey, cookie, defaultFavoriteId }
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

    chrome.storage.sync.set({
      cookie: dataContext.cookie,
      activeKey: dataContext.activeKey,
      keyword: JSON.stringify(dataContext.keyword),
      defaultFavoriteId: dataContext.defaultFavoriteId,
    })
  }, [...Object.values(dataContext)])

  log('provideData', provideData)
  return provideData
}

export { useDataContext }
