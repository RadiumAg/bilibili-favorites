import { FC } from 'react'
import { FavoriteTag, Keyword } from '@/components'
import { Button } from '@/components/ui/button'
import { Move, LoginCheck, AutoCreateKeyword, AIMove } from './components'
import { Toaster } from '@/components/ui/toaster'
import { Settings } from 'lucide-react'

const Popup: FC = () => {
  const handleOpenSettings = () => {
    window.open(`${chrome.runtime.getURL('options.html')}?tab=setting`, '_blank')
  }

  return (
    <main className="w-96 min-h-96 p-3 bg-b-primary bg-opacity-15 flex flex-col">
      <div className="flex-grow">
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

        <FavoriteTag className="h-[200px]" />

        <h3 className="text-lg font-bold mt-2 mb-2 text-b-text-primary">关键字</h3>
        <Keyword />
      </div>

      <div className="flex items-center mt-2 gap-x-1">
        <Move />
        <AutoCreateKeyword />
        <AIMove />
      </div>

      <LoginCheck />
      <Toaster />
    </main>
  )
}

export default Popup
