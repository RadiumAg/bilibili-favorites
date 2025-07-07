import React from 'react'
import { DataContextType } from '@/utils/data-context'
import { useIsFirstRun } from '../use-first-run'
import { useGlobalDateStore } from '@/store/global-data'

const useDataContext = () => {
  const dataContext = useGlobalDateStore((state) => state)
  const isFirstRun = useIsFirstRun()
  const effectByGetData = React.useRef(false) // check is rerender by getData

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

  return dataContext
}

export { useDataContext }
