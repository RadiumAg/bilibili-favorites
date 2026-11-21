import React from 'react'
import { sleep } from '@/utils/promise'
import { MessageEnum } from '@/utils/message'
import loadingGif from '@/assets/loading.gif'
import Finished from '@/components/finished-animate'
import { cn } from '@/lib/utils'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { Button } from '@/components/ui/button'
import { toast } from '../use-toast'
import { fetchAllFavoriteMedias } from '@/utils/api'
import { notifyOrganizeDone } from '@/utils/pet-message'
import { useStarInvitation } from '@/hooks/use-star-invitation'

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
  const { recordSuccessfulUse, resetStarInvitation, showStarInvitationAfterClose } =
    useStarInvitation('popup')

  const handleMove = async () => {
    cancelRef.current = false
    resetStarInvitation()
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
      const response = await queryAndSendMessage<{ code: number; message?: string }>({
        type: MessageEnum.moveVideo,
        data: {
          srcMediaId: dataContext.defaultFavoriteId,
          tarMediaId: targetFavoriteId,
          videoId,
        },
      })
      if (response?.code !== 0) throw new Error(response?.message || 'B 站未确认移动成功')
    } catch (e) {
      if (e instanceof Error) {
        console.error('move video error', e.message)
      }
      throw e
    }
  }

  const startMove = async () => {
    let movedCount = 0

    const run = async () => {
      if (cancelRef.current) return false
      if (dataContext.defaultFavoriteId == null) return false

      const defaultFav = dataContext.favoriteData?.find(
        (f) => f.id === dataContext.defaultFavoriteId,
      )
      const allDefaultFavoriteVideo = await fetchAllFavoriteMedias(
        dataContext.defaultFavoriteId?.toString(),
        { mediaCount: defaultFav?.media_count },
      )

      if (allDefaultFavoriteVideo == null) return false

      const normalize = (value: string) => value.trim().normalize('NFKC').toLocaleLowerCase()
      const rules = dataContext.keyword
        .filter((item) => item.favoriteDataId !== dataContext.defaultFavoriteId)
        .flatMap((item) => {
          const targetFavorite = dataContext.favoriteData.find(
            (favorite) => favorite.id === item.favoriteDataId,
          )
          if (!targetFavorite) return []
          return item.value
            .map((tag) => normalize(tag.value))
            .filter(Boolean)
            .map((keyword) => ({ keyword, targetFavoriteId: targetFavorite.id }))
        })

      const movePlan: Array<{ videoId: number; targetFavoriteId: number }> = []
      for (const videoInfo of allDefaultFavoriteVideo) {
        const videoTitle = normalize(videoInfo.title)
        const matches = rules.filter((rule) => videoTitle.includes(rule.keyword))
        if (matches.length === 0) continue

        const longestLength = Math.max(...matches.map((rule) => rule.keyword.length))
        const mostSpecific = matches.filter((rule) => rule.keyword.length === longestLength)
        const targetIds = new Set(mostSpecific.map((rule) => rule.targetFavoriteId))
        // 同一视频出现同等具体、但目标不同的规则时宁可跳过，也不要按遍历顺序猜目标。
        if (targetIds.size !== 1) continue

        movePlan.push({ videoId: videoInfo.id, targetFavoriteId: mostSpecific[0].targetFavoriteId })
      }

      for (let index = 0; index < movePlan.length; index += 1) {
        if (cancelRef.current) return false
        const item = movePlan[index]
        await fetchMove(item.targetFavoriteId, item.videoId)
        movedCount += 1
        if (index < movePlan.length - 1) await sleep(500)
      }
    }

    try {
      const start = Date.now()
      await run()

      if (cancelRef.current) {
        setIsLoading(false)
        return
      }

      if (movedCount > 0) {
        notifyOrganizeDone(movedCount)
        await recordSuccessfulUse()
      }

      if (Date.now() - start < 1000) {
        await sleep(1000)
      }
      setIsFinished(true)
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: 'destructive',
          title: '操作失败',
          description: e.message,
        })
      }
      setIsLoading(false)
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
          showStarInvitationAfterClose()
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
    isLoadingElement,
    handleMove,
  }
}

export { useMove }
