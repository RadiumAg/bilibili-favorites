import React from 'react'
import { DataContext } from '@/popup/utils/data-context'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils'

const useCookie = () => {
  const dataConext = React.use(DataContext)
  const [isLogin, setIsLogin] = React.useState(false)

  React.useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id
      if (tabId == null) return

      chrome.tabs.sendMessage(tabId, { type: MessageEnum.getCookie }, (cookieValue) => {
        const dedeUserID = getCookieValue('DedeUserID', cookieValue)
        if (dedeUserID === null) {
          setIsLogin(false)
          return
        } else {
          setIsLogin(true)
        }

        dataConext.dispatch?.((oldValue) => {
          return {
            ...oldValue,
            cookie: cookieValue,
          }
        })
      })
    })
  }, [])

  return { isLogin }
}

export { useCookie }
