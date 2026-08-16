import { type FC } from 'react'
import { Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DragManagerButton: FC = () => {
  const handleOpenDragManager = () => {
    window.open(`${chrome.runtime.getURL('options.html')}?tab=drag-manager`, '_blank')
  }

  return (
    <Button
      type="button"
      onClick={handleOpenDragManager}
      variant="outline"
      className="min-h-11 flex-1 text-xs"
      title="可视化拖拽管理收藏夹视频"
    >
      <Grip className="h-4 w-4" aria-hidden={true} />
      拖拽管理
    </Button>
  )
}

export default DragManagerButton
