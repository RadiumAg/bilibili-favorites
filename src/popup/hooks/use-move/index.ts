import React from 'react'
import { DataContext } from '@/popup/utils/data-context'
import { getFavoriteList, moveFavorite } from '@/popup/utils/api'
import { sleep } from '@/popup/utils/promise'

const useMove = () => {
  const dataContext = React.use(DataContext)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleMove = async () => {
    setIsLoading(true)
    await startMove()
    setIsLoading(false)
  }

  const fetchMove = async (targetFavoriteId: number, videoId: number) => {
    if (dataContext.defaultFavoriteId == null) return

    try {
      await moveFavorite(
        dataContext.defaultFavoriteId,
        targetFavoriteId,
        videoId,
        dataContext.cookie,
      )
    } catch (e) {
      if (e instanceof Error) {
        console.error('move video error', e.message)
      }
    }
  }

  const startMove = async () => {
    let pageIndex = 0

    const run = async () => {
      if (pageIndex >= 10) return
      if (dataContext.defaultFavoriteId == null) return

      const {
        data: { medias: allDefaultFavoriteVideo },
      } = await getFavoriteList(dataContext.defaultFavoriteId?.toString(), pageIndex, 20)

      if (allDefaultFavoriteVideo == null) return

      for (const keywordInfo of dataContext.keyword) {
        for (const keyValue of keywordInfo.value) {
          for (const videoInfo of allDefaultFavoriteVideo) {
            await sleep(50)
            console.log('videoInfo', videoInfo)
            console.log('keyValue', keyValue)

            let regex: string | RegExp | null = null

            try {
              regex = new RegExp(keyValue.value)
            } catch {
              regex = keyValue.value
            }

            if (regex instanceof RegExp && regex.test(videoInfo.title)) {
              const targetFavoriteTag = dataContext.favoriteData.find(
                (fav) => fav.id === keywordInfo.favoriteDataId,
              )
              if (targetFavoriteTag == null) continue

              await fetchMove(targetFavoriteTag.id, videoInfo.id)
              continue
            } else if (videoInfo.title.includes(keyValue.value)) {
              const targetFavoriteTag = dataContext.favoriteData.find(
                (fav) => fav.id === keywordInfo.favoriteDataId,
              )

              if (targetFavoriteTag == null) continue

              await fetchMove(targetFavoriteTag.id, videoInfo.id)
              continue
            }
          }
        }
      }

      pageIndex += 1
      run()
    }

    run()
  }

  return {
    handleMove,
    isLoading,
  }
}

export { useMove }