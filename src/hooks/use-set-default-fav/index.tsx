import React from 'react'
import { useLongPress, useMemoizedFn } from 'ahooks'
import { useGlobalConfig } from '@/store/global-data'

const useSetDefaultFav = () => {
  const delayNumber = 300
  const setGlobalData = useGlobalConfig((state) => state.setGlobalData)
  const [isLongPress, setLongPress] = React.useState(false)
  const maskDomRef = React.useRef<HTMLDivElement>(null)
  const domRef = React.useRef<HTMLDivElement>(null)
  const [clickTagId, setClickTagId] = React.useState<number | undefined>()
  const clickTagIdRef = React.useRef<number | undefined>(undefined)

  const pendingElement = React.useMemo(
    () => (
      <div
        className="pointer-events-none absolute left-0 h-full w-full bg-slate-500 opacity-10"
        ref={maskDomRef}
      />
    ),
    [],
  )

  const handleClick = useMemoizedFn((key: number) => {
    setGlobalData({ activeKey: key })
  })

  const setDefaultFavorite = useMemoizedFn((id: number) => {
    setGlobalData({ defaultFavoriteId: id, activeKey: id })
  })

  const handleMouseDown = useMemoizedFn((id: number) => {
    setClickTagId(id)
    clickTagIdRef.current = id
  })

  const handleMouseUp = useMemoizedFn(() => {
    setClickTagId(undefined)
    clickTagIdRef.current = undefined
  })

  useLongPress(
    () => {
      setLongPress(true)
    },
    domRef,
    {
      delay: delayNumber,
      onLongPressEnd: () => {
        setLongPress(false)
        setClickTagId(undefined)
        clickTagIdRef.current = undefined
      },
      onClick(event) {
        const target = event.target as HTMLElement
        const favoriteElement = target.closest<HTMLElement>('[data-favorite-id]')
        if (favoriteElement?.dataset.favoriteId == null) return
        handleClick(Number(favoriteElement.dataset.favoriteId))
      },
    },
  )

  React.useEffect(() => {
    if (clickTagId == null || !isLongPress) return

    let process = 0

    const runProcess = () => {
      requestAnimationFrame(() => {
        if (clickTagIdRef.current == null) return

        if (process >= 100) {
          setDefaultFavorite(clickTagId)
          if (maskDomRef.current) maskDomRef.current.style.width = '0%'
          return
        }

        process += 5
        if (maskDomRef.current) maskDomRef.current.style.width = `${process}%`
        runProcess()
      })
    }

    runProcess()
  }, [clickTagId, isLongPress, setDefaultFavorite])

  return {
    domRef,
    isLongPress,
    clickTagId,
    pendingElement,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    setDefaultFavorite,
  }
}

export { useSetDefaultFav }
