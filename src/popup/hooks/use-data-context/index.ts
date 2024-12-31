import React from 'react'
import { DataContextType } from '@/popup/utils/data-context'

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
    const { keyword, activeKey, defaultFavoriteId } = await chrome.storage.sync.get([
      'keyword',
      'activeKey',
      'defaultFavoriteId',
    ])
    setDataContext((oldValue) => {
      return { ...oldValue, keyword: JSON.parse(keyword), activeKey, defaultFavoriteId }
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
      keyword: JSON.stringify(dataContext.keyword),
      activeKey: dataContext.activeKey,
      defaultFavoriteId: dataContext.defaultFavoriteId,
    })
  }, [...Object.values(dataContext)])

  console.log('provideData', provideData)

  return provideData
}

export { useDataContext }
