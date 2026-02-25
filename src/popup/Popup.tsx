import { FC } from 'react'
import { FavoriteTag, Keyword } from '@/components'
import { Button } from '@/components/ui/button'
import { Move, LoginCheck, AutoCreateKeyword, AIMove, DragManagerButton } from './components'
import { Toaster } from '@/components/ui/toaster'
import { Settings } from 'lucide-react'
import Tourist from './components/tourist'
import { cn } from '@/lib/utils'

interface PopupProps {
  isSidePanel?: boolean
}

const Popup: FC<PopupProps> = (props) => {
  const { isSidePanel = false } = props

  const handleOpenSettings = () => {
    window.open(`${chrome.runtime.getURL('options.html')}?tab=setting`, '_blank')
  }

  return (
    <main
      className={`p-3 bg-b-primary bg-opacity-15 flex flex-col ${
        isSidePanel ? 'w-full min-h-screen' : 'w-96 min-h-96'
      }`}
    >
      <div className="flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-b-text-primary flex justify-between">
          收藏夹
          <Button
            onClick={handleOpenSettings}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-b-text-primary hover:bg-b-primary hover:bg-opacity-20"
            title="打开设置页面"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </h3>

        <div data-tour="favorites">
          <FavoriteTag className={isSidePanel ? 'max-h-[300px]' : 'h-[200px]'} />
        </div>

        <h3 className="text-lg font-bold mt-2 mb-2 text-b-text-primary">关键字</h3>
        <div className={cn(isSidePanel ? 'flex flex-col flex-1' : undefined)} data-tour="keywords">
          <Keyword className={cn(isSidePanel ? 'flex-1' : undefined)} />
        </div>
      </div>

      <div className="flex items-center mt-2 gap-1 w-full flex-wrap" data-tour="actions">
        <Move />
        <AutoCreateKeyword />
        <AIMove />
        <DragManagerButton />
      </div>

      <LoginCheck />
      <Toaster />
      <Tourist />
    </main>
  )
}

export default Popup
