import React from 'react'
import { useLongPress } from 'ahooks'

const useSetDefaultFav = () => {
  const delayNumber = 300
  const [isLongPress, setLongPress] = React.useState(false)
  const maskDomRef = React.useRef<HTMLDivElement>(null)
  const domRef = React.useRef<HTMLDivElement>(null)
  const [clickTagId, setClickTagId] = React.useState<number | undefined>()
  const clickTagIdRef = React.useRef<number | undefined>(undefined)

  const pendingElement = React.useMemo(
    () => (
      <div
        className="absolute w-full h-full bg-slate-500 opacity-10 left-0"
        ref={maskDomRef}
        style={{ width: 0 }}
      ></div>
    ),
    [],
  )

  const handleMouseDown = (id: number) => {
    setClickTagId(id)
    clickTagIdRef.current = id
  }

  const handlleMouseUp = () => {
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
    },
  )

  React.useEffect(() => {
    if (clickTagId == null) return
    if (isLongPress === false) return

    let process = 0

    const runProceess = (handleValue?: number) => {
      if (handleValue && process === 100) {
        cancelAnimationFrame(handleValue)
        return
      }

      const handle = requestAnimationFrame(() => {
        maskDomRef.current!.style.width = `${(process += 1)}%`
        runProceess(handle)
      })
    }

    runProceess()
  }, [clickTagId, isLongPress])

  return { domRef, clickTagId, pendingElement, handleMouseDown, handlleMouseUp }
}

export { useSetDefaultFav }
