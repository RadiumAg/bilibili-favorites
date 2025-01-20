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
    let aiConfig = dataProvideData.aiConfig || {}
    for (const [key, value] of Object.entries(aiConfig)) {
      if (!value) {
        toast({
          variant: 'destructive',
          title: `哪里不对哦`,
          description: `缺少${key},请到配置页配置`,
        })
        return
      }
    }

    setIsLoading(true)

    switch (type) {
      case 'select': {
        if (dataProvideData.activeKey == null) break
        if (dataProvideData.aiConfig.baseUrl == null) return
        if (dataProvideData.aiConfig.key == null) return

        const allDefaultFavoriteVideo = await getFavoriteList(
          dataProvideData.activeKey?.toString(),
          1,
          36,
        )
        const titleArray = allDefaultFavoriteVideo.data.medias?.map((item) => item.title)

        if (titleArray == null) break

        const result = await fetchChatGpt(
          titleArray,
          dataProvideData.aiConfig.baseUrl,
          dataProvideData.aiConfig.key,
          dataProvideData.aiConfig.model,
        )
        const render = result.toReadableStream().getReader()

        try {
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
              let targetKeyword = oldValue.keyword.find(
                (item) => item.favoriteDataId === dataProvideData.activeKey,
              )
              if (targetKeyword == null) {
                targetKeyword = {
                  favoriteDataId: dataProvideData.activeKey!,
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
        } catch (error) {
          console.error(error)
        }

        break
      }

      default:
        break
    }

    setIsLoading(false)
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
