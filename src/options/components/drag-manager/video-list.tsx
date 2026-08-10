import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import classNames from 'classnames'
import { FolderOpen, Video, Lightbulb, Loader2, Trash2, X } from 'lucide-react'
import VideoCard from './video-card'

interface VideoItem {
  id: number
  title: string
  cover?: string
  bvid?: string
}

interface VideoListProps {
  videos: VideoItem[]
  totalCount?: number
  selectedVideoIds: Set<number>
  selectedFolderId: number | null
  loading: boolean
  moving: boolean
  deleting: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onToggleVideo: (videoId: number, event: React.MouseEvent) => void
  onCheckedChange: (videoId: number, checked: boolean) => void
  onToggleSelectAll: () => void
  onClearSelection: () => void
  onRequestDelete: () => void
  onDragStart: (event: React.DragEvent, videoId: number) => void
  onLoadMore?: () => void
}

const VideoList: React.FC<VideoListProps> = ({
  videos,
  totalCount,
  selectedVideoIds,
  selectedFolderId,
  loading,
  moving,
  deleting,
  hasMore = false,
  loadingMore = false,
  onToggleVideo,
  onCheckedChange,
  onToggleSelectAll,
  onClearSelection,
  onRequestDelete,
  onDragStart,
  onLoadMore,
}) => {
  const displayTotal = totalCount ?? videos.length
  // isAllSelected 基于已加载的视频判断，不受 totalCount 影响
  const isAllSelected = videos.length > 0 && selectedVideoIds.size === videos.length

  const handleScroll = useMemoizedFn((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 120 && hasMore && !loadingMore) {
      onLoadMore?.()
    }
  })

  return (
    <div className="flex-1 flex flex-col border border-[#00AEEC]/20 rounded-xl overflow-hidden shadow-sm bg-white relative">
      {/* 头部 */}
      <div className="bg-gradient-to-r bg-primary px-4 py-3 flex items-center justify-between">
        <div className="font-medium text-sm text-white flex items-center gap-2">
          <Video className="w-5 h-5" aria-hidden="true" />
          <span>视频列表</span>
          {selectedFolderId && (
            <span className="ml-2 text-white/80 text-xs">
              ({displayTotal} 个视频, 已选
              <span className="text-white font-bold">{selectedVideoIds.size}</span> 个)
            </span>
          )}
        </div>
        {videos.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white">
            <Checkbox
              checked={isAllSelected ? true : selectedVideoIds.size > 0 ? 'indeterminate' : false}
              onCheckedChange={onToggleSelectAll}
              className="h-4 w-4 border-white/70 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-primary data-[state=indeterminate]:border-white data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-primary"
              aria-label={isAllSelected ? '取消全选' : '全选已加载视频'}
            />
            <span>{isAllSelected ? '取消全选' : '全选'}</span>
          </label>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" onScroll={handleScroll}>
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
                onCheckedChange={onCheckedChange}
                onDragStart={onDragStart}
              />
            ))}
            {/* 加载更多状态 */}
            {loadingMore && (
              <div className="flex items-center justify-center py-3 text-[#00AEEC] text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>加载更多...</span>
              </div>
            )}
            {!hasMore && videos.length > 0 && (
              <div className="text-center py-3 text-xs text-gray-400">
                已加载全部 {displayTotal} 个视频
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部提示 / 批量操作 */}
      {selectedFolderId &&
        displayTotal > 0 &&
        !loading &&
        (selectedVideoIds.size > 0 ? (
          <BatchActionBar
            selectedCount={selectedVideoIds.size}
            deleting={deleting}
            onClearSelection={onClearSelection}
            onRequestDelete={onRequestDelete}
          />
        ) : (
          <BottomHint />
        ))}

      {/* 处理中遮罩 */}
      {(moving || deleting) && <ProcessingOverlay deleting={deleting} />}
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
    <span>单击可多选或反选视频，选中后拖拽到左侧收藏夹即可移动。</span>
  </div>
)

const BatchActionBar: React.FC<{
  selectedCount: number
  deleting: boolean
  onClearSelection: () => void
  onRequestDelete: () => void
}> = ({ selectedCount, deleting, onClearSelection, onRequestDelete }) => (
  <div className="flex min-h-11 items-center justify-between gap-3 border-t border-[#00AEEC]/15 bg-[#00AEEC]/5 px-4 py-2">
    <span className="text-xs font-medium text-gray-700">已选 {selectedCount} 个视频</span>
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-7 gap-1 px-2 text-gray-600"
      >
        <X className="h-3.5 w-3.5" />
        取消选择
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRequestDelete}
        disabled={deleting}
        className="h-7 gap-1 px-2.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        删除
      </Button>
    </div>
  </div>
)

/** 批量处理中遮罩 */
const ProcessingOverlay: React.FC<{ deleting: boolean }> = ({ deleting }) => (
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
    <div className="text-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#00AEEC] border-t-transparent rounded-full mx-auto mb-3" />
      <div className="text-sm text-[#00AEEC] font-medium">
        {deleting ? '正在删除并移入回收站...' : '正在移动视频...'}
      </div>
    </div>
  </div>
)

export default VideoList
