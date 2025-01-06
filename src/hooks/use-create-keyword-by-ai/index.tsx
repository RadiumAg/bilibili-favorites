import React from 'react'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import { useDataContext } from '../use-data-context'
import { log } from '@/utils/log'

const useCreateKeywordByAi = () => {
  const dataProvideData = useDataContext()

  const handleCreate = async (type: 'select' | 'all') => {
    switch (type) {
      case 'select': {
        if (dataProvideData.activeKey == null) return

        const allDefaultFavoriteVideo = await getFavoriteList(
          dataProvideData.activeKey?.toString(),
          1,
          36,
        )
        const titleArray = allDefaultFavoriteVideo.data.medias?.map((item) => item.title)

        if (titleArray == null) return

        const result = await fetchChatGpt(titleArray)
        const render = result.toReadableStream().getReader()

        try {
          while (true) {
            const decoder = new TextDecoder('utf-8')
            const { value, done } = await render.read()
            if (done) break
            const data = JSON.parse(decoder.decode(value)).choices[0]?.delta?.content || ''

            if (data === '[' || data === ']') continue

            dataProvideData.dispatch?.((oldValue) => {
              let targetKeyword = dataProvideData.keyword.find(
                (item) => item.favoriteDataId === dataProvideData.activeKey,
              )
              if (targetKeyword == null) {
                targetKeyword = {
                  favoriteDataId: dataProvideData.activeKey!,
                  value: [],
                }

                return {
                  ...oldValue,
                  keyword: [targetKeyword],
                }
              }

              targetKeyword.value = [...targetKeyword?.value, data]

              return {
                ...oldValue,
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
  }

  return { handleCreate }
}

export { useCreateKeywordByAi }
