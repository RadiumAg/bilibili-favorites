import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import classNames from 'classnames'
import { FolderOpen, Video, Lightbulb } from 'lucide-react'
import VideoCard from './video-card'

interface VideoItem {
  id: number
  title: string
  cover?: string
  bvid?: string
}

interface VideoListProps {
  videos: VideoItem[]
  selectedVideoIds: Set<number>
  selectedFolderId: number | null
  loading: boolean
  moving: boolean
  onToggleVideo: (videoId: number, event: React.MouseEvent) => void
  onToggleSelectAll: () => void
  onDragStart: (event: React.DragEvent, videoId: number) => void
}

const VideoList: React.FC<VideoListProps> = ({
  videos,
  selectedVideoIds,
  selectedFolderId,
  loading,
  moving,
  onToggleVideo,
  onToggleSelectAll,
  onDragStart,
}) => {
  const isAllSelected = videos.length > 0 && selectedVideoIds.size === videos.length

  return (
    <div className="flex-1 flex flex-col border border-[#00AEEC]/20 rounded-xl overflow-hidden shadow-sm bg-white relative">
      {/* 头部 */}
      <div className="bg-gradient-to-r bg-primary px-4 py-3 flex items-center justify-between">
        <div className="font-medium text-sm text-white flex items-center gap-2">
          <Video className="w-5 h-5" aria-hidden="true" />
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
            onClick={onToggleSelectAll}
            className="h-7 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            aria-label={isAllSelected ? '取消全选' : '全选'}
          >
            {isAllSelected ? '取消全选' : '全选'}
          </Button>
        )}
      </div>

      {/* 内容区 */}
      <ScrollArea className="flex-1 scrollbar-thin">
        {!selectedFolderId ? (
          <EmptyState
            icon={<FolderOpen className="w-10 h-10 text-gray-300" />}
            text="请先选择一个收藏夹"
          />
        ) : loading ? (
          <LoadingSkeleton />
        ) : videos.length === 0 ? (
          <EmptyState
            icon={<Video className="w-10 h-10 text-gray-300" />}
            text="该收藏夹暂无视频"
          />
        ) : (
          <div className="p-3 space-y-2">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                selected={selectedVideoIds.has(video.id)}
                onClick={onToggleVideo}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 底部提示 */}
      {selectedFolderId && videos.length > 0 && <BottomHint />}

      {/* 移动中遮罩 */}
      {moving && <MovingOverlay />}
    </div>
  )
}

/** 空状态 */
const EmptyState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
    {icon}
    <span>{text}</span>
  </div>
)

/** 加载骨架屏 */
const LoadingSkeleton = () => (
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
)

/** 底部操作提示 */
const BottomHint = () => (
  <div className="px-4 py-2.5 border-t border-[#00AEEC]/10 bg-[#00AEEC]/5 text-xs text-[#00AEEC] flex items-center gap-2">
    <Lightbulb className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    <span>选中视频后拖拽到左侧收藏夹即可移动。支持 Ctrl/Cmd + 点击多选。</span>
  </div>
)

/** 移动中遮罩 */
const MovingOverlay = () => (
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
    <div className="text-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#00AEEC] border-t-transparent rounded-full mx-auto mb-3" />
      <div className="text-sm text-[#00AEEC] font-medium">正在移动视频...</div>
    </div>
  </div>
)

export default VideoList
