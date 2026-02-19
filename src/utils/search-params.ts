import React from 'react'

/**
 * 获取 URL 搜索参数的 Hook
 */
export const useSearchParams = () => {
  const [params, setParams] = React.useState<URLSearchParams>(() => {
    if (typeof window === 'undefined') {
      return new URLSearchParams()
    }
    return new URLSearchParams(window.location.search)
  })

  React.useEffect(() => {
    const handlePopState = () => {
      setParams(new URLSearchParams(window.location.search))
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return params
}
