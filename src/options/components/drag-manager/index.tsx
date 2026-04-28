import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { useToast } from '@/hooks/use-toast'
import classNames from 'classnames'
import { useFavoriteData, useFavoriteListData } from '@/hooks'
import FolderList from './folder-list'
import VideoList from './video-list'
import { sleep } from '@/utils/promise'

interface VideoItem {
  id: number
  title: string
  cover?: string
  bvid?: string
}

interface DragManagerProps {
  className?: string
}

const DragManager: React.FC<DragManagerProps> = ({ className }) => {
  const { toast } = useToast()
  const { favoriteData, refresh: refreshFavData } = useFavoriteData()
  const { fetchWithCache, moveVideosCache } = useFavoriteListData()

  const [selectedFolderId, setSelectedFolderId] = React.useState<number | null>(null)
  const [videos, setVideos] = React.useState<VideoItem[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = React.useState<Set<number>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [moving, setMoving] = React.useState(false)
  const [dragOverFolderId, setDragOverFolderId] = React.useState<number | null>(null)
  const [initialized, setInitialized] = React.useState(false)

  // 加载收藏夹视频
  const loadVideos = useMemoizedFn(async (folderId: number) => {
    setLoading(true)
    setSelectedVideoIds(new Set())
    try {
      const medias = await fetchWithCache(folderId.toString(), undefined, 0)
      setVideos(
        medias.map((m) => ({
          id: m.id,
          title: m.title,
          cover: m.cover,
          bvid: m.bvid,
        })),
      )
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '获取视频列表失败',
        variant: 'destructive',
      })
      setVideos([])
    } finally {
      setLoading(false)
    }
  })

  // 选择收藏夹
  const handleSelectFolder = useMemoizedFn((folderId: number) => {
    setSelectedFolderId(folderId)
    loadVideos(folderId)
  })

  // 切换视频选中状态
  const toggleVideoSelection = useMemoizedFn((videoId: number, event: React.MouseEvent) => {
    setSelectedVideoIds((prev) => {
      const newSet = new Set(prev)
      if (event.ctrlKey || event.metaKey) {
        if (newSet.has(videoId)) {
          newSet.delete(videoId)
        } else {
          newSet.add(videoId)
        }
      } else if (event.shiftKey && prev.size > 0) {
        newSet.add(videoId)
      } else {
        newSet.clear()
        newSet.add(videoId)
      }
      return newSet
    })
  })

  // 全选/取消全选
  const toggleSelectAll = useMemoizedFn(() => {
    if (selectedVideoIds.size === videos.length) {
      setSelectedVideoIds(new Set())
    } else {
      setSelectedVideoIds(new Set(videos.map((v) => v.id)))
    }
  })

  // 拖拽开始
  const handleDragStart = useMemoizedFn((event: React.DragEvent, videoId: number) => {
    const dragIds = selectedVideoIds.has(videoId) ? Array.from(selectedVideoIds) : [videoId]
    event.dataTransfer.setData('application/json', JSON.stringify(dragIds))
    event.dataTransfer.effectAllowed = 'move'

    const dragImage = document.createElement('div')
    dragImage.className = 'bg-b-primary text-white px-3 py-2 rounded shadow-lg'
    dragImage.textContent = `移动 ${dragIds.length} 个视频`
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  })

  // 拖拽经过收藏夹
  const handleDragOver = useMemoizedFn((event: React.DragEvent, folderId: number) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  })

  // 拖拽离开收藏夹
  const handleDragLeave = useMemoizedFn(() => {
    setDragOverFolderId(null)
  })

  // 放置到收藏夹
  const handleDrop = useMemoizedFn(async (event: React.DragEvent, targetFolderId: number) => {
    event.preventDefault()
    setDragOverFolderId(null)

    if (selectedFolderId === null || targetFolderId === selectedFolderId) return

    const data = event.dataTransfer.getData('application/json')
    if (!data) return

    const videoIds: number[] = JSON.parse(data)
    if (videoIds.length === 0) return

    setMoving(true)
    let successCount = 0
    let failCount = 0

    for (const videoId of videoIds) {
      try {
        await queryAndSendMessage({
          type: MessageEnum.moveVideo,
          data: { srcMediaId: selectedFolderId, tarMediaId: targetFolderId, videoId },
        })
        successCount++
      } catch (error) {
        failCount++
        console.error('Move failed:', error)
      }
    }

    setMoving(false)
    toast({ title: '移动完成', description: `成功: ${successCount}, 失败: ${failCount}` })

    if (successCount > 0) {
      moveVideosCache(selectedFolderId.toString(), targetFolderId.toString(), videoIds)
      loadVideos(selectedFolderId)
      await sleep(1000) // 请求太快favdata会刷新不了
      refreshFavData()
    }
  })

  // 默认选中第一个收藏夹
  React.useEffect(() => {
    if (!initialized && favoriteData.length > 0) {
      setInitialized(true)
      handleSelectFolder(favoriteData[0].id)
    }
  }, [favoriteData, handleSelectFolder, initialized])

  return (
    <div className={classNames('flex gap-4 h-[500px] md:h-[700px]', className)}>
      <FolderList
        folders={favoriteData}
        selectedFolderId={selectedFolderId}
        dragOverFolderId={dragOverFolderId}
        onSelectFolder={handleSelectFolder}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <VideoList
        videos={videos}
        selectedVideoIds={selectedVideoIds}
        selectedFolderId={selectedFolderId}
        loading={loading}
        moving={moving}
        onToggleVideo={toggleVideoSelection}
        onToggleSelectAll={toggleSelectAll}
        onDragStart={handleDragStart}
      />
    </div>
  )
}

export default DragManager
