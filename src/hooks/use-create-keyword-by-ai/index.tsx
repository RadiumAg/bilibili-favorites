import React from 'react'
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
    setIsLoading(true)
    let aiConfig = dataProvideData.aiConfig || {}

    const fetchSingle = async (favKey: string) => {
      const allDefaultFavoriteVideo = await getFavoriteList(favKey, 1, 36)
      const titleArray = allDefaultFavoriteVideo.data.medias?.map((item) => item.title)

      if (titleArray == null) return

      const gptResult = await fetchChatGpt(titleArray, {
        baseURL: dataProvideData.aiConfig.baseUrl,
        apiKey: dataProvideData.aiConfig.key!,
        model: dataProvideData.aiConfig.model!,
        extraParams: dataProvideData.aiConfig.extraParams,
      })
      // 确保返回的是 Stream 类型
      const render = (gptResult as any).toReadableStream().getReader()
      let result = ''

      while (true) {
        let resultCopy = ''
        const decoder = new TextDecoder('utf-8')
        const { value, done } = await render.read()

        if (done) {
          break
        }
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

        if (data.includes('[')) continue
        if (data.includes(']')) continue
        if (data === '') continue

        if (!data.includes(',')) {
          result += data
          continue
        }

        resultCopy = result
        result = ''

        if (resultCopy === '') continue

        resultCopy = resultCopy.replace(/^"|"$/, '').trim()
        let targetKeyword = dataProvideData.keyword.find((item) => item.favoriteDataId === +favKey)

        if (targetKeyword == null) {
          targetKeyword = {
            favoriteDataId: +favKey,
            value: [{ id: uuid(), value: resultCopy }],
          }

          dataProvideData.setGlobalData({ keyword: [...dataProvideData.keyword, targetKeyword] })
        } else {
          // 检查关键词是否已存在，避免重复
          const exists = targetKeyword.value.some((k) => k.value === resultCopy)
          if (!exists) {
            targetKeyword.value.push({ id: uuid(), value: resultCopy })
          }
        }
        dataProvideData.setGlobalData({ keyword: [...dataProvideData.keyword] })
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
              await fetchSingle(fav.id.toString())
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
        className="left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]  absolute mt-[-51px]"
        src={loadingImg}
      ></img>
    </div>
  )

  return { loadingElement, handleCreate }
}

export { useCreateKeywordByAi }
