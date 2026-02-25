import React from 'react'
import { getFavoriteList } from '@/utils/api'
import { sleep } from '@/utils/promise'
import { MessageEnum } from '@/utils/message'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { cn } from '@/lib/utils'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { fetchAllFavoriteMedias, queryAndSendMessage } from '@/utils/tab'
import { Button } from '@/components/ui/button'

const useMove = () => {
  const dataContext = useGlobalConfig(
    useShallow((state) => ({
      keyword: state.keyword,
      favoriteData: state.favoriteData,
      defaultFavoriteId: state.defaultFavoriteId,
    })),
  )
  const [isFinished, setIsFinished] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCancelled, setIsCancelled] = React.useState(false)
  const cancelRef = React.useRef(false)

  const handleMove = async () => {
    cancelRef.current = false
    setIsCancelled(false)
    setIsLoading(true)
    setIsFinished(false)
    await startMove()
  }

  const handleCancel = () => {
    cancelRef.current = true
    setIsCancelled(true)
  }

  const fetchMove = async (targetFavoriteId: number, videoId: number) => {
    if (dataContext.defaultFavoriteId == null) return

    try {
      await queryAndSendMessage({
        type: MessageEnum.moveVideo,
        data: {
          srcMediaId: dataContext.defaultFavoriteId,
          tarMediaId: targetFavoriteId,
          videoId,
        },
      })
    } catch (e) {
      if (e instanceof Error) {
        console.error('move video error', e.message)
      }
      throw e
    }
  }

  const startMove = async () => {
    let pn = 1

    const run = async (): Promise<boolean> => {
      if (cancelRef.current) return false
      if (dataContext.defaultFavoriteId == null) return false

      const allDefaultFavoriteVideo = await fetchAllFavoriteMedias(
        dataContext.defaultFavoriteId?.toString(),
      )

      if (allDefaultFavoriteVideo == null) return false

      for (const keywordInfo of dataContext.keyword.filter(
        (key) => key.favoriteDataId !== dataContext.defaultFavoriteId,
      )) {
        if (cancelRef.current) return false

        for (const keyValue of keywordInfo.value) {
          if (cancelRef.current) return false

          const targetFavoriteTag = dataContext.favoriteData.find(
            (fav) => fav.id === keywordInfo.favoriteDataId,
          )
          if (targetFavoriteTag == null) continue

          const keyword = keyValue.value.toLowerCase()

          for (const videoInfo of allDefaultFavoriteVideo) {
            if (cancelRef.current) return false

            const videoTitle = videoInfo.title.toLowerCase()

            if (videoTitle.includes(keyword)) {
              await fetchMove(targetFavoriteTag.id, videoInfo.id)
            }
          }
        }
      }

      await sleep(20)
      pn++
      return run()
    }
    const start = Date.now()
    const completed = await run()

    if (cancelRef.current) {
      setIsLoading(false)
      return
    }

    if (completed && Date.now() - start < 1000) {
      await sleep(1000)
      setIsFinished(true)
    } else {
      setIsFinished(true)
    }
  }

  const isLoadingElement = (
    <div
      className={cn(
        'fixed flex flex-col w-full h-full bg-white top-0 left-0 bg-opacity-70 items-center justify-center',
        { hidden: !isLoading },
      )}
    >
      <Finished
        start={isFinished}
        height={150}
        width={150}
        title="ok喽~~~"
        onFinished={() => {
          setIsFinished(false)
          setIsLoading(false)
        }}
      />

      <img alt="loading-gif" src={loadingGif} className={cn({ ['hidden']: isFinished })} />

      {!isFinished && (
        <Button onClick={handleCancel} disabled={isCancelled}>
          {isCancelled ? '正在取消...' : '取消整理'}
        </Button>
      )}
    </div>
  )

  return {
    handleMove,
    isLoadingElement,
  }
}

export { useMove }
