import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import classNames from 'classnames'
import { FolderOpen } from 'lucide-react'

interface FolderItem {
  id: number
  title: string
  media_count: number
}

interface FolderListProps {
  folders: FolderItem[]
  selectedFolderId: number | null
  dragOverFolderId: number | null
  onSelectFolder: (folderId: number) => void
  onDragOver: (event: React.DragEvent, folderId: number) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent, folderId: number) => void
}

const FolderList: React.FC<FolderListProps> = ({
  folders,
  selectedFolderId,
  dragOverFolderId,
  onSelectFolder,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <div className="w-64 flex flex-col border border-[#00AEEC]/20 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="bg-gradient-to-r bg-primary px-4 py-3 font-medium text-sm text-white flex items-center gap-2">
        <FolderOpen className="w-5 h-5" aria-hidden="true" />
        <span>收藏夹列表</span>
      </div>
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-3 space-y-1.5">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              onDragOver={(e) => onDragOver(e, folder.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, folder.id)}
              className={classNames(
                'px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm',
                'border',
                {
                  'bg-[#00AEEC]/10 text-[#00AEEC] border-[#00AEEC]/40 shadow-sm':
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
                    'bg-[#00AEEC]/20 text-[#00AEEC]': selectedFolderId === folder.id,
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
  )
}

export default FolderList
