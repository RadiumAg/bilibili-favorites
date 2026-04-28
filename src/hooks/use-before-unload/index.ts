import React from 'react'

/**
 * 关闭/刷新窗口时弹出浏览器确认提示
 * @param enabled 是否启用（如：数据分析进行中时启用）
 * @param message 提示文案（大部分现代浏览器已忽略自定义文案，仅显示默认提示）
 */
const useBeforeUnload = (enabled: boolean, message?: string) => {
  const messageRef = React.useRef(message)

  React.useEffect(() => {
    if (!enabled) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Chrome 需要设置 returnValue 才会弹出确认框
      e.returnValue = messageRef.current ?? ''
      return e.returnValue
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled])
}

export { useBeforeUnload }
