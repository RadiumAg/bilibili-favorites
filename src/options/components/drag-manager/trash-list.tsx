import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock3, RotateCcw, Trash2, X } from 'lucide-react'
import { getVideoTrashRemainingDays, type VideoTrashRecord } from '@/utils/video-trash'

type TrashListProps = {
  records: VideoTrashRecord[]
  selectedKeys: Set<string>
  existingFolderIds: Set<number>
  loading: boolean
  processing: boolean
  onCheckedChange: (key: string, checked: boolean) => void
  onToggleSelectAll: () => void
  onClearSelection: () => void
  onRestore: () => void
  onRequestPermanentDelete: () => void
}

const TrashList: React.FC<TrashListProps> = ({
  records,
  selectedKeys,
  existingFolderIds,
  loading,
  processing,
  onCheckedChange,
  onToggleSelectAll,
  onClearSelection,
  onRestore,
  onRequestPermanentDelete,
}) => {
  const isAllSelected = records.length > 0 && selectedKeys.size === records.length

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-[#FB7299]/20 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#FB7299] to-[#F15B88] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          <span>回收站</span>
          <span className="ml-1 text-xs text-white/80">
            ({records.length} 个视频，已选 {selectedKeys.size} 个)
          </span>
        </div>
        {records.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white">
            <Checkbox
              checked={isAllSelected ? true : selectedKeys.size > 0 ? 'indeterminate' : false}
              onCheckedChange={onToggleSelectAll}
              className="h-4 w-4 border-white/70 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-[#FB7299] data-[state=indeterminate]:border-white data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#FB7299]"
              aria-label={isAllSelected ? '取消全选' : '全选回收站视频'}
            />
            <span>{isAllSelected ? '取消全选' : '全选'}</span>
          </label>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {loading ? (
          <div className="space-y-3 p-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-14 w-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <Trash2 className="h-10 w-10 text-gray-300" aria-hidden="true" />
            <span>回收站是空的</span>
            <span className="text-xs">删除的视频会在这里保留 7 天</span>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const selected = selectedKeys.has(record.key)
              const folderExists = existingFolderIds.has(record.originalFolderId)
              return (
                <div
                  key={record.key}
                  onClick={() => onCheckedChange(record.key, !selected)}
                  className={`flex items-center gap-3 rounded-lg border-2 p-2.5 transition-colors duration-200 ${
                    selected
                      ? 'cursor-pointer border-[#FB7299] bg-[#FB7299]/5'
                      : 'cursor-pointer border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {record.cover && (
                    <img
                      src={record.cover}
                      alt=""
                      className="h-14 w-24 flex-shrink-0 rounded-lg object-cover shadow-sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium text-gray-700">
                      {record.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span>原收藏夹：{record.originalFolderTitle}</span>
                      <span className="flex items-center gap-1 text-[#E85B87]">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        剩余 {getVideoTrashRemainingDays(record)} 天
                      </span>
                      {!folderExists && <span className="text-red-500">原收藏夹已不存在</span>}
                    </div>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => onCheckedChange(record.key, checked === true)}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 border-gray-300 data-[state=checked]:border-[#FB7299] data-[state=checked]:bg-[#FB7299]"
                      aria-label={`${selected ? '取消选中' : '选中'}${record.title}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedKeys.size > 0 ? (
        <div className="flex min-h-11 items-center justify-between gap-3 border-t border-[#FB7299]/15 bg-[#FB7299]/5 px-4 py-2">
          <span className="text-xs font-medium text-gray-700">已选 {selectedKeys.size} 个视频</span>
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
              variant="outline"
              size="sm"
              onClick={onRestore}
              disabled={processing}
              className="h-7 gap-1 border-[#00AEEC]/40 px-2.5 text-[#008CC1] hover:bg-[#00AEEC]/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              恢复
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRequestPermanentDelete}
              disabled={processing}
              className="h-7 gap-1 px-2.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              永久删除
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-[#FB7299]/10 bg-[#FB7299]/5 px-4 py-2.5 text-xs text-[#E85B87]">
          回收站记录保留 7 天，到期后自动清除。
        </div>
      )}

      {processing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#FB7299] border-t-transparent" />
            <div className="text-sm font-medium text-[#E85B87]">正在处理回收站...</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrashList
