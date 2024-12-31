import React from 'react'
import { DataContext } from '@/popup/utils/data-context'
import { MessageEnum } from '@/utils/message'

const useCookie = () => {
  const dataConext = React.use(DataContext)

  React.useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id
      if (tabId == null) return

      chrome.tabs.sendMessage(tabId, MessageEnum.getCookie, (cookieValue) => {
        dataConext.dispatch?.((oldValue) => {
          return {
            ...oldValue,
            cookie: cookieValue,
          }
        })
      })
    })
  }, [])
}

export { useCookie }
