import React from 'react'
import { FavoriteTag, Keyword, StarInvitation } from '@/components'
import { Button } from '@/components/ui/button'
import { LoginCheck, AIMove, DragManagerButton, RulesMenu } from './components'
import { Toaster } from '@/components/ui/toaster'
import { Settings, HelpCircle, RefreshCwIcon, Github } from 'lucide-react'
import Tourist, { TouristRef, useTourist } from './components/tourist'
import { cn } from '@/lib/utils'
import { useMemoizedFn } from 'ahooks'

interface PopupProps {
  isSidePanel?: boolean
}

const Popup: React.FC<PopupProps> = (props) => {
  const { isSidePanel = false } = props
  const touristRef = React.useRef<TouristRef>(null)
  const [highlightDefaultAction, setHighlightDefaultAction] = React.useState(false)
  const highlightTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

  const handleRequestDefaultFavorite = useMemoizedFn(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .querySelector('[data-tour="favorites"]')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
    setHighlightDefaultAction(true)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => setHighlightDefaultAction(false), 2400)
  })

  const handleOpenSettings = () => {
    window.open(`${chrome.runtime.getURL('options.html')}?tab=setting`, '_blank')
  }

  const handleOpenGitHub = () => {
    window.open('https://github.com/RadiumAg/bilibili-favorites', '_blank')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <main
      className={`p-3 bg-b-primary bg-opacity-15 flex flex-col ${
        isSidePanel ? 'w-full h-screen overflow-hidden' : 'w-96 min-h-96'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <h3 className="text-lg font-bold mb-2 text-b-text-primary flex justify-between">
          收藏夹
          <div className="flex items-center gap-1">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-b-text-primary hover:bg-b-primary hover:bg-opacity-20 transition-colors duration-200"
              title="刷新"
              aria-label="刷新"
            >
              <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => {
                touristRef.current?.resetTourist()
              }}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-b-text-primary hover:bg-b-primary hover:bg-opacity-20 transition-colors duration-200"
              title="查看使用方式"
              aria-label="查看使用方式"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={handleOpenSettings}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-b-text-primary hover:bg-b-primary hover:bg-opacity-20 transition-colors duration-200"
              title="打开设置页面"
              aria-label="打开设置页面"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={handleOpenGitHub}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-b-text-primary hover:bg-b-primary hover:bg-opacity-20 transition-colors duration-200"
              title="GitHub"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </h3>

        <div data-tour="favorites">
          <FavoriteTag
            className={isSidePanel ? 'max-h-[300px]' : 'h-[200px]'}
            highlightDefaultAction={highlightDefaultAction}
          />
        </div>

        <h3 className="text-lg font-bold mt-2 mb-2 text-b-text-primary">标签</h3>
        <div
          className={cn(isSidePanel ? 'flex flex-col flex-1 overflow-hidden' : undefined)}
          data-tour="keywords"
        >
          <Keyword className={cn(isSidePanel ? 'flex-1' : undefined)} />
        </div>
      </div>

      <div className="mt-2 w-full space-y-2" data-tour="actions">
        <AIMove onRequestDefaultFavorite={handleRequestDefaultFavorite} />
        <div className="flex w-full gap-2">
          <RulesMenu />
          <DragManagerButton />
        </div>
      </div>

      <LoginCheck />
      <Toaster />
      <Tourist ref={touristRef} />
      <StarInvitation scope="popup" />
    </main>
  )
}

export default Popup
