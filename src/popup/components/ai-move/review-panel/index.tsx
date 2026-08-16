import React from 'react'
import { AlertCircle, ArrowRight, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  onSelectionChange: (videoId: number, selected: boolean) => void
  onSelectAllTagResults: () => void
  onCancel: () => void
  onConfirm: () => void
}

type ResultCardProps = {
  result: AIMoveResult
  favorites: FavoriteOption[]
  sourceFavoriteId: number
  onTargetChange: ReviewPanelProps['onTargetChange']
  onSelectionChange: ReviewPanelProps['onSelectionChange']
}

const ResultCard: React.FC<ResultCardProps> = ({
  result,
  favorites,
  sourceFavoriteId,
  onTargetChange,
  onSelectionChange,
}) => {
  const sourceFavorite = favorites.find((favorite) => favorite.id === sourceFavoriteId)
  const selectLabelId = `smart-organize-target-${result.videoId}`
  const selected = result.selected !== false
  const visibleTags = result.matchedTags?.slice(0, 2) ?? []
  const extraTagCount = Math.max((result.matchedTags?.length ?? 0) - visibleTags.length, 0)
  const orderedFavorites = React.useMemo(
    () =>
      [...favorites].sort(
        (a, b) => Number(b.id === sourceFavoriteId) - Number(a.id === sourceFavoriteId),
      ),
    [favorites, sourceFavoriteId],
  )

  return (
    <article
      className={`rounded-lg border border-gray-200 bg-white p-3 transition-colors duration-200 hover:border-[#BF00FF]/35 ${
        result.source === 'tag' ? 'border-l-2 border-l-[#BF00FF]' : ''
      } ${selected ? '' : 'opacity-60'}`}
    >
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectionChange(result.videoId, checked === true)}
          aria-label={`${selected ? '取消选择' : '选择'}“${result.videoTitle}”`}
          className="mt-0.5 h-5 w-5"
        />
        <div className="min-w-0 flex-1">
          <h3
            className="line-clamp-2 text-sm font-medium leading-5 text-gray-900"
            title={result.videoTitle}
          >
            {result.videoTitle}
          </h3>

          {result.source === 'tag' ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]" aria-label="标签命中依据">
              <span className="inline-flex items-center gap-1 font-medium text-[#A000D9]">
                <Tag className="h-3 w-3" aria-hidden={true} />
                命中标签
              </span>
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#BF00FF]/10 px-2 py-0.5 text-[#A000D9]"
                >
                  {tag}
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
                  +{extraTagCount}
                </span>
              )}
              {result.manuallyAdjusted && <span className="text-gray-400">已手动调整</span>}
            </div>
          ) : (
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-gray-500">
              <Sparkles
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF1493]"
                aria-hidden={true}
              />
              <span>{result.reason || 'AI 未提供推荐理由'}</span>
              {result.manuallyAdjusted && (
                <span className="shrink-0 text-[11px] text-gray-400">已手动调整</span>
              )}
            </p>
          )}

          {result.isFallback && (
            <p className="mt-2 flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden={true} />
              AI 未能识别目标收藏夹，请手动选择。
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
                  className="h-10 border-[#BF00FF]/25 bg-[#BF00FF]/5 text-xs focus:ring-[#BF00FF]"
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
        </div>
      </div>
    </article>
  )
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  results,
  favorites,
  sourceFavoriteId,
  onTargetChange,
  onSelectionChange,
  onSelectAllTagResults,
  onCancel,
  onConfirm,
}) => {
  const tagResults = results.filter((result) => result.source === 'tag')
  const aiResults = results.filter((result) => result.source === 'ai')
  const selectedResults = results.filter((result) => result.selected !== false)
  const moveCount = selectedResults.filter(
    (result) => result.targetFavoriteId !== sourceFavoriteId,
  ).length
  const keepCount = results.length - moveCount
  const hasUnselectedTagResults = tagResults.some((result) => result.selected === false)
  const showGroupHeadings = tagResults.length > 0 && aiResults.length > 0

  const renderGroup = (groupResults: AIMoveResult[], source: 'tag' | 'ai') => {
    if (groupResults.length === 0) return null

    return (
      <section aria-label={source === 'tag' ? '标签命中结果' : 'AI 建议结果'}>
        {showGroupHeadings && (
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-1.5 rounded-md bg-gray-50/95 px-2 py-1.5 text-xs font-medium text-gray-600 backdrop-blur">
            {source === 'tag' ? (
              <Tag className="h-3.5 w-3.5 text-[#A000D9]" aria-hidden={true} />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-[#D6006F]" aria-hidden={true} />
            )}
            {source === 'tag'
              ? `标签命中 · ${groupResults.length} 个（建议直接确认）`
              : `AI 建议 · ${groupResults.length} 个（请核对）`}
          </div>
        )}
        <div className="space-y-2">
          {groupResults.map((result) => (
            <ResultCard
              key={result.videoId}
              result={result}
              favorites={favorites}
              sourceFavoriteId={sourceFavoriteId}
              onTargetChange={onTargetChange}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-xl border border-[#BF00FF]/20 bg-white shadow-2xl">
      <header className="border-b border-[#BF00FF]/15 bg-gradient-to-r from-[#BF00FF]/10 to-[#FF1493]/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#BF00FF]/15 text-[#A000D9]">
            <Sparkles className="h-5 w-5" aria-hidden={true} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">确认智能整理结果</h2>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              已按置信度分组：标签命中可直接确认，AI 建议请核对。
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#BF00FF]/10 px-2.5 py-1 font-medium text-[#A000D9]">
            <Tag className="h-3 w-3" aria-hidden={true} /> 标签命中 {tagResults.length}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF1493]/10 px-2.5 py-1 font-medium text-[#D6006F]">
            <Sparkles className="h-3 w-3" aria-hidden={true} /> AI 建议 {aiResults.length}
          </span>
          <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
            将移动 {moveCount}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
            保留 {keepCount}
          </span>
          {hasUnselectedTagResults && (
            <button
              type="button"
              onClick={onSelectAllTagResults}
              className="min-h-8 px-1 font-medium text-[#A000D9] underline-offset-2 hover:underline"
            >
              全选标签命中项
            </button>
          )}
        </div>
      </header>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
        {renderGroup(tagResults, 'tag')}
        {renderGroup(aiResults, 'ai')}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {moveCount > 0 ? `确认后将移动 ${moveCount} 个视频。` : '当前结果不会移动任何视频。'}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-11 flex-1 sm:flex-none"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="min-h-11 flex-1 bg-[#BF00FF] text-white hover:bg-[#A000D9] focus-visible:ring-[#BF00FF] sm:flex-none"
          >
            {moveCount > 0 ? `确认移动 ${moveCount} 个视频` : '确认保留全部'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default ReviewPanel
