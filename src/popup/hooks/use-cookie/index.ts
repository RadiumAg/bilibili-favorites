import React from 'react'
import { DataContext } from '@/popup/utils/data-context'
import { MessageEnum } from '@/utils/message'

const useCookie = () => {
  const dataConext = React.use(DataContext)

  React.useEffect(() => {
    chrome.runtime.sendMessage(MessageEnum.getCookie, (cookieValue) => {
      dataConext.dispatch?.((oldValue) => {
        return {
          ...oldValue,
          cookie: cookieValue,
        }
      })
    })
  }, [])
}

export { useCookie }
