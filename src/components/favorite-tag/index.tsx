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

/**
 * 收藏夹标签组件
 * @param props
 * @returns
 */
const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { className } = props
  const { domRef, clickTagId, pendingElement, starElement, handleMouseDown, handleMouseUp } =
    useSetDefaultFav()
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
            'whitespace-nowrap rounded-lg px-2 py-1 text-sm flex items-center gap-x-1 relative overflow-hidden border border-solid transition-all duration-200 select-none',
            {
              'bg-b-primary text-white border-b-primary shadow-sm shadow-b-primary/30':
                globalConfig.activeKey === data.id,
              'text-b-text-primary bg-white border-b-primary/30 hover:bg-b-primary/10 hover:border-b-primary/50':
                globalConfig.activeKey !== data.id,
            },
          )}
          role="button"
          aria-label={`收藏夹: ${data.title}`}
          tabIndex={0}
        >
          # {data.title} {clickTagId === data.id && pendingElement}
          {globalConfig.defaultFavoriteId === data.id && starElement}
        </div>
      )
    })
  }, [
    favoriteData,
    globalConfig.activeKey,
    globalConfig.defaultFavoriteId,
    clickTagId,
    pendingElement,
    starElement,
    handleMouseUp,
    handleMouseDown,
  ])

  if (loading && favoriteData.length === 0) {
    return <Skeleton className={cn('w-full', className)} />
  }

  return (
    <ScrollArea className={cn(className)}>
      <div ref={domRef} className="flex gap-1.5 flex-wrap cursor-pointer">
        {tagElementArray}
      </div>
    </ScrollArea>
  )
}

export default FavoriteTag
