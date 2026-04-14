import React from 'react'
import { Button } from '@/components/ui/button'
import { useMove } from '@/hooks/use-move'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const Move: React.FC = () => {
  const { handleMove, isLoadingElement } = useMove()

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={handleMove}
        size="sm"
        className="bg-b-primary hover:bg-b-primary-hover p-1 h-8 transition-colors duration-200"
      >
        通过关键字整理
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(event) => {
                event.stopPropagation()
              }}
              className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs flex items-center justify-center cursor-pointer transition-colors duration-200"
              aria-label="帮助说明"
            >
              ?
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm">
            <p className="text-gray-700">
              通过视频标题与收藏夹关键字进行匹配，将默认收藏夹中的视频自动移动到对应的收藏夹。
            </p>
          </PopoverContent>
        </Popover>
      </Button>

      {isLoadingElement}
    </div>
  )
}

export default Move
