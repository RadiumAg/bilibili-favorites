import React from 'react'
import { DataContext } from '@/utils/data-context'
import { getFavoriteList } from '@/utils/api'
import { sleep } from '@/utils/promise'
import { MessageEnum } from '@/utils/message'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/Finished'
import classNames from 'classnames'

const useMove = () => {
  const dataContext = React.use(DataContext)
  const [isFinished, setIsFinished] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleMove = async () => {
    setIsLoading(true)
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
                pn: 1,
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

      for (const keywordInfo of dataContext.keyword) {
        for (const keyValue of keywordInfo.value) {
          for (const videoInfo of allDefaultFavoriteVideo) {
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

      await sleep(20)
      await run()
    }

    setIsFinished(true)
    await run()
  }

  const isLoadingElement = (
    <>
      {isLoading && (
        <div
          className={classNames(
            'fixed flex w-full h-full bg-white top-0 left-0 bg-opacity-70 items-center justify-center',
          )}
        >
          {isFinished ? (
            <Finished
              onFinished={() => {
                setIsLoading(false)
                setIsFinished(true)
              }}
            />
          ) : (
            <img src={loadingGif} />
          )}
        </div>
      )}
    </>
  )

  return {
    handleMove,
    isLoadingElement,
  }
}

export { useMove }