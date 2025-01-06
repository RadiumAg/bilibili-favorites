import React from 'react'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import { MessageEnum } from '@/utils/message'
import { useDataContext } from '../use-data-context'

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

            console.log(decoder.decode(value))
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
