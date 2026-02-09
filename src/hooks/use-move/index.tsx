import React from 'react'
import { getFavoriteList } from '@/utils/api'
import { sleep } from '@/utils/promise'
import { MessageEnum } from '@/utils/message'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import classNames from 'classnames'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'

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

  const handleMove = async () => {
    setIsLoading(true)
    setIsFinished(false)
    await startMove()
  }

  const fetchMove = async (targetFavoriteId: number, videoId: number) => {
    if (dataContext.defaultFavoriteId == null) return

    await new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id
          if (tabId == null) return

          chrome.tabs.sendMessage(
            tabId,
            {
              type: MessageEnum.moveVideo,
              data: {
                srcMediaId: dataContext.defaultFavoriteId,
                tarMediaId: targetFavoriteId,
                videoId,
              },
            },
            (message) => {
              resolve(message)
            },
          )
        })
      } catch (e) {
        reject(e)
        if (e instanceof Error) {
          console.error('move video error', e.message)
        }
      }
    })
  }

  const startMove = async () => {
    let pn = 1

    const run = async () => {
      if (dataContext.defaultFavoriteId == null) return

      const {
        data: { medias: allDefaultFavoriteVideo },
      } = await new Promise<ReturnType<typeof getFavoriteList>>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id
          if (tabId == null) return

          chrome.tabs.sendMessage(
            tabId,
            {
              type: MessageEnum.getFavoriteList,
              data: {
                mediaId: dataContext.defaultFavoriteId?.toString(),
                pn,
                ps: 36,
              },
            },
            (value) => {
              resolve(value)
            },
          )
        })
      })

      if (allDefaultFavoriteVideo == null) return

      for (const keywordInfo of dataContext.keyword.filter(
        (key) => key.favoriteDataId !== dataContext.defaultFavoriteId,
      )) {
        for (const keyValue of keywordInfo.value) {
          const targetFavoriteTag = dataContext.favoriteData.find(
            (fav) => fav.id === keywordInfo.favoriteDataId,
          )
          if (targetFavoriteTag == null) continue

          const keyword = keyValue.value.toLowerCase()

          for (const videoInfo of allDefaultFavoriteVideo) {
            const videoTitle = videoInfo.title.toLowerCase()

            if (videoTitle.includes(keyword)) {
              await fetchMove(targetFavoriteTag.id, videoInfo.id)
            }
          }
        }
      }

      await sleep(20)
      pn++
      await run()
    }
    const start = Date.now()
    await run()

    if (Date.now() - start < 1000) {
      await sleep(1000)
      setIsFinished(true)
    } else {
      setIsFinished(true)
    }
  }

  const isLoadingElement = (
    <div
      className={classNames(
        'fixed flex w-full h-full bg-white top-0 left-0 bg-opacity-70 items-center justify-center',
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

      <img alt="loading-gif" src={loadingGif} className={classNames({ ['hidden']: isFinished })} />
    </div>
  )

  return {
    handleMove,
    isLoadingElement,
  }
}

export { useMove }
