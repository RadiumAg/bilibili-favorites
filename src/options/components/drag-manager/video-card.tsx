import React from 'react'
import classNames from 'classnames'

interface VideoCardProps {
  video: {
    id: number
    title: string
    cover?: string
    bvid?: string
  }
  selected: boolean
  onClick: (videoId: number, event: React.MouseEvent) => void
  onDragStart: (event: React.DragEvent, videoId: number) => void
}

const VideoCard: React.FC<VideoCardProps> = ({ video, selected, onClick, onDragStart }) => {
  return (
    <div
      draggable
      onClick={(e) => onClick(video.id, e)}
      onDragStart={(e) => onDragStart(e, video.id)}
      className={classNames(
        'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200',
        'border-2 group',
        {
          'border-[#00AEEC] bg-[#00AEEC]/5 shadow-sm shadow-[#00AEEC]/20': selected,
          'border-transparent hover:bg-gray-50 hover:border-gray-200': !selected,
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
            className={classNames('absolute inset-0 rounded-lg transition-opacity duration-200', {
              'bg-[#00AEEC]/20': selected,
              'bg-transparent group-hover:bg-black/5': !selected,
            })}
          />
        </div>
      )}
      {/* 标题 */}
      <div className="flex-1 min-w-0">
        <div
          className={classNames('text-sm line-clamp-2 font-medium', {
            'text-[#00AEEC]': selected,
            'text-gray-700': !selected,
          })}
        >
          {video.title}
        </div>
        {video.bvid && <div className="text-xs text-gray-400 mt-1 font-mono">{video.bvid}</div>}
      </div>
      {/* 选中指示器 */}
      <div
        className={classNames(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-200',
          {
            'bg-[#00AEEC] text-white shadow-md shadow-[#00AEEC]/30': selected,
            'border-2 border-gray-200 group-hover:border-[#00AEEC]/50': !selected,
          },
        )}
      >
        {selected && '✓'}
      </div>
    </div>
  )
}

export default VideoCard
