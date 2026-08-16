import React from 'react'
import { CheckCircle2, Circle, Loader2, MinusCircle, Sparkles, Tag, XCircle } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { checkAIGateQuota, fetchAllFavoriteMedias, fetchAIMove } from '@/utils/api'
import { MessageEnum } from '@/utils/message'
import { createStreamAdapter } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'
import { useGlobalConfig } from '@/store/global-data'
import { sleep } from '@/utils/promise'
import { toast, useFavoriteListData } from '@/hooks'
import { AIError } from '@/utils/error'
import { extractCompleteObjects, parseAIJSON } from '@/utils/parse-ai-json'
import Finished from '@/components/finished-animate'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { batchProcess } from '@/utils/batch-process'
import { notifyOrganizeDone } from '@/utils/pet-message'
import { useStarInvitation } from '@/hooks/use-star-invitation'
import { matchVideosByTags } from '@/utils/tag-matcher'
import {
  incrementTagSuggestionAdopted,
  recordHybridOrganizeRun,
  recordTagHits,
} from '@/utils/hybrid-organize-storage'
import { createTagSuggestionGroups, type TagSuggestionGroup } from '@/utils/tag-suggestions'
import ReviewPanel from './review-panel'
import TagSuggestionCard from './tag-suggestion-card'
import PreflightDialog, { type PreflightDialogKind } from './preflight-dialog'
import { shouldRecordAIMoveUse } from './star-invitation'
import type { AIMoveResult, AIMoveStatus } from './types'

type AIMoveStage = 'idle' | 'analyzing' | 'reviewing' | 'moving' | 'finished'

type AIClassificationResult = {
  title: string
  targetFavorite: string
  reason: string
}

type AIMoveProgress = {
  tagMatched: number
  aiCurrent: number
  aiTotal: number
  moveCurrent: number
  moveTotal: number
  currentTitle: string
}

type QuotaDialogState = {
  kind: Extract<PreflightDialogKind, 'quota-empty' | 'quota-warning'>
  aiVideoCount: number
  remainingQuota: number
}

type QuotaDecision = 'continue' | 'cancel' | 'configure'

const INITIAL_PROGRESS: AIMoveProgress = {
  tagMatched: 0,
  aiCurrent: 0,
  aiTotal: 0,
  moveCurrent: 0,
  moveTotal: 0,
  currentTitle: '',
}

class AIMoveRunInterruptedError extends Error {
  constructor() {
    super('Smart organize run interrupted')
    this.name = 'AIMoveRunInterruptedError'
  }
}

const isAIClassificationResult = (value: unknown): value is AIClassificationResult => {
  if (typeof value !== 'object' || value == null) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.targetFavorite === 'string' &&
    typeof candidate.reason === 'string'
  )
}

const renderStatusIcon = (status: AIMoveStatus) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden={true} />
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden={true} />
    case 'skipped':
      return <MinusCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden={true} />
    default:
      return <Circle className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden={true} />
  }
}

const useAIMove = () => {
  const { moveVideosCache } = useFavoriteListData()
  const dataContext = useGlobalConfig(
    useShallow((state) => ({
      keyword: state.keyword,
      favoriteData: state.favoriteData,
      defaultFavoriteId: state.defaultFavoriteId,
      aiConfig: state.aiConfig,
      getGlobalData: state.getGlobalData,
      setGlobalData: state.setGlobalData,
    })),
  )
  const [stage, setStage] = React.useState<AIMoveStage>('idle')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [moveResults, setMoveResults] = React.useState<AIMoveResult[]>([])
  const [sourceFavoriteId, setSourceFavoriteId] = React.useState<number | null>(null)
  const [progress, setProgress] = React.useState<AIMoveProgress>(INITIAL_PROGRESS)
  const [quotaDialog, setQuotaDialog] = React.useState<QuotaDialogState | null>(null)
  const [tagSuggestions, setTagSuggestions] = React.useState<TagSuggestionGroup[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = React.useState(true)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const streamRef = React.useRef<{ cancel: () => void } | null>(null)
  const quotaDecisionRef = React.useRef<((decision: QuotaDecision) => void) | null>(null)
  const isProcessingRef = React.useRef(false)
  const activeRunIdRef = React.useRef(0)
  const stageRef = React.useRef<AIMoveStage>('idle')
  const { recordSuccessfulUse, resetStarInvitation, showStarInvitationAfterClose } =
    useStarInvitation('popup')

  const favoriteMap = React.useMemo(() => {
    const map = new Map<number, string>()
    dataContext.favoriteData.forEach((favorite) => {
      map.set(favorite.id, favorite.title)
    })
    return map
  }, [dataContext.favoriteData])

  const updateStage = useMemoizedFn((nextStage: AIMoveStage) => {
    stageRef.current = nextStage
    setStage(nextStage)
  })

  const createRunGuard = (runId: number, abortController: AbortController) => () => {
    if (activeRunIdRef.current !== runId || abortController.signal.aborted) {
      throw new AIMoveRunInterruptedError()
    }
  }

  const requestQuotaDecision = useMemoizedFn((state: QuotaDialogState) => {
    setQuotaDialog(state)
    return new Promise<QuotaDecision>((resolve) => {
      quotaDecisionRef.current = resolve
    })
  })

  const resolveQuotaDecision = useMemoizedFn((decision: QuotaDecision) => {
    const resolve = quotaDecisionRef.current
    quotaDecisionRef.current = null
    setQuotaDialog(null)
    resolve?.(decision)
  })

  const moveOneVideo = useMemoizedFn(
    async (result: AIMoveResult, currentSourceFavoriteId: number): Promise<AIMoveResult> => {
      try {
        await queryAndSendMessage({
          type: MessageEnum.moveVideo,
          data: {
            srcMediaId: currentSourceFavoriteId,
            tarMediaId: result.targetFavoriteId,
            videoId: result.videoId,
          },
        })
        return { ...result, status: 'success' }
      } catch (error) {
        console.error('Move failed:', error)
        return { ...result, status: 'failed', reason: '移动失败' }
      }
    },
  )

  const buildSuggestions = useMemoizedFn((results: AIMoveResult[]) => {
    const latestData = dataContext.getGlobalData?.() ?? { keyword: dataContext.keyword }
    const grouped = new Map<number, string[]>()

    results
      .filter(
        (result) =>
          result.status === 'success' && result.source === 'ai' && !result.manuallyAdjusted,
      )
      .forEach((result) => {
        grouped.set(result.targetFavoriteId, [
          ...(grouped.get(result.targetFavoriteId) ?? []),
          result.videoTitle,
        ])
      })

    return createTagSuggestionGroups(
      [...grouped.entries()].map(([favoriteId, titles]) => ({
        favoriteId,
        favoriteTitle: favoriteMap.get(favoriteId) ?? '未命名收藏夹',
        titles,
        existingTags:
          latestData.keyword
            .find((item) => item.favoriteDataId === favoriteId)
            ?.value.map((item) => item.value) ?? [],
      })),
    )
  })

  const executeMovePlan = useMemoizedFn(
    async (
      plan: AIMoveResult[],
      currentSourceFavoriteId: number,
      runId: number,
      abortController: AbortController,
    ) => {
      const ensureRunActive = createRunGuard(runId, abortController)
      const workingResults = plan.map<AIMoveResult>((result) => ({
        ...result,
        status:
          result.selected === false || result.targetFavoriteId === currentSourceFavoriteId
            ? 'skipped'
            : 'pending',
      }))

      updateStage('moving')
      setMoveResults(workingResults)
      setProgress((current) => ({
        ...current,
        moveCurrent: 0,
        moveTotal: workingResults.length,
        currentTitle: '',
      }))

      for (let index = 0; index < workingResults.length; index++) {
        ensureRunActive()
        const result = workingResults[index]
        let completedResult: AIMoveResult

        if (result.selected === false || result.targetFavoriteId === currentSourceFavoriteId) {
          completedResult = { ...result, status: 'skipped' }
        } else {
          completedResult = await moveOneVideo(result, currentSourceFavoriteId)
          if (completedResult.status === 'success') {
            moveVideosCache(
              currentSourceFavoriteId.toString(),
              completedResult.targetFavoriteId.toString(),
              [completedResult.videoId],
            )
          }
          ensureRunActive()
        }

        workingResults[index] = completedResult
        setMoveResults([...workingResults])
        setProgress((current) => ({
          ...current,
          moveCurrent: index + 1,
          moveTotal: workingResults.length,
          currentTitle: completedResult.videoTitle,
        }))

        if (index < workingResults.length - 1) {
          await sleep(100)
        }
      }

      ensureRunActive()
      const successCount = workingResults.filter((result) => result.status === 'success').length
      const failCount = workingResults.filter((result) => result.status === 'failed').length
      const skippedCount = workingResults.filter((result) => result.status === 'skipped').length
      const fallbackCount = workingResults.filter((result) => result.isFallback).length
      const tagCount = workingResults.filter((result) => result.source === 'tag').length
      const aiCount = workingResults.filter((result) => result.source === 'ai').length

      toast({
        title: '整理完成',
        description: `标签命中 ${tagCount}，AI 处理 ${aiCount}；成功 ${successCount}，保留 ${skippedCount}，失败 ${failCount}${fallbackCount > 0 ? `，兜底 ${fallbackCount}` : ''}`,
      })

      try {
        await Promise.all([
          recordHybridOrganizeRun({ tagHits: tagCount, aiHandled: aiCount, skipped: skippedCount }),
          recordTagHits(
            workingResults
              .filter((result) => result.source === 'tag' && result.matchedTags?.length)
              .map((result) => ({
                favoriteId: result.targetFavoriteId,
                matchedTags: result.matchedTags ?? [],
              })),
          ),
        ])
      } catch (error) {
        console.warn('[Smart Organize] 保存本地统计失败:', error)
      }
      ensureRunActive()

      if (shouldRecordAIMoveUse(successCount, skippedCount)) {
        if (successCount > 0) {
          notifyOrganizeDone(successCount)
        }
        try {
          await recordSuccessfulUse()
        } catch (error) {
          console.warn('[Smart Organize] 记录成功使用次数失败:', error)
        }
        ensureRunActive()
      }

      setTagSuggestions(buildSuggestions(workingResults))
      setShowTagSuggestions(true)
      updateStage('finished')
    },
  )

  const handleAIMove = useMemoizedFn(async () => {
    if (isProcessingRef.current) {
      toast({
        title: '已有整理任务进行中',
        description: '请先取消当前任务后再开始新的整理',
      })
      return
    }

    const useCustomAI = dataContext.aiConfig.configMode === 'custom'
    const hasCustomKey = Boolean(dataContext.aiConfig.key && dataContext.aiConfig.model)

    if (useCustomAI && !hasCustomKey) {
      toast({
        title: '未配置 AI',
        description: '请先在设置页面配置 AI 或切换到免费额度',
        variant: 'destructive',
      })
      setTimeout(() => {
        window.open(`${chrome.runtime.getURL('options.html')}?tab=setting`, '_blank')
      }, 1500)
      return
    }

    if (dataContext.defaultFavoriteId == null) {
      toast({
        title: '未设置默认收藏夹',
        description: '请先设置默认收藏夹',
        variant: 'destructive',
      })
      return
    }

    const currentSourceFavoriteId = dataContext.defaultFavoriteId
    const favoriteData = dataContext.favoriteData
    const keyword = dataContext.keyword
    const aiConfig = dataContext.aiConfig
    const runId = activeRunIdRef.current + 1
    const abortController = new AbortController()
    const ensureRunActive = createRunGuard(runId, abortController)

    activeRunIdRef.current = runId
    abortControllerRef.current = abortController
    isProcessingRef.current = true
    setSourceFavoriteId(currentSourceFavoriteId)
    setMoveResults([])
    setProgress(INITIAL_PROGRESS)
    setTagSuggestions([])
    setShowTagSuggestions(true)
    setIsModalOpen(true)
    updateStage('analyzing')
    resetStarInvitation()

    try {
      const defaultFavorite = favoriteData.find(
        (favorite) => favorite.id === currentSourceFavoriteId,
      )
      const videos = await fetchAllFavoriteMedias(currentSourceFavoriteId.toString(), {
        mediaCount: defaultFavorite?.media_count,
      })
      ensureRunActive()

      if (videos.length === 0) {
        toast({
          title: '暂无数据',
          description: '默认收藏夹中没有视频需要整理',
        })
        setIsModalOpen(false)
        updateStage('idle')
        return
      }

      const tagSummary = matchVideosByTags(videos, favoriteData, keyword, currentSourceFavoriteId)
      const tagResults: AIMoveResult[] = tagSummary.matched.map((result) => ({
        status: result.isSourceMatch ? 'skipped' : 'pending',
        targetFavoriteId: result.targetFavoriteId,
        videoId: result.videoId,
        videoTitle: result.videoTitle,
        reason: result.isSourceMatch ? '命中默认收藏夹标签，建议保留' : '标签唯一命中',
        source: 'tag',
        matchedTags: result.matchedTags,
        selected: true,
      }))
      const aiVideos = tagSummary.unresolved.map((result) => ({
        id: result.videoId,
        title: result.videoTitle,
        candidateFavorites: result.candidateFavoriteTitles,
      }))

      setMoveResults(tagResults)
      setProgress({
        ...INITIAL_PROGRESS,
        tagMatched: tagResults.length,
        aiTotal: aiVideos.length,
      })

      if (!useCustomAI && aiVideos.length > 0) {
        try {
          const quota = await checkAIGateQuota()
          ensureRunActive()
          const remainingQuota = quota.quotaInfo.daily.remaining
          const requiredRequests = Math.ceil(aiVideos.length / 1000)

          if (!quota.hasQuota || remainingQuota <= 0) {
            const decision = await requestQuotaDecision({
              kind: 'quota-empty',
              aiVideoCount: aiVideos.length,
              remainingQuota,
            })
            ensureRunActive()
            if (decision !== 'continue') {
              setIsModalOpen(false)
              updateStage('idle')
              return
            }
          } else if (requiredRequests > remainingQuota) {
            const decision = await requestQuotaDecision({
              kind: 'quota-warning',
              aiVideoCount: aiVideos.length,
              remainingQuota,
            })
            ensureRunActive()
            if (decision !== 'continue') {
              setIsModalOpen(false)
              updateStage('idle')
              return
            }
          }
        } catch (error) {
          if (error instanceof AIMoveRunInterruptedError) throw error
          console.warn('[Smart Organize] 配额预检查失败，将由请求阶段继续校验:', error)
        }
      }

      const allResults: AIMoveResult[] = [...tagResults]
      const resolvedVideoIds = new Set<number>()
      const favoriteTitles = favoriteData.map((favorite) => favorite.title)
      const favoriteTagsMap: Record<string, string[]> = {}
      favoriteData.forEach((favorite) => {
        const keywordItem = keyword.find((item) => item.favoriteDataId === favorite.id)
        if (keywordItem?.value.length) {
          favoriteTagsMap[favorite.title] = keywordItem.value.map((value) => value.value)
        }
      })
      const config = {
        apiKey: aiConfig.key ?? '',
        baseURL: aiConfig.baseUrl ?? '',
        model: aiConfig.model ?? '',
        extraParams: aiConfig.extraParams ?? {},
      }

      const resolveAIResult = (
        aiResult: unknown,
        batchVideos: Array<{ id: number; title: string }>,
      ): AIMoveResult | null => {
        if (!isAIClassificationResult(aiResult)) return null

        const video = batchVideos.find(
          (item) => item.title === aiResult.title && !resolvedVideoIds.has(item.id),
        )
        if (!video) return null
        resolvedVideoIds.add(video.id)

        const targetFavorite = favoriteData.find(
          (favorite) => favorite.title === aiResult.targetFavorite,
        )

        return {
          status: 'pending',
          targetFavoriteId: targetFavorite?.id ?? currentSourceFavoriteId,
          videoId: video.id,
          videoTitle: video.title,
          reason: aiResult.reason,
          source: 'ai',
          isFallback: targetFavorite == null,
          selected: true,
        }
      }

      const appendAIResult = (
        aiResult: unknown,
        batchVideos: Array<{ id: number; title: string }>,
      ) => {
        const result = resolveAIResult(aiResult, batchVideos)
        if (!result) return

        allResults.push(result)
        setMoveResults([...allResults])
        setProgress((current) => ({
          ...current,
          aiCurrent: current.aiCurrent + 1,
          currentTitle: result.videoTitle,
        }))
      }

      if (aiVideos.length > 0) {
        await batchProcess(aiVideos, {
          maxSize: 1000,
          async processCallback(batchVideos) {
            ensureRunActive()
            const stream = await fetchAIMove(
              batchVideos,
              favoriteTitles,
              config,
              useCustomAI,
              favoriteTagsMap,
            )
            try {
              ensureRunActive()
            } catch (error) {
              stream.cancel()
              throw error
            }
            streamRef.current = stream
            const reader = stream.toReadableStream().getReader()
            const adapter = createStreamAdapter(aiConfig.adapter)
            let buffer = ''

            while (true) {
              try {
                ensureRunActive()
              } catch (error) {
                await reader.cancel()
                stream.cancel()
                throw error
              }

              const { value, done } = await reader.read()
              ensureRunActive()
              if (done) break

              buffer += adapter.parse(value)
              const { objects, remaining } = extractCompleteObjects(buffer)
              buffer = remaining

              objects.forEach((aiObject) => {
                ensureRunActive()
                appendAIResult(aiObject, batchVideos)
              })
            }

            if (streamRef.current === stream) {
              streamRef.current = null
            }

            if (buffer.trim()) {
              try {
                const lastObjects = parseAIJSON<unknown[]>(`[${buffer}]`)
                lastObjects.forEach((aiObject) => {
                  ensureRunActive()
                  appendAIResult(aiObject, batchVideos)
                })
              } catch (error) {
                if (error instanceof AIMoveRunInterruptedError) throw error
                console.warn('[Smart Organize] 残留 buffer 解析失败:', buffer)
              }
            }
          },
        })
        ensureRunActive()

        aiVideos
          .filter((video) => !resolvedVideoIds.has(video.id))
          .forEach((video) => {
            allResults.push({
              status: 'pending',
              targetFavoriteId: currentSourceFavoriteId,
              videoId: video.id,
              videoTitle: video.title,
              reason: 'AI 未返回可用的整理结果',
              source: 'ai',
              isFallback: true,
              selected: true,
            })
          })
      }

      setMoveResults(allResults)
      if ((aiConfig.aiMoveExecutionMode ?? 'ask') === 'auto') {
        await executeMovePlan(allResults, currentSourceFavoriteId, runId, abortController)
      } else {
        updateStage('reviewing')
      }
    } catch (error) {
      if (
        error instanceof AIMoveRunInterruptedError ||
        activeRunIdRef.current !== runId ||
        abortController.signal.aborted
      ) {
        return
      }

      setIsModalOpen(false)
      updateStage('idle')
      if (error instanceof AIError) {
        toast({
          title: '整理失败',
          description: error.message,
          detail: error.detail,
          variant: 'destructive',
        })
      } else if (error instanceof Error) {
        toast({
          title: '整理失败',
          description: error.message,
          variant: 'destructive',
        })
      }
    } finally {
      if (activeRunIdRef.current === runId) {
        isProcessingRef.current = false
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    }
  })

  const handleTargetChange = useMemoizedFn((videoId: number, targetFavoriteId: number) => {
    setMoveResults((currentResults) =>
      currentResults.map((result) =>
        result.videoId === videoId
          ? {
              ...result,
              targetFavoriteId,
              status: 'pending',
              isFallback: false,
              manuallyAdjusted: true,
              selected: true,
            }
          : result,
      ),
    )
  })

  const handleSelectionChange = useMemoizedFn((videoId: number, selected: boolean) => {
    setMoveResults((currentResults) =>
      currentResults.map((result) =>
        result.videoId === videoId ? { ...result, selected } : result,
      ),
    )
  })

  const handleSelectAllTagResults = useMemoizedFn(() => {
    setMoveResults((currentResults) =>
      currentResults.map((result) =>
        result.source === 'tag' ? { ...result, selected: true } : result,
      ),
    )
  })

  const handleConfirmMove = useMemoizedFn(async () => {
    if (stageRef.current !== 'reviewing' || sourceFavoriteId == null) return
    if (isProcessingRef.current) return

    const runId = activeRunIdRef.current + 1
    const abortController = new AbortController()
    activeRunIdRef.current = runId
    abortControllerRef.current = abortController
    isProcessingRef.current = true

    try {
      await executeMovePlan(moveResults, sourceFavoriteId, runId, abortController)
    } catch (error) {
      if (
        error instanceof AIMoveRunInterruptedError ||
        activeRunIdRef.current !== runId ||
        abortController.signal.aborted
      ) {
        return
      }

      updateStage('reviewing')
      toast({
        title: '移动失败',
        description: error instanceof Error ? error.message : '执行移动时发生未知错误',
        variant: 'destructive',
      })
    } finally {
      if (activeRunIdRef.current === runId) {
        isProcessingRef.current = false
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    }
  })

  const cancelMove = useMemoizedFn(() => {
    const currentStage = stageRef.current
    resolveQuotaDecision('cancel')
    activeRunIdRef.current += 1
    isProcessingRef.current = false
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    streamRef.current?.cancel()
    streamRef.current = null
    setIsModalOpen(false)
    updateStage('idle')

    if (currentStage === 'moving') {
      toast({
        title: '已停止移动',
        description: '已完成的移动不会撤销，其余视频已停止处理',
      })
    } else if (currentStage === 'reviewing') {
      toast({ title: '已取消整理', description: '没有移动任何视频' })
    } else {
      toast({ title: '已取消分析', description: '没有移动任何视频' })
    }
  })

  const closeFinished = useMemoizedFn(() => {
    setIsModalOpen(false)
    updateStage('idle')
    showStarInvitationAfterClose()
  })

  const adoptSuggestions = useMemoizedFn(async (favoriteId: number, tags: string[]) => {
    const latestData = dataContext.getGlobalData()
    const keyword = latestData.keyword.map((item) => ({
      ...item,
      value: [...item.value],
    }))
    let target = keyword.find((item) => item.favoriteDataId === favoriteId)
    if (!target) {
      target = { favoriteDataId: favoriteId, value: [] }
      keyword.push(target)
    }

    const existing = new Set(target.value.map((item) => item.value.trim().toLowerCase()))
    const uniqueTags = tags.filter((tag) => !existing.has(tag.trim().toLowerCase()))
    const availableCount = Math.max(20 - target.value.length, 0)
    const adoptedTags = uniqueTags.slice(0, availableCount)

    if (adoptedTags.length === 0) {
      toast({
        title: '标签已达上限',
        description: '每个收藏夹最多 20 个标签，可前往标签管理器清理。',
      })
      return 0
    }

    const createdAt = Date.now()
    target.value.push(
      ...adoptedTags.map((tag, index) => ({
        id: `${favoriteId}-${createdAt}-${index}`,
        value: tag,
        createdAt,
      })),
    )
    dataContext.setGlobalData({ keyword })
    await incrementTagSuggestionAdopted(adoptedTags.length)

    if (adoptedTags.length < uniqueTags.length) {
      toast({
        title: '部分标签已采纳',
        description: `已添加 ${adoptedTags.length} 个，收藏夹标签总数已达 20 个上限。`,
      })
    }
    return adoptedTags.length
  })

  const progressValue =
    stage === 'moving'
      ? progress.moveTotal > 0
        ? (progress.moveCurrent / progress.moveTotal) * 100
        : 0
      : progress.aiTotal > 0
        ? (progress.aiCurrent / progress.aiTotal) * 100
        : progress.tagMatched > 0
          ? 100
          : 0
  const successCount = moveResults.filter((result) => result.status === 'success').length
  const failedCount = moveResults.filter((result) => result.status === 'failed').length
  const skippedCount = moveResults.filter((result) => result.status === 'skipped').length

  const isLoadingElement = isModalOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={stage === 'reviewing' ? '确认 AI 整理结果' : '智能整理进度'}
    >
      {stage === 'reviewing' && sourceFavoriteId != null ? (
        <ReviewPanel
          results={moveResults}
          favorites={dataContext.favoriteData}
          sourceFavoriteId={sourceFavoriteId}
          onTargetChange={handleTargetChange}
          onSelectionChange={handleSelectionChange}
          onSelectAllTagResults={handleSelectAllTagResults}
          onCancel={cancelMove}
          onConfirm={handleConfirmMove}
        />
      ) : (
        <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#BF00FF]/20 bg-white p-5 shadow-2xl">
          {stage === 'analyzing' && (
            <div className="flex min-h-0 flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#BF00FF]/10 to-[#FF1493]/10 text-[#A000D9]">
                <Sparkles className="h-8 w-8 motion-safe:animate-pulse" aria-hidden={true} />
              </span>
              <h2 className="mt-3 text-base font-semibold text-gray-900">
                {progress.tagMatched === 0 && progress.aiTotal === 0
                  ? '正在获取收藏夹视频...'
                  : progress.aiTotal === 0
                    ? '标签匹配已完成'
                    : '正在生成智能整理方案'}
              </h2>
              {(progress.tagMatched > 0 || progress.aiTotal > 0) && (
                <div className="mt-3 w-full">
                  <div
                    className="mb-1.5 flex items-center justify-between gap-3 text-xs text-gray-500"
                    aria-live="polite"
                  >
                    {progress.aiTotal === 0 ? (
                      <span className="font-medium text-[#A000D9]">
                        全部由标签匹配完成，未消耗 AI 配额
                      </span>
                    ) : (
                      <>
                        <span>标签已匹配 {progress.tagMatched} 个</span>
                        <span>
                          AI 分析中 {progress.aiCurrent}/{progress.aiTotal} 个
                        </span>
                      </>
                    )}
                  </div>
                  <Progress
                    value={progressValue}
                    aria-label={`智能整理进度 ${progress.aiCurrent}/${progress.aiTotal}`}
                    indicatorClassName="bg-gradient-to-r from-[#BF00FF] to-[#FF1493]"
                  />
                  {progress.currentTitle && (
                    <p className="mt-2 truncate text-center text-xs text-gray-500" title={progress.currentTitle}>
                      {progress.currentTitle}
                    </p>
                  )}
                </div>
              )}

              {moveResults.length > 0 && (
                <div className="scrollbar-thin mt-3 max-h-40 w-full overflow-y-auto overscroll-contain rounded-lg border border-gray-100 p-1">
                  {moveResults.map((result) => (
                    <div
                      key={result.videoId}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-gray-50"
                    >
                      {result.source === 'tag' ? (
                        <Tag className="h-3.5 w-3.5 shrink-0 text-[#A000D9]" aria-hidden={true} />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#D6006F]" aria-hidden={true} />
                      )}
                      <span className="min-w-0 flex-1 truncate" title={result.videoTitle}>
                        {result.videoTitle}
                      </span>
                      <span className="max-w-28 shrink-0 truncate text-gray-400">
                        → {favoriteMap.get(result.targetFavoriteId) || '保留'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" onClick={cancelMove} variant="outline" className="mt-4 min-h-11">
                取消分析
              </Button>
            </div>
          )}

          {stage === 'moving' && (
            <div className="flex min-h-0 flex-col items-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#BF00FF]/10 text-[#A000D9]">
                <Loader2 className="h-7 w-7 motion-safe:animate-spin" aria-hidden={true} />
              </span>
              <h2 className="mt-3 text-base font-semibold text-gray-900">正在移动视频</h2>
              <div className="mt-3 w-full">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                  <span>已处理 {progress.moveCurrent} 个</span>
                  <span>{progress.moveTotal} 个结果</span>
                </div>
                <Progress
                  value={progressValue}
                  aria-label={`视频移动进度 ${progress.moveCurrent}/${progress.moveTotal}`}
                  indicatorClassName="bg-[#BF00FF]"
                />
                {progress.currentTitle && (
                  <p className="mt-2 truncate text-center text-xs text-gray-500" title={progress.currentTitle}>
                    {progress.currentTitle}
                  </p>
                )}
              </div>

              <div className="scrollbar-thin mt-3 max-h-44 w-full overflow-y-auto overscroll-contain rounded-lg border border-gray-100 p-1">
                {moveResults.map((result) => (
                  <div
                    key={result.videoId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {renderStatusIcon(result.status)}
                    <span className="min-w-0 flex-1 truncate" title={result.videoTitle}>
                      {result.videoTitle}
                    </span>
                    <span className="max-w-28 shrink-0 truncate text-gray-400">
                      {result.status === 'skipped'
                        ? '保留'
                        : result.status === 'failed'
                          ? '失败'
                          : favoriteMap.get(result.targetFavoriteId) || '未知'}
                    </span>
                  </div>
                ))}
              </div>

              <Button type="button" onClick={cancelMove} variant="outline" className="mt-4 min-h-11">
                停止移动
              </Button>
            </div>
          )}

          {stage === 'finished' && (
            <div className="flex min-h-0 flex-col items-center">
              <Finished start={true} height={130} width={130} title="智能整理完成！" />
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
                <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                  成功 {successCount}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                  保留 {skippedCount}
                </span>
                {failedCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-600">
                    失败 {failedCount}
                  </span>
                )}
              </div>

              {showTagSuggestions && (
                <TagSuggestionCard
                  groups={tagSuggestions}
                  onAdopt={adoptSuggestions}
                  onDismiss={() => setShowTagSuggestions(false)}
                />
              )}

              <div className="scrollbar-thin mt-3 max-h-44 w-full overflow-y-auto overscroll-contain rounded-lg border border-gray-100 p-1">
                {moveResults.map((result) => (
                  <div
                    key={result.videoId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {renderStatusIcon(result.status)}
                    <span className="min-w-0 flex-1 truncate" title={result.videoTitle}>
                      {result.videoTitle}
                    </span>
                    <span className="max-w-28 shrink-0 truncate text-gray-400">
                      {result.status === 'skipped'
                        ? '保留'
                        : result.status === 'failed'
                          ? '移动失败'
                          : `→ ${favoriteMap.get(result.targetFavoriteId) || '未知'}`}
                    </span>
                  </div>
                ))}
              </div>

              <Button type="button" onClick={closeFinished} variant="outline" className="mt-4 min-h-11">
                关闭
              </Button>
            </div>
          )}
        </div>
      )}

      <PreflightDialog
        kind={quotaDialog?.kind ?? null}
        aiVideoCount={quotaDialog?.aiVideoCount}
        remainingQuota={quotaDialog?.remainingQuota}
        onCancel={() => resolveQuotaDecision('cancel')}
        onContinue={() => resolveQuotaDecision('continue')}
        onPrimary={() => {
          window.open(`${chrome.runtime.getURL('options.html')}?tab=setting`, '_blank')
          resolveQuotaDecision('configure')
        }}
      />
    </div>
  ) : null

  return {
    cancelMove,
    handleConfirmMove,
    isLoadingElement,
    handleAIMove,
    handleTargetChange,
    handleSelectionChange,
    handleSelectAllTagResults,
    isBusy: stage !== 'idle',
  }
}

export { useAIMove }
