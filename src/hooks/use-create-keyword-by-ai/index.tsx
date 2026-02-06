import React, { useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import loadingImg from '@/assets/loading.gif'
import { useToast } from '../use-toast'
import { useGlobalConfig } from '@/store/global-data'

const useCreateKeywordByAi = () => {
  const dataProvideData = useGlobalConfig((state) => state)
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
      let buffer = ''

      while (true) {
        const lastDataProvideData = dataProvideData.getGlobalData()
        const decoder = new TextDecoder('utf-8')
        const { value, done } = await render.read()

        if (done) break

        // 安全解析 JSON，容错处理
        let data = ''
        try {
          const decoded = decoder.decode(value)
          const parsed = JSON.parse(decoded)

          data =
            parsed.choices?.[0]?.delta?.content ||
            parsed.choices?.[0]?.delta?.reasoning_content ||
            ''
        } catch {
          continue
        }

        console.log('[DEBUG] data', data)

        // 跳过数组标记
        if (data === '[' || data === ']') continue
        if (data === '') continue

        // 累积到缓冲区
        buffer += data

        // 尝试提取完整的关键词（被引号包围的字符串）
        // 匹配模式："keyword" 后面跟着逗号或数组结束
        const keywordMatch = buffer.match(/"([^"]*)"(?=\s*,|\s*\]|$)/)

        if (keywordMatch) {
          const keyword = keywordMatch[1].trim()

          console.log('[DEBUG] extracted keyword', keyword, lastDataProvideData)

          if (keyword) {
            let targetKeyword = lastDataProvideData.keyword.find(
              (item) => item.favoriteDataId === +favKey,
            )
            console.log('[DEBUG] targetKeyword', targetKeyword, lastDataProvideData)

            if (targetKeyword == null) {
              targetKeyword = {
                favoriteDataId: +favKey,
                value: [{ id: uuid(), value: keyword }],
              }
              lastDataProvideData.setGlobalData({
                keyword: [...lastDataProvideData.keyword, targetKeyword],
              })
            } else {
              // 检查关键词是否已存在，避免重复
              const exists = targetKeyword.value.some((k) => k.value === keyword)
              if (!exists) {
                targetKeyword.value.push({ id: uuid(), value: keyword })
                lastDataProvideData.setGlobalData({
                  keyword: [...lastDataProvideData.keyword],
                })
              }
            }
          }

          // 从缓冲区中移除已处理的部分
          buffer = buffer.slice(keywordMatch[0].length + keywordMatch.index!)
          // 清理开头的逗号和空格
          buffer = buffer.replace(/^[\s,]+/, '')
        }
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
