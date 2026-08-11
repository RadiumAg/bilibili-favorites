import React from 'react'
import { MessageEnum } from '@/utils/message'
import { getCookieValue } from '@/utils/cookie'
import { useGlobalConfig } from '@/store/global-data'
import { hasBilibiliTab, queryAndSendMessage } from '@/utils/tab'
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
  const [isCheckingCookie, setIsCheckingCookie] = React.useState(enabled)
  const [isCheckingTab, setIsCheckingTab] = React.useState(true)
  const [hasTab, setHasTab] = React.useState(false)

  const syncCookieFromChrome = useMemoizedFn(async () => {
    setIsCheckingCookie(true)

    try {
      const cookieValue = await queryAndSendMessage<string>({
        type: MessageEnum.getCookieFromChrome,
      })
      setGlobalData({ cookie: cookieValue || undefined })
    } catch (error) {
      console.error('Failed to read Bilibili cookies from Chrome:', error)
      setGlobalData({ cookie: undefined })
    } finally {
      setIsCheckingCookie(false)
    }
  })

  const checkBilibiliTab = useMemoizedFn(async () => {
    try {
      setHasTab(await hasBilibiliTab())
    } catch (error) {
      console.error('Failed to check Bilibili tabs:', error)
      setHasTab(false)
    } finally {
      setIsCheckingTab(false)
    }
  })

  React.useEffect(() => {
    if (!enabled) {
      setIsCheckingCookie(false)
      return
    }

    syncCookieFromChrome().catch((error) => {
      console.error('Failed to sync Bilibili cookies:', error)
    })
  }, [enabled, syncCookieFromChrome])

  React.useEffect(() => {
    checkBilibiliTab().catch((error) => {
      console.error('Failed to refresh Bilibili tab state:', error)
    })
  }, [checkBilibiliTab])

  const hasLoginCookie = Boolean(cookie && getCookieValue('DedeUserID', cookie))
  const isLogin = hasTab && hasLoginCookie
  const isChecking = isCheckingCookie || isCheckingTab

  return { isLogin, isChecking, hasBilibiliTab: hasTab, refreshCookie: syncCookieFromChrome }
}

export { useCookie, useCookieFromChrome }
