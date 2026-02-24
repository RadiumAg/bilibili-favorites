import { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const DragManagerButton: FC = () => {
  const handleOpenDragManager = () => {
    window.open(`${chrome.runtime.getURL('options.html')}?tab=drag-manager`, '_blank')
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={handleOpenDragManager}
        size="sm"
        className="bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
      >
        拖拽管理
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(event) => {
                event.stopPropagation()
              }}
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs flex items-center justify-center cursor-pointer"
            >
              ?
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm">
            <p className="text-gray-700">
              可视化拖拽管理收藏夹视频，支持多选视频后拖拽到目标收藏夹进行批量移动。
            </p>
          </PopoverContent>
        </Popover>
      </Button>
    </div>
  )
}

export default DragManagerButton
