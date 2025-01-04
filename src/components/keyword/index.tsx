import React from 'react'
import { useEditKeyword } from '@/hooks'
import classNames from 'classnames'

type KeywordProps = React.PropsWithChildren<{
  className?: string
}>

const Keyword: React.FC<KeywordProps> = (props) => {
  const { className } = props
  const { tagElementArray, handleKeyDown } = useEditKeyword()

  return (
    <div
      className={classNames(
        'border-solid border-cyan-200 border-2 h-44  flex flex-wrap p-1 items-start content-start gap-1 overflow-auto rounded-sm',
        className,
      )}
    >
      {tagElementArray}

      <input
        className="outline-none bg-transparent p-1  text-b-text-primary"
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default Keyword
