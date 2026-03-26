import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { queryAndSendMessage } from '@/utils/tab'
import { MessageEnum } from '@/utils/message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import classNames from 'classnames'
import { fetchAllFavoriteMedias } from '@/utils/api'
import { FolderOpen, Video } from 'lucide-react'

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
  const [initialized, setInitialized] = React.useState(false)

  // 加载收藏夹视频
  const loadVideos = useMemoizedFn(async (folderId: number) => {
    setLoading(true)
    setSelectedVideoIds(new Set())
    try {
      const medias = await fetchAllFavoriteMedias(folderId.toString(), undefined, 0)
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

  // 默认选中第一个收藏夹
  React.useEffect(() => {
    if (!initialized && favoriteData.length > 0) {
      setInitialized(true)
      handleSelectFolder(favoriteData[0].id)
    }
  }, [favoriteData, handleSelectFolder, initialized])

  return (
    <div className={classNames('flex gap-4 h-[700px]', className)}>
      {/* 左侧：收藏夹列表 */}
      <div className="w-64 flex flex-col border border-[#00AEEC]/20 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="bg-gradient-to-r bg-primary px-4 py-3 font-medium text-sm text-white flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          <span>收藏夹列表</span>
        </div>
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-3 space-y-1.5">
            {favoriteData.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleSelectFolder(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={classNames(
                  'px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm',
                  'border-2',
                  {
                    'bg-primary text-white border-[#00AEEC] shadow-md shadow-[#00AEEC]/30':
                      selectedFolderId === folder.id,
                    'border-transparent hover:bg-[#00AEEC]/5 hover:border-[#00AEEC]/20':
                      selectedFolderId !== folder.id && dragOverFolderId !== folder.id,
                    'border-primary border-dashed bg-[#00AEEC]/10':
                      dragOverFolderId === folder.id && selectedFolderId !== folder.id,
                  },
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{folder.title}</span>
                  <span
                    className={classNames('text-xs px-1.5 py-0.5 rounded-full', {
                      'bg-white/20': selectedFolderId === folder.id,
                      'bg-[#00AEEC]/10 text-[#00AEEC]': selectedFolderId !== folder.id,
                    })}
                  >
                    {folder.media_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧：视频列表 */}
      <div className="flex-1 flex flex-col border border-[#00AEEC]/20 rounded-xl overflow-hidden shadow-sm bg-white relative">
        <div className="bg-gradient-to-r bg-primary px-4 py-3 flex items-center justify-between">
          <div className="font-medium text-sm text-white flex items-center gap-2">
            <Video className="w-5 h-5" />
            <span>视频列表</span>
            {selectedFolderId && (
              <span className="ml-2 text-white/80 text-xs">
                ({videos.length} 个视频, 已选
                <span className="text-white font-bold">{selectedVideoIds.size}</span> 个)
              </span>
            )}
          </div>
          {videos.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
              className="h-7 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              {selectedVideoIds.size === videos.length ? '取消全选' : '全选'}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 scrollbar-thin">
          {!selectedFolderId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <FolderOpen className="w-10 h-10 text-gray-300" />
              <span>请先选择一个收藏夹</span>
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-24 h-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Video className="w-10 h-10 text-gray-300" />
              <span>该收藏夹暂无视频</span>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  draggable
                  onClick={(e) => toggleVideoSelection(video.id, e)}
                  onDragStart={(e) => handleDragStart(e, video.id)}
                  className={classNames(
                    'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200',
                    'border-2 group',
                    {
                      'border-[#00AEEC] bg-[#00AEEC]/5 shadow-sm shadow-[#00AEEC]/20':
                        selectedVideoIds.has(video.id),
                      'border-transparent hover:bg-gray-50 hover:border-gray-200':
                        !selectedVideoIds.has(video.id),
                    },
                  )}
                >
                  {/* 封面 */}
                  {video.cover && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.cover}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded-lg shadow-sm"
                        draggable={false}
                      />
                      <div
                        className={classNames(
                          'absolute inset-0 rounded-lg transition-opacity duration-200',
                          {
                            'bg-[#00AEEC]/20': selectedVideoIds.has(video.id),
                            'bg-transparent group-hover:bg-black/5': !selectedVideoIds.has(
                              video.id,
                            ),
                          },
                        )}
                      />
                    </div>
                  )}
                  {/* 标题 */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={classNames('text-sm line-clamp-2 font-medium', {
                        'text-[#00AEEC]': selectedVideoIds.has(video.id),
                        'text-gray-700': !selectedVideoIds.has(video.id),
                      })}
                    >
                      {video.title}
                    </div>
                    {video.bvid && (
                      <div className="text-xs text-gray-400 mt-1 font-mono">{video.bvid}</div>
                    )}
                  </div>
                  {/* 选中指示器 */}
                  <div
                    className={classNames(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-200',
                      {
                        'bg-[#00AEEC] text-white shadow-md shadow-[#00AEEC]/30':
                          selectedVideoIds.has(video.id),
                        'border-2 border-gray-200 group-hover:border-[#00AEEC]/50':
                          !selectedVideoIds.has(video.id),
                      },
                    )}
                  >
                    {selectedVideoIds.has(video.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 底部提示 */}
        {selectedFolderId && videos.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#00AEEC]/10 bg-[#00AEEC]/5 text-xs text-[#00AEEC] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            <span>选中视频后拖拽到左侧收藏夹即可移动。支持 Ctrl/Cmd + 点击多选。</span>
          </div>
        )}

        {/* 移动中遮罩 */}
        {moving && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-[#00AEEC] border-t-transparent rounded-full mx-auto mb-3" />
              <div className="text-sm text-[#00AEEC] font-medium">正在移动视频...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DragManager
