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
import { parseAIJSON } from '@/utils/parse-ai-json'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { Button } from '@/components/ui/button'

type AIMoveResult = {
  title: string
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

  const favoriteMap = React.useMemo(() => {
    const map = new Map<number, string>()
    dataContext.favoriteData.forEach((fav) => {
      map.set(fav.id, fav.title)
    })
    return map
  }, [dataContext.favoriteData])

  const analyzeOneVideo = useMemoizedFn(
    async (video: { id: number; title: string }): Promise<AIMoveResult | null> => {
      const favoriteTitles = dataContext.favoriteData.map((fav) => fav.title)
      const useCustomAI = dataContext.aiConfig?.configMode === 'custom'

      const config = {
        apiKey: dataContext.aiConfig.key!,
        baseURL: dataContext.aiConfig.baseUrl!,
        model: dataContext.aiConfig.model!,
        extraParams: dataContext.aiConfig.extraParams || {},
      }
      const stream = await fetchAIMove([video], favoriteTitles, config, useCustomAI)
      streamRef.current = stream

      let fullContent = ''
      const reader = stream.toReadableStream().getReader()
      const adapter = createStreamAdapter(dataContext.aiConfig.adapter)

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          reader.cancel()
          streamRef.current?.cancel()
          throw new AIError('用户取消操作')
        }
        const { value, done } = await reader.read()
        if (done) break
        fullContent += adapter.parse(value)
      }
      streamRef.current = null
      console.log('[DEBUG] fullContent', fullContent)

      let aiResults: any[]
      try {
        aiResults = parseAIJSON(fullContent)
      } catch {
        throw new AIError('AI 返回的数据格式错误，请重试', `返回数据：${fullContent}`)
      }

      const aiResult = Array.isArray(aiResults) ? aiResults[0] : aiResults
      if (!aiResult) return null

      const targetFavorite = dataContext.favoriteData.find(
        (fav) => fav.title === aiResult.targetFavorite,
      )
      const isFallback = !targetFavorite

      return {
        title: aiResult.title,
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
      return { ...result, title: result.videoTitle }
    } catch (error) {
      console.error('Move failed:', error)
      return { ...result, title: `❌ ${result.videoTitle}`, reason: '移动失败' }
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

      for (let i = 0; i < videos.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new AIError('用户取消操作')
        }

        const video = videos[i]
        setProgress({ current: i + 1, total: videos.length, currentTitle: video.title })

        try {
          const result = await analyzeOneVideo(video)
          if (result) {
            if (result.isFallback) {
              fallbackItems.push(`${video.title} → AI建议的收藏夹不在列表中`)
            }
            const movedResult = await moveOneVideo(result)
            allResults.push(movedResult)
            setMoveResults([...allResults])

            moveVideosCache(
              dataContext.defaultFavoriteId!.toString(),
              movedResult.targetFavoriteId.toString(),
              [movedResult.videoId],
            )
          }
        } catch (error) {
          if (error instanceof AIError && error.message === '用户取消操作') throw error
          console.error(`[AI Move] 处理视频 "${video.title}" 失败:`, error)
          allResults.push({
            title: `❌ ${video.title}`,
            targetFavoriteId: dataContext.defaultFavoriteId!,
            videoId: video.id,
            videoTitle: video.title,
            reason: error instanceof Error ? error.message : '处理失败',
          })
          setMoveResults([...allResults])
        }

        await sleep(100)
      }

      const successCount = allResults.filter((r) => !r.title.startsWith('❌')).length
      const failCount = allResults.length - successCount
      const fallbackCount = allResults.filter((r) => r.isFallback).length

      toast({
        title: '整理完成',
        description: `成功: ${successCount}, 失败: ${failCount}${fallbackCount > 0 ? `, 兜底: ${fallbackCount}` : ''}`,
        detail:
          fallbackItems.length > 0
            ? `以下视频因AI返回的收藏夹不在列表中，已归到默认收藏夹：\n${fallbackItems.join('\n')}`
            : undefined,
      })

      await sleep(1000)
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
      setIsLoading(false)
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
          <>
            <div className="flex flex-col items-center">
              <img alt="loading-gif" src={loadingGif} className="w-24 h-24 mb-4" />
              {isProcessing && (
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
                      <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                        {moveResults.map((r, i) => {
                          const isFailed = r.title.startsWith('❌')
                          const isSame = r.targetFavoriteId === dataContext.defaultFavoriteId
                          return (
                            <div key={i} className="flex items-center gap-1 text-gray-500">
                              <span
                                className={
                                  isFailed
                                    ? 'text-red-500'
                                    : isSame
                                      ? 'text-gray-400'
                                      : 'text-green-600'
                                }
                              >
                                {isFailed ? '✗' : isSame ? '-' : '✓'}
                              </span>
                              <span className="truncate flex-1" title={r.videoTitle}>
                                {r.videoTitle}
                              </span>
                              <span className="text-gray-400 shrink-0">
                                {isSame
                                  ? '未移动'
                                  : `${favoriteMap.get(dataContext.defaultFavoriteId!) || '默认'} → ${favoriteMap.get(r.targetFavoriteId) || '未知'}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              <Button onClick={cancelMove} variant="outline" className="mt-4">
                取消
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Finished
              start={isFinished}
              height={150}
              width={150}
              title="AI 整理完成！"
              onFinished={() => {
                setIsFinished(false)
                setIsLoading(false)
              }}
            />
            <div className="mt-4 w-full">
              <p className="text-sm font-semibold mb-2">移动结果：</p>
              <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                {moveResults.map((result: AIMoveResult, idx: number) => (
                  <div key={idx} className="border-b py-1">
                    <span className="font-medium">{result.title}</span>
                    <span className="text-gray-500 ml-2">
                      → {favoriteMap.get(result.targetFavoriteId)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
