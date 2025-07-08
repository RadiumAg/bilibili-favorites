import React from 'react'
import classNames from 'classnames'
import { getAllFavoriteFlag } from '@/utils/api'
import { useSetDefaultFav } from '@/hooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGlobalConfig } from '@/store/global-data'

type FavoriteTagProps = {
  className?: string
  fetchPromise: ReturnType<typeof getAllFavoriteFlag>
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { className, fetchPromise } = props
  const {
    domRef,
    clickTagId,
    pendingElement,
    isLongPress,
    starElement,
    handleMouseDown,
    handleMouseUp,
  } = useSetDefaultFav()
  const globalConfig = useGlobalConfig((state) => state)
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
              ['bg-b-primary text-white']: globalConfig.activeKey === data.id,
              ['text-black bg-white']: globalConfig.activeKey !== data.id,
            },
          )}
        >
          # {data.title} {clickTagId === data.id && pendingElement}
          {globalConfig.defaultFavoriteId === data.id && starElement}
        </div>
      )
    })
  }, [
    clickTagId,
    isLongPress,
    promiseData.data,
    globalConfig.activeKey,
    globalConfig.defaultFavoriteId,
  ])

  React.useEffect(() => {
    const list = promiseData.data?.list

    if (list == null) return

    globalConfig.dispatch?.((oldData) => {
      return {
        ...oldData,
        favoriteData: list,
      }
    })
  }, [])

  return (
    <ScrollArea className={classNames(className)}>
      <div ref={domRef} className="flex gap-1 flex-wrap cursor-pointer">
        {tagElementArray}
      </div>
    </ScrollArea>
  )
}

export default FavoriteTag
