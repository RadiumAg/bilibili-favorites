import React from 'react'
import { DataContextType } from '@/popup/utils/data-context'
import { useCookie } from '../use-cookie'

const useDataContext = () => {
  const [dataContext, setDataContext] = React.useState<Omit<DataContextType, 'dispatch'>>({
    keyword: [],
    favoriteData: [],
    cookie: undefined,
    activeKey: undefined,
    defaultFavoriteId: undefined,
  })
  const cookie = useCookie()
  const isFirstMount = React.useRef<boolean>(true)
  const provideData = React.useMemo<DataContextType>(() => {
    return { ...dataContext, dispatch: setDataContext }
  }, [dataContext.activeKey, dataContext.keyword, dataContext.defaultFavoriteId])

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
      cookie,
    })
  }, [dataContext.keyword, dataContext.activeKey, dataContext.defaultFavoriteId])

  return provideData
}

export { useDataContext }
