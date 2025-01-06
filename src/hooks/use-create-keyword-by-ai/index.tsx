import React from 'react'
import { v4 as uuid } from 'uuid'
import { fetchChatGpt, getFavoriteList } from '@/utils/api'
import { DataContext } from '@/utils/data-context'

const useCreateKeywordByAi = () => {
  const dataProvideData = React.use(DataContext)

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
                console.log('oldValue', [...oldValue.keyword])
                return { ...oldValue, keyword: [...oldValue.keyword] }
              }

              resultCopy = resultCopy.replace(/^"|"$/, '')
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
  }

  return { handleCreate }
}

export { useCreateKeywordByAi }
