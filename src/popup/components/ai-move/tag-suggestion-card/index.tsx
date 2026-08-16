import React from 'react'
import { Check, ChevronDown, Tag, X } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TagSuggestionGroup } from '@/utils/tag-suggestions'

type TagSuggestionCardProps = {
  groups: TagSuggestionGroup[]
  onAdopt: (favoriteId: number, tags: string[]) => Promise<number>
  onDismiss: () => void
}

const TagSuggestionCard: React.FC<TagSuggestionCardProps> = ({ groups, onAdopt, onDismiss }) => {
  const [expanded, setExpanded] = React.useState(false)
  const [selectedByFavorite, setSelectedByFavorite] = React.useState<Record<number, string[]>>(() =>
    Object.fromEntries(groups.map((group) => [group.favoriteId, group.candidates])),
  )
  const [completedByFavorite, setCompletedByFavorite] = React.useState<Record<number, number>>({})
  const [skippedFavorites, setSkippedFavorites] = React.useState<Set<number>>(() => new Set())
  const visibleGroups = expanded ? groups : groups.slice(0, 2)

  const toggleCandidate = useMemoizedFn((favoriteId: number, candidate: string) => {
    setSelectedByFavorite((current) => {
      const selected = current[favoriteId] ?? []
      return {
        ...current,
        [favoriteId]: selected.includes(candidate)
          ? selected.filter((item) => item !== candidate)
          : [...selected, candidate],
      }
    })
  })

  const handleAdopt = useMemoizedFn(async (group: TagSuggestionGroup) => {
    const selected = selectedByFavorite[group.favoriteId] ?? []
    if (selected.length === 0) return
    const adoptedCount = await onAdopt(group.favoriteId, selected)
    setCompletedByFavorite((current) => ({ ...current, [group.favoriteId]: adoptedCount }))
  })

  const handleSkip = useMemoizedFn((favoriteId: number) => {
    setSkippedFavorites((current) => new Set([...current, favoriteId]))
  })

  if (groups.length === 0) return null

  return (
    <section
      className="mt-3 w-full rounded-lg border border-[#BF00FF]/25 bg-[#BF00FF]/5 p-3 text-left"
      aria-labelledby="tag-suggestion-title"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id="tag-suggestion-title"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-800"
        >
          <Tag className="h-3.5 w-3.5 text-[#A000D9]" aria-hidden={true} />
          为这些收藏夹沉淀标签（下次可直接命中）
        </h3>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors duration-200 hover:bg-white hover:text-gray-600"
          aria-label="关闭标签建议"
        >
          <X className="h-3.5 w-3.5" aria-hidden={true} />
        </button>
      </div>

      <div className="mt-2">
        {visibleGroups.map((group, index) => {
          const selected = selectedByFavorite[group.favoriteId] ?? []
          const completedCount = completedByFavorite[group.favoriteId]
          const skipped = skippedFavorites.has(group.favoriteId)

          return (
            <div
              key={group.favoriteId}
              className={cn(index > 0 && 'mt-2 border-t border-[#BF00FF]/10 pt-2')}
            >
              {completedCount != null ? (
                <p className="flex items-center gap-1.5 py-1 text-xs font-medium text-[#A000D9]">
                  <Check className="h-3.5 w-3.5" aria-hidden={true} />
                  已添加 {completedCount} 个标签到「{group.favoriteTitle}」
                </p>
              ) : skipped ? (
                <p className="py-1 text-xs text-gray-500">已跳过「{group.favoriteTitle}」</p>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-700">
                    「{group.favoriteTitle}」本次移入 {group.videoCount} 个视频
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.candidates.map((candidate) => {
                      const isSelected = selected.includes(candidate)
                      return (
                        <button
                          key={candidate}
                          type="button"
                          onClick={() => toggleCandidate(group.favoriteId, candidate)}
                          aria-pressed={isSelected}
                          className={cn(
                            'inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200',
                            isSelected
                              ? 'border-[#BF00FF]/30 bg-[#BF00FF]/15 text-[#A000D9]'
                              : 'border-gray-200 bg-white text-gray-500',
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" aria-hidden={true} />}
                          {candidate}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(group.favoriteId)}
                      className="h-8 text-xs text-gray-500"
                    >
                      跳过
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={selected.length === 0}
                      onClick={() => {
                        handleAdopt(group).catch(() => {})
                      }}
                      className="h-8 bg-[#BF00FF] text-xs text-white hover:bg-[#A000D9]"
                    >
                      采纳 {selected.length} 个
                    </Button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {groups.length > 2 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[#A000D9] hover:underline"
        >
          展开更多 {groups.length - 2} 个收藏夹
          <ChevronDown className="h-3.5 w-3.5" aria-hidden={true} />
        </button>
      )}
    </section>
  )
}

export default TagSuggestionCard
