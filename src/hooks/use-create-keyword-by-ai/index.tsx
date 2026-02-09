import React from 'react'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import loadingImg from '@/assets/loading.gif'
import { useToast } from '../use-toast'
import { useGlobalConfig } from '@/store/global-data'
import { createAIStreamParser, createStreamAdapter } from './ai-stream-parser'
import { useShallow } from 'zustand/react/shallow'

const useCreateKeywordByAi = () => {
  const dataProvideData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      activeKey: state.activeKey,
      favoriteData: state.favoriteData,
      setGlobalData: state.setGlobalData,
      getGlobalData: state.getGlobalData,
    })),
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleCreate = async (type: 'select' | 'all') => {
    let aiConfig = dataProvideData.aiConfig || {}

    setIsLoading(true)

    /**
     *
     * 请求设置单个收藏夹
     *
     * @param {string} favKey
     */
    const fetchSingle = async (favKey: string) => {
      const allDefaultFavoriteVideo = await getFavoriteList(favKey, 1, 36)
      const titleArray = allDefaultFavoriteVideo.data?.medias?.map((item) => item.title)

      console.log('[DEBUG] lastDataProvideData', aiConfig)

      if (titleArray == null) return

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
          console.log('[DEBUG] extracted keyword', keyword)
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
    }

    // 验证必填配置
    const requiredFields: Array<keyof typeof aiConfig> = ['key', 'model']
    for (const field of requiredFields) {
      if (!aiConfig[field]) {
        toast({
          variant: 'destructive',
          title: `配置不完整`,
          description: `缺少${field}，请到配置页配置`,
        })
        setIsLoading(false)
        return
      }
    }

    try {
      switch (type) {
        case 'select': {
          if (dataProvideData.activeKey == null) {
            toast({
              variant: 'destructive',
              title: `哪里不对哦`,
              description: `这个模式必须需要选中一个滴`,
            })
            return
          }

          await fetchSingle(dataProvideData.activeKey?.toString())
          break
        }

        case 'all': {
          if (dataProvideData.favoriteData == null || dataProvideData.favoriteData.length === 0) {
            toast({
              variant: 'destructive',
              title: `配置不完整`,
              description: `还没有任何收藏夹`,
            })
            setIsLoading(false)
            return
          }

          // 批量处理时记录成功和失败
          let successCount = 0
          let failCount = 0

          for (const fav of dataProvideData.favoriteData) {
            try {
              const activeKey = fav.id
              dataProvideData.setGlobalData({ activeKey })
              await fetchSingle(activeKey.toString())
              successCount++
            } catch {
              failCount++
            }
          }

          if (failCount > 0) {
            toast({
              variant: 'destructive',
              title: `部分完成`,
              description: `成功 ${successCount} 个，失败 ${failCount} 个`,
            })
          }
          break
        }
        default:
          break
      }
    } catch (error) {
      if (error instanceof Error)
        toast({
          variant: 'destructive',
          title: `哪里不对哦`,
          description: error.message,
        })
    } finally {
      setIsLoading(false)
    }
  }

  const loadingElement = isLoading && (
    <div className="absolute w-full h-full top-0 left-0 bg-white bg-opacity-55 z-[999]">
      <img
        alt="loading-img"
        className="left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]  absolute mt-[-51px]"
        src={loadingImg}
      ></img>
    </div>
  )

  return { loadingElement, handleCreate }
}

export { useCreateKeywordByAi }
