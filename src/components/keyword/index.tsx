import React from 'react'
import { useEditKeyword } from '@/hooks'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

type KeywordProps = React.PropsWithChildren<{
  className?: string
}>

const Keyword: React.FC<KeywordProps> = (props) => {
  const { className } = props
  const { tagElementArray, handleKeyDown } = useEditKeyword()

  return (
    <ScrollArea className={cn('h-44 border-solid border-cyan-200 border-2 rounded-sm', className)}>
      <div className="flex flex-wrap p-1 items-start content-start gap-1 overflow-auto rounded-sm">
        {tagElementArray}

        <input
          placeholder="关键字/回车输入/退格删除"
          className="outline-none bg-transparent p-1 text-ellipsis overflow-hidden  text-b-text-primary min-w-3 flex-1"
          onKeyDown={handleKeyDown}
        />
      </div>
    </ScrollArea>
  )
}

export default Keyword
