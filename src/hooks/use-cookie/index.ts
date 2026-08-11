import React from 'react'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils/cookie'
import { useGlobalConfig } from '@/store/global-data'
import { queryAndSendMessage } from '@/utils/tab'
import { useMemoizedFn } from 'ahooks'

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
  }, [cookie, popup, setGlobalData])

  return { isLogin }
}

const useCookieFromChrome = (enabled: boolean) => {
  const setGlobalData = useGlobalConfig((state) => state.setGlobalData)
  const cookie = useGlobalConfig((state) => state.cookie)
  const [isChecking, setIsChecking] = React.useState(enabled)

  const syncCookieFromChrome = useMemoizedFn(async () => {
    setIsChecking(true)

    try {
      const cookieValue = await queryAndSendMessage<string>({
        type: MessageEnum.getCookieFromChrome,
      })
      setGlobalData({ cookie: cookieValue || undefined })
    } catch (error) {
      console.error('Failed to read Bilibili cookies from Chrome:', error)
      setGlobalData({ cookie: undefined })
    } finally {
      setIsChecking(false)
    }
  })

  React.useEffect(() => {
    if (!enabled) {
      setIsChecking(false)
      return
    }

    syncCookieFromChrome().catch((error) => {
      console.error('Failed to sync Bilibili cookies:', error)
    })
  }, [enabled, syncCookieFromChrome])

  const isLogin = Boolean(cookie && getCookieValue('DedeUserID', cookie))

  return { isLogin, isChecking, refreshCookie: syncCookieFromChrome }
}

export { useCookie, useCookieFromChrome }
