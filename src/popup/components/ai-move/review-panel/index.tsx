import React from 'react'
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AIMoveResult, FavoriteOption } from '../types'

type ReviewPanelProps = {
  results: AIMoveResult[]
  favorites: FavoriteOption[]
  sourceFavoriteId: number
  onTargetChange: (videoId: number, targetFavoriteId: number) => void
  onCancel: () => void
  onConfirm: () => void
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  results,
  favorites,
  sourceFavoriteId,
  onTargetChange,
  onCancel,
  onConfirm,
}) => {
  const sourceFavorite = favorites.find((favorite) => favorite.id === sourceFavoriteId)
  const moveCount = results.filter((result) => result.targetFavoriteId !== sourceFavoriteId).length
  const keepCount = results.length - moveCount
  const orderedFavorites = React.useMemo(
    () => [...favorites].sort((a, b) => Number(b.id === sourceFavoriteId) - Number(a.id === sourceFavoriteId)),
    [favorites, sourceFavoriteId],
  )

  return (
    <div className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-xl border border-[#00AEEC]/20 bg-white shadow-2xl">
      <header className="border-b border-[#00AEEC]/15 bg-gradient-to-r from-[#00AEEC]/10 to-[#FB7299]/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00AEEC]/15 text-[#008CC1]">
            <Sparkles className="h-5 w-5" aria-hidden={true} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">确认 AI 整理结果</h2>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              视频尚未移动。请检查 AI 推荐，也可以逐条修改目标收藏夹。
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs" aria-live="polite">
          <span className="rounded-full bg-[#00AEEC]/10 px-2.5 py-1 font-medium text-[#008CC1]">
            将移动 {moveCount} 个
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
            保留 {keepCount} 个
          </span>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
        {results.map((result) => {
          const selectLabelId = `ai-move-target-${result.videoId}`

          return (
            <article
              key={result.videoId}
              className="rounded-lg border border-gray-200 bg-white p-3 transition-colors duration-200 hover:border-[#00AEEC]/35"
            >
              <h3 className="line-clamp-2 text-sm font-medium leading-5 text-gray-900" title={result.videoTitle}>
                {result.videoTitle}
              </h3>
              <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-gray-500">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FB7299]" aria-hidden={true} />
                <span>{result.reason || 'AI 未提供推荐理由'}</span>
              </p>

              {result.isFallback && (
                <p className="mt-2 flex items-start gap-1.5 rounded-md bg-[#FB7299]/10 px-2.5 py-2 text-xs leading-5 text-[#C94F78]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden={true} />
                  AI 推荐的收藏夹不存在，已暂时保留在原收藏夹。
                </p>
              )}

              <div className="mt-3 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <div className="min-w-0 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span className="block text-[11px] text-gray-400">当前收藏夹</span>
                  <span className="block truncate" title={sourceFavorite?.title}>
                    {sourceFavorite?.title || '默认收藏夹'}
                  </span>
                </div>
                <ArrowRight className="mx-auto hidden h-4 w-4 text-gray-400 sm:block" aria-hidden={true} />
                <div className="min-w-0">
                  <label id={selectLabelId} className="sr-only">
                    为“{result.videoTitle}”选择目标收藏夹
                  </label>
                  <Select
                    value={result.targetFavoriteId.toString()}
                    onValueChange={(value) => onTargetChange(result.videoId, Number(value))}
                  >
                    <SelectTrigger
                      aria-labelledby={selectLabelId}
                      className="h-10 border-[#00AEEC]/25 bg-[#00AEEC]/5 text-xs focus:ring-[#00AEEC]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70] max-h-64">
                      {orderedFavorites.map((favorite) => (
                        <SelectItem key={favorite.id} value={favorite.id.toString()}>
                          {favorite.id === sourceFavoriteId
                            ? `保留在 ${favorite.title}`
                            : favorite.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {moveCount > 0 ? `确认后将移动 ${moveCount} 个视频。` : '当前结果不会移动任何视频。'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-11 flex-1 sm:flex-none">
            取消
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="min-h-11 flex-1 bg-[#00AEEC] text-white hover:bg-[#0099D4] focus-visible:ring-[#00AEEC] sm:flex-none"
          >
            {moveCount > 0 ? `确认移动 ${moveCount} 个视频` : '确认保留全部'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default ReviewPanel
