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
    return { ...dataContext, dispatch: setDataContext, cookie: dataContext.cookie }
  }, [
    dataContext.activeKey,
    dataContext.keyword,
    dataContext.cookie,
    dataContext.defaultFavoriteId,
  ])

  const getData = async () => {
    const { keyword, activeKey } = await chrome.storage.sync.get(['keyword', 'activeKey'])
    setDataContext((oldValue) => {
      return { ...oldValue, keyword: JSON.parse(keyword), activeKey }
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
    })
  }, [dataContext.keyword, dataContext.activeKey, dataContext.defaultFavoriteId])

  console.log('provideData', provideData)

  return provideData
}

export { useDataContext }
