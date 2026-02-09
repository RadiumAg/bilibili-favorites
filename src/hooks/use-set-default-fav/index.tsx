import React from 'react'
import lottie from 'lottie-web'
import { useLongPress } from 'ahooks'
import { useGlobalConfig } from '@/store/global-data'

const useSetDefaultFav = () => {
  const delayNumber = 300
  const setGlobalData = useGlobalConfig((state) => state.setGlobalData)
  const [isLongPress, setLongPress] = React.useState(false)
  const maskDomRef = React.useRef<HTMLDivElement>(null)
  const domRef = React.useRef<HTMLDivElement>(null)
  const [starDomRef, setStarDomRef] = React.useState<HTMLDivElement | null>(null)
  const [clickTagId, setClickTagId] = React.useState<number | undefined>()
  const clickTagIdRef = React.useRef<number | undefined>(undefined)
  const starJson = new URL('@/assets/lottile/star.json', import.meta.url).href

  const pendingElement = React.useMemo(
    () => (
      <div className="absolute w-full h-full bg-slate-500 opacity-10 left-0" ref={maskDomRef}></div>
    ),
    [],
  )
  const starElement = React.useMemo(
    () => (
      <div
        className="w-[20px] h-[20px]"
        ref={(domRef) => {
          if (domRef == null) return

          setStarDomRef(domRef)
        }}
      ></div>
    ),
    [],
  )

  const handleClick = (key: number) => {
    setGlobalData?.({ activeKey: key })
  }

  const handleMouseDown = (id: number) => {
    setClickTagId(id)
    clickTagIdRef.current = id
  }

  const handleMouseUp = () => {
    setClickTagId(undefined)
    clickTagIdRef.current = undefined
  }

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
        const target = event.target as HTMLDivElement
        if (target.dataset.id == null) return

        handleClick(+target.dataset.id)
      },
    },
  )

  React.useEffect(() => {
    if (clickTagId == null) return
    if (isLongPress === false) return

    let process = 0

    const runProcess = () => {
      requestAnimationFrame(() => {
        if (clickTagIdRef.current == null) {
          return
        }

        if (process >= 100) {
          setGlobalData({ defaultFavoriteId: clickTagId })
          maskDomRef.current!.style.width = `${0}%`
          return
        }

        maskDomRef.current!.style.width = `${(process += 5)}%`
        runProcess()
      })
    }

    runProcess()
  }, [clickTagId, isLongPress])

  React.useEffect(() => {
    if (starDomRef == null) return

    lottie.loadAnimation({
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: starJson,
      container: starDomRef,
    })
  }, [starDomRef])

  return {
    domRef,
    isLongPress,
    clickTagId,
    pendingElement,
    starElement,

    handleMouseDown,
    handleMouseUp,
  }
}

export { useSetDefaultFav }
