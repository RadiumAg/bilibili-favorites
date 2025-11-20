import React from 'react'
import { useEditKeyword } from '@/hooks'
import classNames from 'classnames'
import { ScrollArea } from '@/components/ui/scroll-area'

type KeywordProps = React.PropsWithChildren<{
  className?: string
}>

const Keyword: React.FC<KeywordProps> = (props) => {
  const { className } = props
  const { tagElementArray, handleKeyDown } = useEditKeyword()

  return (
    <ScrollArea
      className={classNames('h-44 border-solid border-cyan-200 border-2 rounded-sm', className)}
    >
      <div className="flex flex-wrap p-1 items-start content-start gap-1 overflow-auto rounded-sm">
        {tagElementArray}

        <input
          className="outline-none bg-transparent p-1  text-b-text-primary"
          onKeyDown={handleKeyDown}
        />
      </div>
    </ScrollArea>
  )
}

export default Keyword
