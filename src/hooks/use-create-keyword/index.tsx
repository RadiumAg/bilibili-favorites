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
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'

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
  const { toast } = useToast()

  /**
   * 使用本地算法提取关键词
   */
  const extractWithLocal = useMemoizedFn(async (favKey: string) => {
    const allDefaultFavoriteVideo = await queryAndSendMessage<GetFavoriteListRes>({
      type: MessageEnum.getFavoriteList,
      data: {
        mediaId: favKey,
        pn: 1,
        ps: 36,
      },
    })
    const titleArray = allDefaultFavoriteVideo.data?.medias?.map((item) => item.title)

    if (titleArray == null || titleArray.length === 0) {
      throw new Error('没有找到视频标题')
    }

    // 使用本地 TF-IDF 算法提取关键词
    const keywords = quickExtractKeywords(titleArray, 10)

    if (keywords.length === 0) {
      throw new Error('未能提取到关键词')
    }

    // 保存关键词到全局状态
    const currentData = dataProvideData.getGlobalData()
    const existingKeywordIndex = currentData.keyword.findIndex(
      (item) => item.favoriteDataId === Number(favKey),
    )

    const newKeywordValues = keywords.map((keyword, index) => ({
      id: `${favKey}-${index}-${Date.now()}`,
      value: keyword,
    }))

    if (existingKeywordIndex !== -1) {
      // 更新现有关键词
      currentData.keyword[existingKeywordIndex].value = newKeywordValues
    } else {
      // 添加新关键词
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

    // 验证 AI 配置
    const requiredFields: Array<keyof typeof aiConfig> = ['key', 'model']
    for (const field of requiredFields) {
      if (!aiConfig[field]) {
        throw new Error(`AI 配置不完整，缺少 ${field}`)
      }
    }

    const allDefaultFavoriteVideo = await queryAndSendMessage<GetFavoriteListRes>({
      type: MessageEnum.getFavoriteList,
      data: {
        mediaId: favKey,
        pn: 1,
        ps: 36,
      },
    })
    const titleArray = allDefaultFavoriteVideo.data?.medias?.map((item) => item.title)

    if (titleArray == null || titleArray.length === 0) {
      throw new Error('没有找到视频标题')
    }

    const gptResult = await fetchChatGpt(titleArray, {
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.key!,
      model: aiConfig.model!,
      extraParams: aiConfig?.extraParams,
    })

    // 确保返回的是 Stream 类型
    const render = (gptResult as any).toReadableStream().getReader()

    // 根据配置创建适配器
    const adapter = createStreamAdapter(aiConfig.adapter || 'spark')

    // 创建 AI Stream 解析器
    const parser = createAIStreamParser({
      favKey,
      getGlobalData: () => dataProvideData.getGlobalData(),
      setGlobalData: (data) => dataProvideData.setGlobalData(data),
      onKeywordExtracted: (keyword) => {
        console.log('[DEBUG] AI extracted keyword:', keyword)
      },
      adapter,
    })

    while (true) {
      const { value, done } = await render.read()

      if (done) {
        parser.flush()
        break
      }

      parser.processChunk(value)
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
        if (error instanceof Error) {
          debugger
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: error.message,
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
  )

  return {
    isLoading,
    currentMode,
    setCurrentMode,
    handleCreate,
    extractWithLocal,
    extractWithAI,
  }
}

export { useCreateKeyword }
