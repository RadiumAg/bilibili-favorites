import React from 'react'
import { Trash2, X } from 'lucide-react'
import { useEditKeyword } from '@/hooks'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTagHitCounts, type TagHitCounts } from '@/utils/hybrid-organize-storage'

type KeywordProps = React.PropsWithChildren<{
  className?: string
  showStats?: boolean
}>

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

const Keyword: React.FC<KeywordProps> = ({ className, showStats = false }) => {
  const { currentFavoriteTag, tagElementArray, handleKeyDown, handDelete } = useEditKeyword()
  const [hitCounts, setHitCounts] = React.useState<TagHitCounts>({})

  React.useEffect(() => {
    if (!showStats) return
    getTagHitCounts()
      .then(setHitCounts)
      .catch((error) => console.warn('读取标签命中统计失败:', error))
  }, [showStats])

  return (
    <ScrollArea
      className={cn(
        'h-44 rounded-lg border-2 border-solid border-b-primary/30 transition-all duration-200',
        className,
      )}
    >
      <div className="flex flex-wrap content-start items-start gap-1.5 overflow-auto rounded-sm p-2">
        {showStats
          ? currentFavoriteTag?.value.map((keyword) => {
              const favoriteId = currentFavoriteTag.favoriteDataId
              const hitCount = hitCounts[`${favoriteId}:${keyword.value.trim()}`] ?? 0
              const lowEfficiency =
                hitCount === 0 &&
                keyword.createdAt != null &&
                Date.now() - keyword.createdAt > THIRTY_DAYS

              return (
                <span
                  key={keyword.id}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs',
                    lowEfficiency
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-[#BF00FF]/25 bg-[#BF00FF]/10 text-[#A000D9]',
                  )}
                >
                  <span className="font-medium">{keyword.value}</span>
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
                    命中 {hitCount}
                  </span>
                  {lowEfficiency && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium">
                      <Trash2 className="h-3 w-3" aria-hidden={true} /> 低效
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handDelete(keyword.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/80"
                    aria-label={`删除标签“${keyword.value}”`}
                    title={lowEfficiency ? '删除低效标签' : '删除标签'}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden={true} />
                  </button>
                </span>
              )
            })
          : tagElementArray}

        {showStats && (currentFavoriteTag?.value.length ?? 0) === 0 && (
          <p className="w-full py-8 text-center text-xs text-gray-400">
            选择左侧收藏夹后，可在这里管理标签与命中统计。
          </p>
        )}

        <input
          placeholder="标签/回车输入/退格删除"
          className="min-h-9 min-w-24 flex-1 overflow-hidden text-ellipsis bg-transparent p-1 text-b-text-primary outline-none placeholder:text-b-primary/40"
          onKeyDown={handleKeyDown}
          aria-label="输入标签，按回车添加"
        />
      </div>
    </ScrollArea>
  )
}

export default Keyword
