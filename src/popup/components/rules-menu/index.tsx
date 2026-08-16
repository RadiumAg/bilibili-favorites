import React from 'react'
import { ChevronDown, Tags, WandSparkles } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMove } from '@/hooks/use-move'

const RulesMenu: React.FC = () => {
  const { handleMove, isLoadingElement } = useMove()
  const [open, setOpen] = React.useState(false)

  const handleRuleMove = useMemoizedFn(() => {
    setOpen(false)
    handleMove().catch(() => {})
  })

  const handleOpenKeywordManager = useMemoizedFn(() => {
    setOpen(false)
    chrome.tabs
      .create({ url: 'options.html?tab=keyword-manager', active: true })
      .catch((error) => console.error('打开标签管理器失败:', error))
  })

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11 flex-1 text-xs">
            <Tags className="h-4 w-4" aria-hidden={true} />
            规则整理
            <ChevronDown className="h-3.5 w-3.5" aria-hidden={true} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1.5">
          <button
            type="button"
            onClick={handleRuleMove}
            className="flex min-h-11 w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors duration-200 hover:bg-[#BF00FF]/5 focus-visible:bg-[#BF00FF]/5"
          >
            <Tags className="mt-0.5 h-4 w-4 shrink-0 text-[#A000D9]" aria-hidden={true} />
            <span>
              <span className="block text-xs font-medium text-gray-800">通过标签整理（高级）</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                仅按标题与标签的字面规则直接移动
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleOpenKeywordManager}
            className="flex min-h-11 w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors duration-200 hover:bg-[#BF00FF]/5 focus-visible:bg-[#BF00FF]/5"
          >
            <WandSparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-[#D6006F]"
              aria-hidden={true}
            />
            <span>
              <span className="block text-xs font-medium text-gray-800">自动创建标签</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                前往标签管理器批量提取或编辑标签
              </span>
            </span>
          </button>
        </PopoverContent>
      </Popover>
      {isLoadingElement}
    </>
  )
}

export default RulesMenu
