import React from 'react'

import { Button } from '@/components/ui/button'
import { DataContext } from '@/popup/utils/data-context'
import { getFavoriteList, moveFavorite } from '@/popup/utils/api'

const Move: React.FC = () => {
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
              if (targetFavoriteTag == null) return

              fetchMove(targetFavoriteTag.id, videoInfo.id)
            } else if (videoInfo.title.includes(keyValue.value)) {
              const targetFavoriteTag = dataContext.favoriteData.find(
                (fav) => fav.id === keywordInfo.favoriteDataId,
              )

              if (targetFavoriteTag == null) return
              fetchMove(targetFavoriteTag.id, videoInfo.id)
            }
          }
        }
      }

      pageIndex += 1

      await sleep(1000)
      run()
    }

    run()
  }

  return (
    <div className="mt-2">
      <Button
        onClick={handleMove}
        size="sm"
        className=" bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
      >
        move
      </Button>

      {isLoading && (
        <div className="fixed w-full h-full bg-b-primary top-0 left-0  bg-opacity-20"></div>
      )}
    </div>
  )
}

export default Move
