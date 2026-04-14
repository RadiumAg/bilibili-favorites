import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAIMove } from './use-ai-move'
import { useMemoizedFn } from 'ahooks'

const AIMove: React.FC = () => {
  const { handleAIMove, isLoadingElement } = useAIMove()
  const pendingConfirmRef = React.useRef(false)

  const handleClick = useMemoizedFn(() => {
    if (!pendingConfirmRef.current) {
      pendingConfirmRef.current = true
      toast({
        title: '⚠️ Token 消耗提醒',
        description:
          '此操作会将所有视频标题发送给 AI 进行分析，可能消耗大量 Token。再次点击确认执行。',
      })
      setTimeout(() => {
        pendingConfirmRef.current = false
      }, 5000)
      return
    }
    pendingConfirmRef.current = false
    handleAIMove()
  })

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={handleClick}
        size="sm"
        className="bg-b-primary hover:bg-b-primary-hover p-1 h-8 transition-colors duration-200"
        title="AI 智能分类视频到对应收藏夹（会消耗较多 Token）"
      >
        🤖 AI 整理
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs flex items-center justify-center cursor-pointer transition-colors duration-200"
              onClick={(event) => {
                event.stopPropagation()
              }}
              aria-label="帮助说明"
            >
              ?
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm">
            <p className="text-gray-700">
              大模型根据视频标题与收藏夹名称自动进行智能整理，比较消耗 Token。
            </p>
          </PopoverContent>
        </Popover>
      </Button>

      {isLoadingElement}
    </div>
  )
}

export default AIMove
