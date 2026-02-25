import React from 'react'
import { cn } from '@/lib/utils'
import { useSetDefaultFav, useFavoriteData } from '@/hooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { Skeleton } from '@/components/ui/skeleton'

type FavoriteTagProps = {
  className?: string
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { className } = props
  const {
    domRef,
    clickTagId,
    pendingElement,
    isLongPress,
    starElement,
    handleMouseDown,
    handleMouseUp,
  } = useSetDefaultFav()
  const { favoriteData, loading } = useFavoriteData()
  const globalConfig = useGlobalConfig(
    useShallow((state) => ({
      activeKey: state.activeKey,
      defaultFavoriteId: state.defaultFavoriteId,
    })),
  )

  const tagElementArray = React.useMemo(() => {
    return favoriteData.map((data) => {
      return (
        <div
          key={data.id}
          data-id={data.id}
          onMouseDown={(event) => {
            if (event.button === 0) handleMouseDown(data.id)
          }}
          onMouseUp={handleMouseUp}
          className={cn(
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
    favoriteData,
    globalConfig.activeKey,
    globalConfig.defaultFavoriteId,
  ])

  if (loading && favoriteData.length === 0) {
    return <Skeleton className={cn('w-full', className)} />
  }

  return (
    <ScrollArea className={cn(className)}>
      <div ref={domRef} className="flex gap-1 flex-wrap cursor-pointer">
        {tagElementArray}
      </div>
    </ScrollArea>
  )
}

export default FavoriteTag
