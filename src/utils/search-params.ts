import React from 'react'

/**
 * 设置 URL 搜索参数，使用 history.replaceState 更新 URL（不触发页面刷新）
 *
 * @param params - 要设置的参数键值对，值为 undefined 或 null 时会移除该参数
 * @param options - 配置项
 * @param options.replace - 是否替换当前历史记录，默认 true（使用 replaceState），false 时使用 pushState
 */
export const setSearchParams = (
  params: Record<string, string | number | boolean | undefined | null>,
  options: { replace?: boolean } = {},
) => {
  const { replace = true } = options
  const currentParams = new URLSearchParams(window.location.search)

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      currentParams.delete(key)
    } else {
      currentParams.set(key, String(value))
    }
  }

  const queryString = currentParams.toString()
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname

  if (replace) {
    window.history.replaceState(null, '', newUrl)
  } else {
    window.history.pushState(null, '', newUrl)
  }

  // 手动触发 popstate 事件，让 useSearchParams 等监听者能感知到变化
  window.dispatchEvent(new PopStateEvent('popstate'))
}

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
