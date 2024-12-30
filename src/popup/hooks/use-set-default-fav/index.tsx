import React from 'react'
import { useLongPress } from 'ahooks'
import { DataContext } from '@/popup/utils/data-context'

const useSetDefaultFav = () => {
  const delayNumber = 300
  const dataContext = React.use(DataContext)
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

  const handleClick = (key: number) => {
    dataContext.dispatch?.((oldValue) => {
      return { ...oldValue, activeKey: key }
    })
  }

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

    const runProceess = () => {
      requestAnimationFrame(() => {
        if (clickTagIdRef.current == null) {
          return
        }

        if (process >= 100) {
          dataContext.dispatch?.((oldData) => {
            return { ...oldData, defaultFavoriteId: clickTagId }
          })
          maskDomRef.current!.style.width = `${0}%`
          return
        }

        maskDomRef.current!.style.width = `${(process += 5)}%`
        runProceess()
      })
    }

    runProceess()
  }, [clickTagId, isLongPress])

  return { domRef, isLongPress, clickTagId, pendingElement, handleMouseDown, handlleMouseUp }
}

export { useSetDefaultFav }
