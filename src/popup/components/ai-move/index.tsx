import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useGlobalConfig } from '@/store/global-data'
import { fetchChatGpt, moveFavorite } from '@/utils/api'
import { sleep } from '@/utils/promise'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { useToast } from '@/hooks/use-toast'
import { getFavoriteDetail } from '@/utils/api'
import { useMemoizedFn } from 'ahooks'

interface AIMoveResult {
  title: string
  targetFavoriteId: number
  videoId: number
  videoTitle: string
  reason: string
}

const useAIMove = () => {
  const { toast } = useToast()
  const dataContext = useGlobalConfig((state) => ({
    keyword: state.keyword,
    favoriteData: state.favoriteData,
    defaultFavoriteId: state.defaultFavoriteId,
    aiConfig: state.aiConfig,
    cookie: state.cookie,
  }))
  const [isFinished, setIsFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [moveResults, setMoveResults] = useState<AIMoveResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 构建收藏夹映射
  const favoriteMap = React.useMemo(() => {
    const map = new Map<number, string>()
    dataContext.favoriteData.forEach((fav) => {
      map.set(fav.id, fav.title)
    })
    return map
  }, [dataContext.favoriteData])

  // 检查是否配置了 AI
  const hasAIConfig = React.useMemo(() => {
    return dataContext.aiConfig && dataContext.aiConfig.key
  }, [dataContext.aiConfig])

  // 构建 AI 系统提示词
  const buildAISystemPrompt = useMemoizedFn((favoriteTitles: string[]) => {
    return `你是一个视频分类助手。任务：根据视频标题，判断应该移动到哪个收藏夹。

可用的收藏夹列表：
${favoriteTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n')}

规则：
1. 仔细阅读视频标题，理解其主题内容
2. 根据标题内容，选择最合适的收藏夹
3. 如果没有合适的收藏夹，返回"默认收藏夹"
4. 只返回 JSON 数组格式，不要任何解释

返回格式（严格按照此格式）：
[
  {
    "title": "原始视频标题",
    "targetFavorite": "目标收藏夹名称",
    "reason": "选择理由（简短）"
  }
]

示例：
输入：["React Hooks详解","Python数据分析"]
收藏夹：["前端开发","后端开发","数据分析","默认收藏夹"]
输出：
[
  {"title": "React Hooks详解","targetFavorite":"前端开发","reason":"React是前端框架"},
  {"title": "Python数据分析","targetFavorite":"数据分析","reason":"主题是数据分析"}
]`
  })

  // 使用 AI 分析视频
  const analyzeVideosWithAI = useMemoizedFn(
    async (videos: { id: number; title: string }[]): Promise<AIMoveResult[]> => {
      if (!hasAIConfig) {
        throw new Error('请先在设置中配置 AI（OpenAI API Key）')
      }

      const favoriteTitles = dataContext.favoriteData.map((fav) => fav.title)
      const videoTitles = videos.map((v) => v.title)

      const systemPrompt = buildAISystemPrompt(favoriteTitles)

      try {
        // 我们需要自己构建 OpenAI 请求，因为 fetchChatGpt 是为关键词提取设计的
        // 这里直接使用 OpenAI SDK
        const openai = new (await import('openai')).default({
          apiKey: dataContext.aiConfig.key,
          baseURL: dataContext.aiConfig.baseUrl,
          dangerouslyAllowBrowser: true,
        })

        const requestParams: any = {
          model: dataContext.aiConfig.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system' as const,
              content: systemPrompt,
            },
            {
              role: 'user' as const,
              content: JSON.stringify(videoTitles),
            },
          ],
          stream: true,
          ...(dataContext.aiConfig.extraParams || {}),
        }

        const stream = await openai.chat.completions.create(requestParams)

        let fullContent = ''
        for await (const chunk of stream as any) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            fullContent += content
          }
        }

        // 提取 JSON 数组
        const jsonMatch = fullContent.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error('AI 返回的数据格式错误')
        }

        const aiResults = JSON.parse(jsonMatch[0])

        // 转换为移动结果
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

  // 执行移动
  const executeMove = useMemoizedFn(async (results: AIMoveResult[]) => {
    if (dataContext.defaultFavoriteId == null) return

    const resultsWithMove: AIMoveResult[] = []

    for (const result of results) {
      try {
        await moveFavorite(
          dataContext.defaultFavoriteId,
          result.targetFavoriteId,
          result.videoId,
          dataContext.cookie,
        )

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
        if (chrome.runtime?.openOptionsPage) {
          chrome.runtime.openOptionsPage()
        } else {
          window.open(chrome.runtime.getURL('options.html'), '_blank')
        }
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
      // 获取默认收藏夹的所有视频
      const favoriteDetail = await getFavoriteDetail(dataContext.defaultFavoriteId.toString())

      if (favoriteDetail.code !== 0) {
        throw new Error(favoriteDetail.message || '获取收藏夹数据失败')
      }

      const videos = favoriteDetail.data.medias

      if (!videos || videos.length === 0) {
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

      // AI 分析
      const results = await analyzeVideosWithAI(videos)

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('用户取消操作')
      }

      toast({
        title: '开始移动',
        description: `正在移动 ${results.length} 个视频...`,
      })

      // 执行移动
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

      // 显示完成动画
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
      setIsProcessing(false)
      setIsLoading(false)
      toast({
        title: '已取消',
        description: '操作已取消',
      })
    }
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
    handleAIMove,
    isLoadingElement,
  }
}

const AIMove: React.FC = () => {
  const { handleAIMove, isLoadingElement } = useAIMove()

  return (
    <div>
      <Button
        onClick={handleAIMove}
        size="sm"
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-1 h-6"
      >
        🤖 AI 整理
      </Button>
      {isLoadingElement}
    </div>
  )
}

export { AIMove, useAIMove }
export default AIMove
