import React from 'react'
import { CheckCircle2, Circle, Loader2, MinusCircle, Sparkles, XCircle } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { fetchAllFavoriteMedias, fetchAIMove } from '@/utils/api'
import { MessageEnum } from '@/utils/message'
import { createStreamAdapter } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'
import { useGlobalConfig } from '@/store/global-data'
import { sleep } from '@/utils/promise'
import { toast, useFavoriteListData } from '@/hooks'
import { AIError } from '@/utils/error'
import { extractCompleteObjects, parseAIJSON } from '@/utils/parse-ai-json'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { batchProcess } from '@/utils/batch-process'
import { notifyOrganizeDone } from '@/utils/pet-message'
import { useStarInvitation } from '@/hooks/use-star-invitation'
import ReviewPanel from './review-panel'
import { shouldRecordAIMoveUse } from './star-invitation'
import type { AIMoveResult, AIMoveStatus } from './types'

type AIMoveStage = 'idle' | 'analyzing' | 'reviewing' | 'moving' | 'finished'

type AIClassificationResult = {
  title: string
  targetFavorite: string
  reason: string
}

class AIMoveRunInterruptedError extends Error {
  constructor() {
    super('AI organize run interrupted')
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

const useAIMove = () => {
  const { moveVideosCache } = useFavoriteListData()
  const dataContext = useGlobalConfig(
    useShallow((state) => ({
      keyword: state.keyword,
      favoriteData: state.favoriteData,
      defaultFavoriteId: state.defaultFavoriteId,
      aiConfig: state.aiConfig,
    })),
  )
  const [stage, setStage] = React.useState<AIMoveStage>('idle')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [moveResults, setMoveResults] = React.useState<AIMoveResult[]>([])
  const [sourceFavoriteId, setSourceFavoriteId] = React.useState<number | null>(null)
  const [progress, setProgress] = React.useState({ current: 0, total: 0, currentTitle: '' })
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const streamRef = React.useRef<{ cancel: () => void } | null>(null)
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
        status: result.targetFavoriteId === currentSourceFavoriteId ? 'skipped' : 'pending',
      }))

      updateStage('moving')
      setMoveResults(workingResults)
      setProgress({ current: 0, total: workingResults.length, currentTitle: '' })

      for (let index = 0; index < workingResults.length; index++) {
        ensureRunActive()
        const result = workingResults[index]
        let completedResult: AIMoveResult

        if (result.targetFavoriteId === currentSourceFavoriteId) {
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
        setProgress({
          current: index + 1,
          total: workingResults.length,
          currentTitle: completedResult.videoTitle,
        })

        if (index < workingResults.length - 1) {
          await sleep(100)
        }
      }

      ensureRunActive()
      const successCount = workingResults.filter((result) => result.status === 'success').length
      const failCount = workingResults.filter((result) => result.status === 'failed').length
      const skippedCount = workingResults.filter((result) => result.status === 'skipped').length
      const fallbackCount = workingResults.filter((result) => result.isFallback).length

      toast({
        title: '移动完成',
        description: `成功: ${successCount}, 保留: ${skippedCount}, 失败: ${failCount}${fallbackCount > 0 ? `, 兜底: ${fallbackCount}` : ''}`,
      })

      if (shouldRecordAIMoveUse(successCount, skippedCount)) {
        if (successCount > 0) {
          notifyOrganizeDone(successCount)
        }
        try {
          await recordSuccessfulUse()
        } catch (error) {
          console.warn('[AI Move] 记录成功使用次数失败:', error)
        }
        ensureRunActive()
      }

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
        description: '请先在设置页面设置默认收藏夹',
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
    setProgress({ current: 0, total: 0, currentTitle: '' })
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

      setProgress({ current: 0, total: videos.length, currentTitle: '' })

      const allResults: AIMoveResult[] = []
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
          isFallback: targetFavorite == null,
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
        setProgress({
          current: allResults.length,
          total: videos.length,
          currentTitle: result.videoTitle,
        })
      }

      await batchProcess(videos, {
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
              if (error instanceof AIMoveRunInterruptedError) {
                throw error
              }
              console.warn('[AI Move] 残留 buffer 解析失败:', buffer)
            }
          }
        },
      })
      ensureRunActive()

      if (allResults.length === 0) {
        throw new AIError('AI 未返回可用的整理结果，请重试')
      }

      if ((aiConfig.aiMoveExecutionMode ?? 'ask') === 'auto') {
        await executeMovePlan(allResults, currentSourceFavoriteId, runId, abortController)
      } else {
        setMoveResults(allResults)
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
          ? { ...result, targetFavoriteId, status: 'pending', isFallback: false }
          : result,
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
      toast({
        title: '已取消整理',
        description: '没有移动任何视频',
      })
    } else {
      toast({
        title: '已取消分析',
        description: '没有移动任何视频',
      })
    }
  })

  const closeFinished = useMemoizedFn(() => {
    setIsModalOpen(false)
    updateStage('idle')
    showStarInvitationAfterClose()
  })

  const progressValue = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  const successCount = moveResults.filter((result) => result.status === 'success').length
  const failedCount = moveResults.filter((result) => result.status === 'failed').length
  const skippedCount = moveResults.filter((result) => result.status === 'skipped').length

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

  const isLoadingElement = isModalOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={stage === 'reviewing' ? '确认 AI 整理结果' : 'AI 整理进度'}
    >
      {stage === 'reviewing' && sourceFavoriteId != null ? (
        <ReviewPanel
          results={moveResults}
          favorites={dataContext.favoriteData}
          sourceFavoriteId={sourceFavoriteId}
          onTargetChange={handleTargetChange}
          onCancel={cancelMove}
          onConfirm={handleConfirmMove}
        />
      ) : (
        <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#00AEEC]/20 bg-white p-5 shadow-2xl">
          {stage === 'analyzing' && (
            <div className="flex min-h-0 flex-col items-center">
              <img alt="AI 正在分析" src={loadingGif} className="mb-3 h-20 w-20" />
              <h2 className="text-base font-semibold text-gray-900">
                {progress.total === 0 ? '正在获取收藏夹视频...' : 'AI 正在分析整理方案'}
              </h2>
              {progress.total > 0 && (
                <div className="mt-3 w-full">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                    <span>已分析 {progress.current} 个</span>
                    <span>{progress.total} 个视频</span>
                  </div>
                  <Progress
                    value={progressValue}
                    aria-label={`AI 分析进度 ${progress.current}/${progress.total}`}
                    indicatorClassName="bg-[#00AEEC]"
                  />
                  {progress.currentTitle && (
                    <p
                      className="mt-2 truncate text-center text-xs text-gray-500"
                      title={progress.currentTitle}
                    >
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
                      <Sparkles
                        className="h-3.5 w-3.5 shrink-0 text-[#FB7299]"
                        aria-hidden={true}
                      />
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

              <Button
                type="button"
                onClick={cancelMove}
                variant="outline"
                className="mt-4 min-h-11"
              >
                取消分析
              </Button>
            </div>
          )}

          {stage === 'moving' && (
            <div className="flex min-h-0 flex-col items-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00AEEC]/10 text-[#008CC1]">
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden={true} />
              </span>
              <h2 className="mt-3 text-base font-semibold text-gray-900">正在移动视频</h2>
              <div className="mt-3 w-full">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                  <span>已处理 {progress.current} 个</span>
                  <span>{progress.total} 个结果</span>
                </div>
                <Progress
                  value={progressValue}
                  aria-label={`视频移动进度 ${progress.current}/${progress.total}`}
                  indicatorClassName="bg-[#00AEEC]"
                />
                {progress.currentTitle && (
                  <p
                    className="mt-2 truncate text-center text-xs text-gray-500"
                    title={progress.currentTitle}
                  >
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

              <Button
                type="button"
                onClick={cancelMove}
                variant="outline"
                className="mt-4 min-h-11"
              >
                停止移动
              </Button>
            </div>
          )}

          {stage === 'finished' && (
            <div className="flex min-h-0 flex-col items-center">
              <Finished start={true} height={130} width={130} title="AI 整理完成！" />
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

              <Button
                type="button"
                onClick={closeFinished}
                variant="outline"
                className="mt-4 min-h-11"
              >
                关闭
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null

  return {
    cancelMove,
    handleConfirmMove,
    isLoadingElement,
    handleAIMove,
    handleTargetChange,
  }
}

export { useAIMove }
