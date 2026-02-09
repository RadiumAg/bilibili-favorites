import React from 'react'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils/cookie'
import { useGlobalConfig } from '@/store/global-data'

const useCookie = (popup: boolean) => {
  const setGlobalData = useGlobalConfig((state) => state.setGlobalData)
  const cookie = useGlobalConfig((state) => state.cookie)
  const [isLogin, setIsLogin] = React.useState(false)

  React.useEffect(() => {
    if (popup) {
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

          setGlobalData({
            cookie: cookieValue,
          })
        })
      })
    } else {
      setIsLogin(cookie !== null)
    }
  }, [cookie])

  return { isLogin }
}

export { useCookie }
