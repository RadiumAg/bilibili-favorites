import React from 'react'
import { cn } from '@/lib/utils'
import { useSetDefaultFav, useFavoriteData } from '@/hooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { Skeleton } from '@/components/ui/skeleton'
import { Star } from 'lucide-react'

type FavoriteTagProps = {
  className?: string
  highlightDefaultAction?: boolean
}

/**
 * 收藏夹标签组件
 * @param props
 * @returns
 */
const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { className, highlightDefaultAction = false } = props
  const {
    domRef,
    clickTagId,
    pendingElement,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    setDefaultFavorite,
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
            data-favorite-id={data.id}
          onMouseDown={(event) => {
            if (event.button === 0) handleMouseDown(data.id)
          }}
          onMouseUp={handleMouseUp}
          className={cn(
            'group whitespace-nowrap rounded-lg px-2 py-1 text-sm flex min-h-9 items-center gap-x-1 relative overflow-hidden border border-solid transition-all duration-200 select-none',
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
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleClick(data.id)
            }
          }}
        >
          <span># {data.title}</span>
          {globalConfig.defaultFavoriteId === data.id ? (
            <>
              <span
                className={cn(
                  'rounded px-1 py-0.5 text-[10px] font-medium leading-none',
                  globalConfig.activeKey === data.id
                    ? 'bg-white/25 text-white'
                    : 'bg-[#FF1493]/10 text-[#D6006F]',
                )}
              >
                默认
              </span>
              <Star className="h-3.5 w-3.5 fill-current text-[#FF1493]" aria-hidden={true} />
            </>
          ) : (
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                setDefaultFavorite(data.id)
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-gray-300 opacity-0 transition-colors duration-200 hover:bg-[#FF1493]/10 hover:text-[#D6006F] group-hover:opacity-100 group-focus-within:opacity-100',
                highlightDefaultAction &&
                  'opacity-100 motion-safe:animate-pulse text-[#D6006F]',
              )}
              aria-label={`将“${data.title}”设为默认收藏夹`}
              title="设为默认收藏夹"
            >
              <Star className="h-3.5 w-3.5" aria-hidden={true} />
            </button>
          )}
          {clickTagId === data.id && pendingElement}
        </div>
      )
    })
  }, [
    favoriteData,
    globalConfig.activeKey,
    globalConfig.defaultFavoriteId,
    clickTagId,
    pendingElement,
    handleMouseUp,
    handleMouseDown,
    handleClick,
    setDefaultFavorite,
    highlightDefaultAction,
  ])

  if (loading && favoriteData.length === 0) {
    return <Skeleton className={cn('w-full', className)} />
  }

  return (
    <ScrollArea containerClassname={cn(className)}>
      <div ref={domRef} className="flex gap-1.5 flex-wrap cursor-pointer">
        {tagElementArray}
      </div>
    </ScrollArea>
  )
}

export default FavoriteTag
