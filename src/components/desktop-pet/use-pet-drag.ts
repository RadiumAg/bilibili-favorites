import React from 'react'
import { useMemoizedFn } from 'ahooks'

const POSITION_KEY = 'bili-pet-position'

type Position = { x: number; y: number }

/**
 * 桌宠拖拽 hook
 * - 支持鼠标拖拽移动
 * - 位置持久化到 chrome.storage.local
 * - 阻止事件冒泡避免干扰页面
 */
export function usePetDrag(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartRef = React.useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null)

  // 从 storage 恢复位置
  React.useEffect(() => {
    try {
      chrome?.storage?.local?.get([POSITION_KEY], (result) => {
        if (result[POSITION_KEY]) {
          setPosition(result[POSITION_KEY])
        } else {
          // 默认位置：右下角
          setPosition({
            x: window.innerWidth - 80,
            y: window.innerHeight - 80,
          })
        }
      })
    } catch {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      })
    }
  }, [])

  const savePosition = useMemoizedFn((pos: Position) => {
    try {
      chrome?.storage?.local?.set({ [POSITION_KEY]: pos })
    } catch {
      // ignore
    }
  })

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      // 只响应左键
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elX: position.x,
        elY: position.y,
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      e.preventDefault()

      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY

      const newX = dragStartRef.current.elX + dx
      const newY = dragStartRef.current.elY + dy

      // 限制在视口内
      const clampedX = Math.max(0, Math.min(window.innerWidth - 60, newX))
      const clampedY = Math.max(0, Math.min(window.innerHeight - 60, newY))

      setPosition({ x: clampedX, y: clampedY })
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      e.preventDefault()

      setIsDragging(false)
      savePosition({ x: position.x, y: position.y })
      dragStartRef.current = null
    }

    el.addEventListener('mousedown', onMouseDown, { capture: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown, { capture: true } as any)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [containerRef, position.x, position.y, savePosition])

  return { position, isDragging }
}
