import React from 'react'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils/cookie'
import { useGlobalConfig } from '@/store/global-data'
import { queryAndSendMessage } from '@/utils/tab'

const useCookie = (popup: boolean) => {
  const setGlobalData = useGlobalConfig((state) => state.setGlobalData)
  const cookie = useGlobalConfig((state) => state.cookie)
  const [isLogin, setIsLogin] = React.useState(false)

  React.useEffect(() => {
    if (popup) {
      queryAndSendMessage({ type: MessageEnum.getCookie })
        .then((cookieValue) => {
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
        .catch((error) => {
          console.error('Failed to query and send message to tab:', error)
        })
    } else {
      setIsLogin(cookie !== null)
    }
  }, [cookie])

  return { isLogin }
}

export { useCookie }
