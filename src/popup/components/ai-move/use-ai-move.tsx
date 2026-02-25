import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { fetchAllFavoriteMedias, queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { createStreamAdapter } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'
import { useGlobalConfig } from '@/store/global-data'
import { fetchAIMove } from '@/utils/api'
import { sleep } from '@/utils/promise'
import { useToast } from '@/hooks/use-toast'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { Button } from '@/components/ui/button'

type AIMoveResult = {
  title: string
  targetFavoriteId: number
  videoId: number
  videoTitle: string
  reason: string
}

const useAIMove = () => {
  const { toast } = useToast()
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
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const streamRef = React.useRef<{ cancel: () => void } | null>(null)

  const favoriteMap = React.useMemo(() => {
    const map = new Map<number, string>()
    dataContext.favoriteData.forEach((fav) => {
      map.set(fav.id, fav.title)
    })
    return map
  }, [dataContext.favoriteData])

  const hasAIConfig = React.useMemo(() => {
    return dataContext.aiConfig && dataContext.aiConfig.key
  }, [dataContext.aiConfig])

  const analyzeVideosWithAI = useMemoizedFn(
    async (videos: { id: number; title: string }[]): Promise<AIMoveResult[]> => {
      if (!hasAIConfig) {
        throw new Error('请先在设置中配置 AI（OpenAI API Key）')
      }

      const favoriteTitles = dataContext.favoriteData.map((fav) => fav.title)

      try {
        const config = {
          apiKey: dataContext.aiConfig.key!,
          baseURL: dataContext.aiConfig.baseUrl!,
          model: dataContext.aiConfig.model!,
          extraParams: dataContext.aiConfig.extraParams || {},
        }

        const stream = await fetchAIMove(videos, favoriteTitles, config)
        streamRef.current = stream

        // 使用流适配器从每个 chunk 中提取纯内容文本
        let fullContent = ''
        const reader = stream.toReadableStream().getReader()
        const adapter = createStreamAdapter(dataContext.aiConfig.adapter)

        while (true) {
          // 检查是否已取消
          if (abortControllerRef.current?.signal.aborted) {
            reader.cancel()
            streamRef.current?.cancel()
            throw new Error('用户取消操作')
          }

          const { value, done } = await reader.read()
          if (done) break
          const content = adapter.parse(value)
          fullContent += content
        }
        streamRef.current = null
        console.log('[DEBUG] fullContent', fullContent)
        const jsonMatch = fullContent.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error('AI 返回的数据格式错误')
        }

        const aiResults = JSON.parse(jsonMatch[0])

        const results: AIMoveResult[] = videos
          .map((video) => {
            const aiResult = aiResults.find((r: any) => r.title === video.title)
            if (!aiResult) return null

            const targetFavorite = dataContext.favoriteData.find(
              (fav) => fav.title === aiResult.targetFavorite,
            )

            return {
              title: aiResult.title,
              targetFavoriteId: targetFavorite?.id || dataContext.defaultFavoriteId!,
              videoId: video.id,
              videoTitle: video.title,
              reason: aiResult.reason,
            }
          })
          .filter((r): r is AIMoveResult => r !== null)

        return results
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`AI 分析失败: ${error.message}`)
        }
        throw new Error('AI 分析失败')
      }
    },
  )

  const executeMove = useMemoizedFn(async (results: AIMoveResult[]) => {
    if (dataContext.defaultFavoriteId == null) return

    const resultsWithMove: AIMoveResult[] = []

    for (const result of results) {
      try {
        await queryAndSendMessage({
          type: MessageEnum.moveVideo,
          data: {
            srcMediaId: dataContext.defaultFavoriteId,
            tarMediaId: result.targetFavoriteId,
            videoId: result.videoId,
          },
        })

        resultsWithMove.push({
          ...result,
          title: result.videoTitle,
          targetFavoriteId: result.targetFavoriteId,
          videoId: result.videoId,
          videoTitle: result.videoTitle,
          reason: result.reason,
        })

        await sleep(100) // 避免请求过快
      } catch (error) {
        console.error('Move failed:', error)
        resultsWithMove.push({
          ...result,
          title: `❌ ${result.videoTitle}`,
          targetFavoriteId: result.targetFavoriteId,
          videoId: result.videoId,
          videoTitle: result.videoTitle,
          reason: '移动失败',
        })
      }
    }

    return resultsWithMove
  })

  // 开始 AI 整理
  const handleAIMove = useMemoizedFn(async () => {
    // 检查配置
    if (!hasAIConfig) {
      toast({
        title: '未配置 AI',
        description: '请先在设置页面配置 OpenAI API Key',
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

    abortControllerRef.current = new AbortController()

    try {
      // 获取默认收藏夹的所有视频（自动分页）
      const videos = await fetchAllFavoriteMedias(dataContext.defaultFavoriteId.toString())

      if (videos?.length === 0) {
        toast({
          title: '暂无数据',
          description: '默认收藏夹中没有视频需要整理',
        })
        setIsLoading(false)
        setIsProcessing(false)
        return
      }

      toast({
        title: 'AI 分析中',
        description: `正在分析 ${videos.length} 个视频...`,
      })

      const results = await analyzeVideosWithAI(videos)

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('用户取消操作')
      }

      toast({
        title: '开始移动',
        description: `正在移动 ${results.length} 个视频...`,
      })

      const movedResults = await executeMove(results)
      if (!movedResults) return

      setMoveResults(movedResults)

      // 统计成功/失败
      const successCount = movedResults.filter((r) => !r.title.startsWith('❌')).length
      const failCount = movedResults.length - successCount

      toast({
        title: '整理完成',
        description: `成功: ${successCount}, 失败: ${failCount}`,
      })

      await sleep(1000)
      setIsFinished(true)
    } catch (error) {
      if (error instanceof Error) {
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
              {isProcessing && moveResults.length === 0 && (
                <>
                  <p className="text-lg font-semibold mb-2">AI 分析中...</p>
                  <p className="text-sm text-gray-500">请稍候，正在智能分类视频</p>
                </>
              )}
              {moveResults.length > 0 && (
                <>
                  <p className="text-lg font-semibold mb-2">移动中...</p>
                  <p className="text-sm text-gray-500">
                    已处理 {moveResults.length}/{moveResults.length} 个视频
                  </p>
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
