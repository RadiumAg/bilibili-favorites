import React from 'react'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils/cookie'
import { useGlobalDateStore } from '@/store/global-data'

const useCookie = () => {
  const dataConext = useGlobalDateStore((state) => state)
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

        dataConext.setGlobalData({
          cookie: cookieValue,
        })
      })
    })
  }, [])

  return { isLogin }
}

export { useCookie }
