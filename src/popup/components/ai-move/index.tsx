import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { useGlobalConfig } from '@/store/global-data'
import { useAIMove } from './use-ai-move'
import PreflightDialog, { type PreflightDialogKind } from './preflight-dialog'

type AIMoveProps = {
  onRequestDefaultFavorite?: () => void
}

const AIMove: React.FC<AIMoveProps> = ({ onRequestDefaultFavorite }) => {
  const { handleAIMove, isLoadingElement, isBusy } = useAIMove()
  const { defaultFavoriteId, keyword } = useGlobalConfig(
    useShallow((state) => ({
      defaultFavoriteId: state.defaultFavoriteId,
      keyword: state.keyword,
    })),
  )
  const [preflightKind, setPreflightKind] = React.useState<
    Extract<PreflightDialogKind, 'missing-default' | 'no-tags'> | null
  >(null)

  const startOrganize = useMemoizedFn(() => {
    setPreflightKind(null)
    handleAIMove().catch(() => {})
  })

  const handleClick = useMemoizedFn(() => {
    if (defaultFavoriteId == null) {
      setPreflightKind('missing-default')
      return
    }

    const hasAnyTags = keyword.some((item) => item.value.some((tag) => tag.value.trim().length > 0))
    if (!hasAnyTags) {
      setPreflightKind('no-tags')
      return
    }

    startOrganize()
  })

  const handlePrimary = useMemoizedFn(() => {
    if (preflightKind === 'missing-default') {
      setPreflightKind(null)
      onRequestDefaultFavorite?.()
      return
    }
    startOrganize()
  })

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="min-h-11 w-full justify-start rounded-lg bg-gradient-to-r from-[#BF00FF] to-[#FF1493] px-3 text-left text-white shadow-sm transition-colors duration-200 hover:from-[#A000D9] hover:to-[#D6006F] focus-visible:ring-[#BF00FF]"
        title="自动把默认收藏夹的视频归类到合适的收藏夹"
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden={true} />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden={true} />
        )}
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="text-sm font-semibold">智能整理</span>
          <span className="truncate text-[11px] font-normal text-white/80">
            自动把默认收藏夹的视频归类到合适的收藏夹
          </span>
        </span>
      </Button>

      {isLoadingElement}

      <PreflightDialog
        kind={preflightKind}
        onCancel={() => setPreflightKind(null)}
        onPrimary={handlePrimary}
      />
    </>
  )
}

export default AIMove
