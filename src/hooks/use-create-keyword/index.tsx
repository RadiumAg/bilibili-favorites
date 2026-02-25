import React from 'react'
import { GetFavoriteListRes } from '@/utils/api'
import { useToast } from '../use-toast'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { quickExtractKeywords } from '@/utils/keyword-extractor'
import { fetchChatGpt } from '@/utils/api'
import {
  createAIStreamParser,
  createStreamAdapter,
} from '../use-create-keyword-by-ai/ai-stream-parser'
import { useMemoizedFn } from 'ahooks'
import { fetchAllFavoriteMedias } from '@/utils/tab'

export type ExtractionMode = 'local' | 'ai' | 'manual'

type UseCreateKeywordProps = {
  mode?: ExtractionMode
}

const useCreateKeyword = (props: UseCreateKeywordProps = {}) => {
  const { mode: defaultMode = 'local' } = props

  const dataProvideData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      activeKey: state.activeKey,
      favoriteData: state.favoriteData,
      keyword: state.keyword,
      setGlobalData: state.setGlobalData,
      getGlobalData: state.getGlobalData,
    })),
  )

  const [isLoading, setIsLoading] = React.useState(false)
  const [currentMode, setCurrentMode] = React.useState<ExtractionMode>(defaultMode)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const { toast } = useToast()

  /**
   * 使用本地算法提取关键词
   */
  const extractWithLocal = useMemoizedFn(async (favKey: string) => {
    const allDefaultFavoriteVideo = await fetchAllFavoriteMedias(favKey)
    const titleArray = allDefaultFavoriteVideo?.map((item) => item.title)

    if (titleArray == null || titleArray.length === 0) {
      throw new Error('没有找到视频标题')
    }

    // 使用本地 TF-IDF 算法提取关键词
    const keywords = quickExtractKeywords(titleArray, 10)

    if (keywords.length === 0) {
      throw new Error('未能提取到关键词')
    }
    const currentData = dataProvideData.getGlobalData()
    const existingKeywordIndex = currentData.keyword.findIndex(
      (item) => item.favoriteDataId === Number(favKey),
    )
    const newKeywordValues = keywords.map((keyword, index) => ({
      id: `${favKey}-${index}-${Date.now()}`,
      value: keyword,
    }))
    if (existingKeywordIndex !== -1) {
      currentData.keyword[existingKeywordIndex].value = newKeywordValues
    } else {
      currentData.keyword.push({
        favoriteDataId: Number(favKey),
        value: newKeywordValues,
      })
    }

    dataProvideData.setGlobalData({ keyword: [...currentData.keyword] })

    return keywords
  })

  /**
   * 使用 AI 提取关键词
   */
  const extractWithAI = useMemoizedFn(async (favKey: string) => {
    const aiConfig = dataProvideData.aiConfig || {}

    const requiredFields: Array<keyof typeof aiConfig> = ['key', 'model']
    for (const field of requiredFields) {
      if (!aiConfig[field]) {
        throw new Error(`AI 配置不完整，缺少 ${field}`)
      }
    }

    const allDefaultFavoriteVideo = await fetchAllFavoriteMedias(favKey)
    const titleArray = allDefaultFavoriteVideo?.map((item) => item.title)

    if (titleArray == null || titleArray.length === 0) {
      throw new Error('没有找到视频标题')
    }

    const gptResult = await fetchChatGpt(titleArray, {
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.key!,
      model: aiConfig.model!,
      extraParams: aiConfig?.extraParams,
    })

    const reader = (gptResult as any).toReadableStream().getReader()
    const adapter = createStreamAdapter(aiConfig.adapter)
    const parser = createAIStreamParser({
      favKey,
      getGlobalData: () => dataProvideData.getGlobalData(),
      setGlobalData: (data) => dataProvideData.setGlobalData(data),
      onKeywordExtracted: (keyword) => {
        console.log('[DEBUG] AI extracted keyword:', keyword)
      },
      adapter,
    })

    try {
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          await reader.cancel()
          throw new DOMException('用户取消操作', 'AbortError')
        }

        const { value, done } = await reader.read()

        if (done) {
          parser.flush()
          break
        }

        parser.processChunk(value)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      throw error
    }
  })

  /**
   * 处理单个收藏夹
   */
  const processSingleFavorite = useMemoizedFn(async (favKey: string, mode: ExtractionMode) => {
    switch (mode) {
      case 'local':
        return await extractWithLocal(favKey)
      case 'ai':
        return await extractWithAI(favKey)
      case 'manual':
        // 手动模式不自动提取，由用户手动输入
        return []
      default:
        throw new Error(`不支持的提取模式: ${mode}`)
    }
  })

  /**
   * 创建关键词
   */
  const handleCreate = useMemoizedFn(
    async (type: 'select' | 'all', mode: ExtractionMode = currentMode) => {
      setIsLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        switch (type) {
          case 'select': {
            if (dataProvideData.activeKey == null) {
              toast({
                variant: 'destructive',
                title: '操作失败',
                description: '请先选择一个收藏夹',
              })
              return
            }

            const keywords = await processSingleFavorite(dataProvideData.activeKey.toString(), mode)

            if (mode === 'local' && keywords && keywords.length > 0) {
              toast({
                title: '提取成功',
                description: `已提取 ${keywords.length} 个关键词`,
              })
            }
            break
          }

          case 'all': {
            if (dataProvideData.favoriteData == null || dataProvideData.favoriteData.length === 0) {
              toast({
                variant: 'destructive',
                title: '操作失败',
                description: '还没有任何收藏夹',
              })
              return
            }

            // 批量处理时记录成功和失败
            let successCount = 0
            let failCount = 0

            for (const fav of dataProvideData.favoriteData) {
              if (abortControllerRef.current.signal?.aborted) return

              try {
                const activeKey = fav.id
                dataProvideData.setGlobalData({ activeKey })
                await processSingleFavorite(activeKey.toString(), mode)
                successCount++
              } catch (error) {
                console.error(`处理收藏夹 ${fav.id} 失败:`, error)
                failCount++
              }
            }

            if (failCount > 0) {
              toast({
                variant: 'destructive',
                title: '部分完成',
                description: `成功 ${successCount} 个，失败 ${failCount} 个`,
              })
            } else {
              toast({
                title: '全部完成',
                description: `成功处理 ${successCount} 个收藏夹`,
              })
            }
            break
          }
          default:
            break
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          toast({
            title: '已取消',
            description: '操作已取消',
          })
          return
        }
        if (error instanceof Error) {
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: error.message,
          })
        }
      } finally {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    },
  )

  const cancelCreate = useMemoizedFn(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  })

  return {
    isLoading,
    currentMode,
    extractWithLocal,
    extractWithAI,
    handleCreate,
    cancelCreate,
    setCurrentMode,
  }
}

export { useCreateKeyword }
