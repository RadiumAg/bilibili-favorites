import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage, fetchAllFavoriteMedias } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import classNames from 'classnames'

interface VideoItem {
  id: number
  title: string
  cover?: string
  bvid?: string
}

interface FavoriteMediaResponse {
  id: number
  title: string
  cover: string
  bvid: string
}

interface DragManagerProps {
  className?: string
}

const DragManager: React.FC<DragManagerProps> = (props) => {
  const { className } = props
  const { toast } = useToast()

  const { favoriteData } = useGlobalConfig(
    useShallow((state) => ({
      favoriteData: state.favoriteData,
    })),
  )

  const [selectedFolderId, setSelectedFolderId] = React.useState<number | null>(null)
  const [videos, setVideos] = React.useState<VideoItem[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = React.useState<Set<number>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [moving, setMoving] = React.useState(false)
  const [dragOverFolderId, setDragOverFolderId] = React.useState<number | null>(null)

  // 加载收藏夹视频
  const loadVideos = useMemoizedFn(async (folderId: number) => {
    setLoading(true)
    setSelectedVideoIds(new Set())
    try {
      const medias = await fetchAllFavoriteMedias<FavoriteMediaResponse>(folderId.toString())
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
        // Ctrl/Cmd + 点击：切换单个选中
        if (newSet.has(videoId)) {
          newSet.delete(videoId)
        } else {
          newSet.add(videoId)
        }
      } else if (event.shiftKey && prev.size > 0) {
        // Shift + 点击：范围选择
        newSet.add(videoId)
      } else {
        // 普通点击：单选
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
    // 如果拖拽的视频不在选中列表中，则只拖拽当前视频
    const dragIds = selectedVideoIds.has(videoId) ? Array.from(selectedVideoIds) : [videoId]

    event.dataTransfer.setData('application/json', JSON.stringify(dragIds))
    event.dataTransfer.effectAllowed = 'move'

    // 设置拖拽图像提示
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

    if (selectedFolderId === null || targetFolderId === selectedFolderId) {
      return
    }

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
          data: {
            srcMediaId: selectedFolderId,
            tarMediaId: targetFolderId,
            videoId,
          },
        })
        successCount++
      } catch (error) {
        failCount++
        console.error('Move failed:', error)
      }
    }

    setMoving(false)

    toast({
      title: '移动完成',
      description: `成功: ${successCount}, 失败: ${failCount}`,
    })

    // 刷新当前收藏夹
    if (successCount > 0) {
      loadVideos(selectedFolderId)
    }
  })

  return (
    <div className={classNames('flex gap-4 h-[700px]', className)}>
      {/* 左侧：收藏夹列表 */}
      <div className="w-64 flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b font-medium text-sm">📁 收藏夹列表</div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {favoriteData.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleSelectFolder(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={classNames(
                  'px-3 py-2 rounded cursor-pointer transition-all text-sm',
                  'border-2 border-transparent',
                  {
                    'bg-b-primary text-white': selectedFolderId === folder.id,
                    'hover:bg-gray-100': selectedFolderId !== folder.id,
                    'border-b-primary border-dashed bg-pink-50':
                      dragOverFolderId === folder.id && selectedFolderId !== folder.id,
                  },
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{folder.title}</span>
                  <span className="text-xs opacity-70">{folder.media_count}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧：视频列表 */}
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium text-sm">
            🎬 视频列表
            {selectedFolderId && (
              <span className="ml-2 text-gray-500">
                ({videos.length} 个视频, 已选 {selectedVideoIds.size} 个)
              </span>
            )}
          </div>
          {videos.length > 0 && (
            <Button size="sm" variant="outline" onClick={toggleSelectAll} className="h-7 text-xs">
              {selectedVideoIds.size === videos.length ? '取消全选' : '全选'}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {!selectedFolderId ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              👈 请先选择一个收藏夹
            </div>
          ) : loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              该收藏夹暂无视频
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {videos.map((video) => (
                <div
                  key={video.id}
                  draggable
                  onClick={(e) => toggleVideoSelection(video.id, e)}
                  onDragStart={(e) => handleDragStart(e, video.id)}
                  className={classNames(
                    'flex items-center gap-3 p-2 rounded cursor-pointer transition-all',
                    'border-2',
                    {
                      'border-b-primary bg-pink-50': selectedVideoIds.has(video.id),
                      'border-transparent hover:bg-gray-50': !selectedVideoIds.has(video.id),
                    },
                  )}
                >
                  {/* 封面 */}
                  {video.cover && (
                    <img
                      src={video.cover}
                      alt={video.title}
                      className="w-24 h-14 object-cover rounded flex-shrink-0"
                      draggable={false}
                    />
                  )}
                  {/* 标题 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm line-clamp-2">{video.title}</div>
                    {video.bvid && <div className="text-xs text-gray-400 mt-1">{video.bvid}</div>}
                  </div>
                  {/* 选中指示器 */}
                  {selectedVideoIds.has(video.id) && (
                    <div className="w-5 h-5 rounded-full bg-b-primary text-white flex items-center justify-center text-xs flex-shrink-0">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 底部提示 */}
        {selectedFolderId && videos.length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            💡 提示：选中视频后拖拽到左侧收藏夹即可移动。支持 Ctrl/Cmd + 点击多选。
          </div>
        )}

        {/* 移动中遮罩 */}
        {moving && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-b-primary border-t-transparent rounded-full mx-auto mb-2" />
              <div className="text-sm text-gray-600">正在移动视频...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DragManager
