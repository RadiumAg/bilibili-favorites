import React from 'react'
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
import { batchProcess } from '@/utils/batch-process'

type AIMoveStatus = 'success' | 'failed' | 'skipped'

type AIMoveResult = {
  status: AIMoveStatus
  targetFavoriteId: number
  videoId: number
  videoTitle: string
  reason: string
  isFallback?: boolean
}

const useAIMove = () => {
  const { moveVideosCache } = useFavoriteListData()
  const dataContext = useGlobalConfig(
    useShallow((state) => ({
      keyword: state.keyword,
      favoriteData: state.favoriteData,
      defaultFavoriteId: state.defaultFavoriteId,
      aiConfig: state.aiConfig,
      cookie: state.cookie,
    })),
  )
  const [isFinished, setIsFinished] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [moveResults, setMoveResults] = React.useState<AIMoveResult[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState({ current: 0, total: 0, currentTitle: '' })
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const streamRef = React.useRef<{ cancel: () => void } | null>(null)
  const isFinishedRef = React.useRef(false)

  const favoriteMap = React.useMemo(() => {
    const map = new Map<number, string>()
    dataContext.favoriteData.forEach((fav) => {
      map.set(fav.id, fav.title)
    })
    return map
  }, [dataContext.favoriteData])

  const resolveAIResult = useMemoizedFn(
    (aiResult: any, videos: { id: number; title: string }[]): AIMoveResult | null => {
      const video = videos.find((v) => v.title === aiResult.title)
      if (!video) return null

      const targetFavorite = dataContext.favoriteData.find(
        (fav) => fav.title === aiResult.targetFavorite,
      )
      const isFallback = !targetFavorite

      return {
        status: 'success' as AIMoveStatus,
        targetFavoriteId: targetFavorite?.id || dataContext.defaultFavoriteId!,
        videoId: video.id,
        videoTitle: video.title,
        reason: aiResult.reason,
        isFallback,
      }
    },
  )

  const moveOneVideo = useMemoizedFn(async (result: AIMoveResult): Promise<AIMoveResult> => {
    if (dataContext.defaultFavoriteId == null) return result

    try {
      await queryAndSendMessage({
        type: MessageEnum.moveVideo,
        data: {
          srcMediaId: dataContext.defaultFavoriteId,
          tarMediaId: result.targetFavoriteId,
          videoId: result.videoId,
        },
      })
      return { ...result, status: 'success' as AIMoveStatus }
    } catch (error) {
      console.error('Move failed:', error)
      return { ...result, status: 'failed' as AIMoveStatus, reason: '移动失败' }
    }
  })

  // 开始 AI 整理
  const handleAIMove = useMemoizedFn(async () => {
    // 根据 configMode 检查是否有可用配置
    const useCustomAI = dataContext.aiConfig?.configMode === 'custom'
    const hasCustomKey = !!(dataContext.aiConfig?.key && dataContext.aiConfig?.model)
    const hasAIGate = true // AIGate 始终可用

    if (!(useCustomAI ? hasCustomKey : hasAIGate)) {
      toast({
        title: '未配置 AI',
        description: '请先在设置页面配置 AI 或切换到免费额度',
        variant: 'destructive',
      })
      // 延迟跳转，让用户看到提示
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

    setIsLoading(true)
    setIsFinished(false)
    setMoveResults([])
    setIsProcessing(true)
    setProgress({ current: 0, total: 0, currentTitle: '' })
    isFinishedRef.current = false

    abortControllerRef.current = new AbortController()

    try {
      const defaultFav = dataContext.favoriteData?.find(
        (f) => f.id === dataContext.defaultFavoriteId,
      )
      const videos = await fetchAllFavoriteMedias(dataContext.defaultFavoriteId.toString(), {
        mediaCount: defaultFav?.media_count,
      })

      if (videos?.length === 0) {
        toast({
          title: '暂无数据',
          description: '默认收藏夹中没有视频需要整理',
        })
        setIsLoading(false)
        setIsProcessing(false)
        return
      }

      setProgress({ current: 0, total: videos.length, currentTitle: '' })

      const allResults: AIMoveResult[] = []
      const fallbackItems: string[] = []
      let processedCount = 0

      const favoriteTitles = dataContext.favoriteData.map((fav) => fav.title)
      const favoriteTagsMap: Record<string, string[]> = {}
      dataContext.favoriteData.forEach((fav) => {
        const keywordItem = dataContext.keyword.find((k) => k.favoriteDataId === fav.id)
        if (keywordItem?.value?.length) {
          favoriteTagsMap[fav.title] = keywordItem.value.map((v) => v.value)
        }
      })
      const config = {
        apiKey: dataContext.aiConfig.key!,
        baseURL: dataContext.aiConfig.baseUrl!,
        model: dataContext.aiConfig.model!,
        extraParams: dataContext.aiConfig.extraParams || {},
      }
      const totalCount = videos.length

      await batchProcess(videos, {
        maxSize: 1000,
        async processCallback(batchVideos) {
          const stream = await fetchAIMove(
            batchVideos,
            favoriteTitles,
            config,
            useCustomAI,
            favoriteTagsMap,
          )
          streamRef.current = stream
          const reader = stream.toReadableStream().getReader()
          const adapter = createStreamAdapter(dataContext.aiConfig.adapter)

          let buffer = ''

          while (true) {
            if (abortControllerRef.current?.signal.aborted) {
              reader.cancel()
              streamRef.current?.cancel()
              throw new AIError('用户取消操作')
            }

            const { value, done } = await reader.read()
            if (done) break

            buffer += adapter.parse(value)
            const { objects, remaining } = extractCompleteObjects(buffer)
            buffer = remaining

            for (const aiObj of objects) {
              processedCount++
              const result = resolveAIResult(aiObj, batchVideos)
              if (!result) continue

              setProgress({
                current: processedCount,
                total: totalCount,
                currentTitle: result.videoTitle,
              })

              if (result.isFallback) {
                fallbackItems.push(`${result.videoTitle} → AI建议的收藏夹不在列表中`)
              }

              const needsMove = result.targetFavoriteId !== dataContext.defaultFavoriteId
              if (needsMove) {
                const movedResult = await moveOneVideo(result)
                allResults.push(movedResult)
                moveVideosCache(
                  dataContext.defaultFavoriteId!.toString(),
                  movedResult.targetFavoriteId.toString(),
                  [movedResult.videoId],
                )
              } else {
                allResults.push({ ...result, status: 'skipped' })
              }
              setMoveResults([...allResults])
              await sleep(100)
            }
          }
          streamRef.current = null

          if (buffer.trim()) {
            try {
              const lastObjects = parseAIJSON<any[]>(`[${buffer}]`)
              for (const aiObj of lastObjects) {
                const result = resolveAIResult(aiObj, batchVideos)
                if (!result) continue
                processedCount++
                const needsMove = result.targetFavoriteId !== dataContext.defaultFavoriteId
                if (needsMove) {
                  const movedResult = await moveOneVideo(result)
                  allResults.push(movedResult)
                } else {
                  allResults.push({ ...result, status: 'skipped' })
                }
              }
              setMoveResults([...allResults])
            } catch {
              console.warn('[AI Move] 残留 buffer 解析失败:', buffer)
            }
          }
        },
      })

      const successCount = allResults.filter((r) => r.status === 'success').length
      const failCount = allResults.filter((r) => r.status === 'failed').length
      const skippedCount = allResults.filter((r) => r.status === 'skipped').length
      const fallbackCount = allResults.filter((r) => r.isFallback).length

      toast({
        title: '整理完成',
        description: `成功: ${successCount}, 跳过: ${skippedCount}, 失败: ${failCount}${fallbackCount > 0 ? `, 兜底: ${fallbackCount}` : ''}`,
        detail:
          fallbackItems.length > 0
            ? `以下视频因AI返回的收藏夹不在列表中，已归到默认收藏夹：\n${fallbackItems.join('\n')}`
            : undefined,
      })

      await sleep(1000)
      isFinishedRef.current = true
      setIsFinished(true)
    } catch (error) {
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
      if (!isFinishedRef.current) {
        setIsLoading(false)
      }
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  })

  // 取消操作
  const cancelMove = useMemoizedFn(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // 取消 background 中的 AI 请求
    if (streamRef.current) {
      streamRef.current.cancel()
      streamRef.current = null
    }
    setIsProcessing(false)
    setIsLoading(false)
    toast({
      title: '已取消',
      description: '操作已取消',
    })
  })

  const isLoadingElement = (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isLoading ? '' : 'hidden'}`}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {!isFinished ? (
          <div className="flex flex-col items-center">
            <img alt="loading-gif" src={loadingGif} className="w-24 h-24 mb-4" />
            {isProcessing && (
              <>
                {progress.total === 0 ? (
                  <p className="text-lg font-semibold mb-2">正在获取收藏夹视频...</p>
                ) : (
                  <>
                    <p className="text-lg font-semibold mb-2">
                      正在处理 ({progress.current}/{progress.total})
                    </p>
                    {progress.currentTitle && (
                      <p
                        className="text-sm text-gray-500 mb-1 max-w-xs truncate"
                        title={progress.currentTitle}
                      >
                        {progress.currentTitle}
                      </p>
                    )}
                    {progress.total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-1">
                        <div
                          className="bg-b-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    )}
                    {moveResults.length > 0 && (
                      <div className="w-full mt-2">
                        <p className="text-xs text-gray-400 mb-1">已完成 {moveResults.length} 个</p>
                        <div className="max-h-32 w-full overflow-y-auto overscroll-contain rounded-md border border-gray-100 scrollbar-thin">
                          <div className="w-full text-xs space-y-0.5 p-1">
                            {moveResults.map((r, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1 text-gray-500 py-0.5 px-1 rounded hover:bg-gray-50 transition-colors duration-100"
                              >
                                <span
                                  className={
                                    r.status === 'failed'
                                      ? 'text-red-500'
                                      : r.status === 'skipped'
                                        ? 'text-gray-400'
                                        : 'text-green-600'
                                  }
                                >
                                  {r.status === 'failed' ? '✗' : r.status === 'skipped' ? '-' : '✓'}
                                </span>
                                <span className="truncate flex-1" title={r.videoTitle}>
                                  {r.videoTitle}
                                </span>
                                <span className="text-gray-400 shrink-0">
                                  {r.status === 'skipped'
                                    ? '未移动'
                                    : r.status === 'failed'
                                      ? r.reason
                                      : `${favoriteMap.get(dataContext.defaultFavoriteId!) || '默认'} → ${favoriteMap.get(r.targetFavoriteId) || '未知'}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <Button onClick={cancelMove} variant="outline" className="mt-4">
              取消
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Finished start={isFinished} height={150} width={150} title="AI 整理完成！" />
            <div className="mt-4 w-full">
              <p className="text-sm font-semibold mb-2">移动结果：</p>
              <div className="max-h-40 overflow-y-auto overscroll-contain rounded-md border border-gray-100 text-xs scrollbar-thin">
                <div className="space-y-0.5 p-1">
                  {moveResults.map((result: AIMoveResult, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-gray-50 transition-colors duration-100"
                    >
                      <span
                        className={
                          result.status === 'failed'
                            ? 'text-red-500'
                            : result.status === 'skipped'
                              ? 'text-gray-400'
                              : 'text-green-600'
                        }
                      >
                        {result.status === 'failed' ? '✗' : result.status === 'skipped' ? '-' : '✓'}
                      </span>
                      <span className="font-medium truncate">{result.videoTitle}</span>
                      <span className="text-gray-500 ml-auto shrink-0">
                        {result.status === 'skipped'
                          ? '未移动'
                          : result.status === 'failed'
                            ? result.reason
                            : `→ ${favoriteMap.get(result.targetFavoriteId) || '未知'}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setIsFinished(false)
                setIsLoading(false)
              }}
              variant="outline"
              className="mt-4"
            >
              关闭
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return {
    isLoadingElement,
    handleAIMove,
  }
}

export { useAIMove }
