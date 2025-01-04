import React from 'react'
import classNames from 'classnames'
import { getAllFavoriteFlag } from '@/utils/api'
import { DataContext } from '@/utils/data-context'
import { useCookie } from '@/hooks/use-cookie'
import { useSetDefaultFav } from '@/hooks'
import { log } from '@/utils/log'

type FavoriteTagProps = {
  fetchPromise: ReturnType<typeof getAllFavoriteFlag>
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { fetchPromise } = props
  const {
    domRef,
    clickTagId,
    pendingElement,
    isLongPress,
    starElement,
    handleMouseDown,
    handleMouseUp,
  } = useSetDefaultFav()
  useCookie()
  const dataContext = React.use(DataContext)
  const promiseData = React.use(fetchPromise)

  const tagElementArray = React.useMemo(() => {
    return promiseData.data?.list?.map((data) => {
      return (
        <div
          key={data.id}
          data-id={data.id}
          onMouseDown={(event) => {
            if (event.button === 0) handleMouseDown(data.id)
          }}
          onMouseUp={handleMouseUp}
          className={classNames(
            'whitespace-nowrap rounded p-1 text-sm flex items-center gap-x-1 relative overflow-hidden border-[1px] border-solid border-black',
            {
              ['bg-b-primary text-white']: dataContext.activeKey === data.id,
              ['text-black bg-white']: dataContext.activeKey !== data.id,
            },
          )}
        >
          # {data.title} {clickTagId === data.id && pendingElement}
          {dataContext.defaultFavoriteId === data.id && starElement}
        </div>
      )
    })
  }, [
    clickTagId,
    isLongPress,
    promiseData.data,
    dataContext.activeKey,
    dataContext.defaultFavoriteId,
  ])

  React.useEffect(() => {
    const list = promiseData.data?.list

    log(list)
    if (list == null) return

    dataContext.dispatch?.((oldData) => {
      return {
        ...oldData,
        favoriteData: list,
      }
    })
  }, [])

  return (
    <div ref={domRef} className="flex gap-1 flex-wrap cursor-pointer">
      {tagElementArray}
    </div>
  )
}

export default FavoriteTag
