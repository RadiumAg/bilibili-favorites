import React from 'react'
import { v4 as uuid } from 'uuid'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import { DataContext } from '@/utils/data-context'
import loadingImg from '@/assets/loading.gif'
import { useToast } from '../use-toast'

const useCreateKeywordByAi = () => {
  const dataProvideData = React.use(DataContext)
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()
  const handleCreate = async (type: 'select' | 'all') => {
    setIsLoading(true)
    let aiConfig = dataProvideData.aiConfig || {}

    const fetchSingle = async (favKey: string) => {
      const allDefaultFavoriteVideo = await getFavoriteList(favKey, 1, 36)
      const titleArray = allDefaultFavoriteVideo.data.medias?.map((item) => item.title)

      if (titleArray == null) return

      const gptResult = await fetchChatGpt(
        titleArray,
        dataProvideData.aiConfig.baseUrl!,
        dataProvideData.aiConfig.key!,
        dataProvideData.aiConfig.model!,
      )
      const render = gptResult.toReadableStream().getReader()
      let result = ''

      while (true) {
        let resultCopy = ''
        const decoder = new TextDecoder('utf-8')
        const { value, done } = await render.read()

        if (done) break

        const data = JSON.parse(decoder.decode(value)).choices[0]?.delta?.content || ''

        if (data.includes('[')) continue
        if (data.includes(']')) continue
        if (data === '') continue

        if (!data.includes(',')) {
          result += data
          continue
        }

        resultCopy = result
        result = ''

        dataProvideData.dispatch?.((oldValue) => {
          if (resultCopy === '') {
            return { ...oldValue, keyword: [...oldValue.keyword] }
          }

          resultCopy = resultCopy.replace(/^"|"$/, '').trim()
          let targetKeyword = oldValue.keyword.find((item) => item.favoriteDataId === +favKey)
          if (targetKeyword == null) {
            targetKeyword = {
              favoriteDataId: +favKey,
              value: [{ id: uuid(), value: resultCopy }],
            }

            return {
              ...oldValue,
              keyword: [...oldValue.keyword, targetKeyword],
            }
          } else {
            targetKeyword.value.push({ id: uuid(), value: resultCopy })
          }

          resultCopy = ''
          return {
            ...oldValue,
            keyword: [...oldValue.keyword],
          }
        })
      }
    }

    for (const [key, value] of Object.entries(aiConfig)) {
      if (!value) {
        toast({
          variant: 'destructive',
          title: `哪里不对哦`,
          description: `缺少${key},请到配置页配置`,
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
          for (const fav of dataProvideData.favoriteData) {
            if (dataProvideData.favoriteData == null || dataProvideData.favoriteData.length === 0) {
              toast({
                variant: 'destructive',
                title: `哪里不对哦`,
                description: `sorry bor, 你还没有任何收藏夹`,
              })
              return
            }

            await fetchSingle(fav.id.toString())
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
