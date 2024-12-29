import React from 'react'
import { useEditKeyword } from '../../hooks'
import { DataContext } from '../../utils/data-context'

const Keyword: React.FC = () => {
  const { tagElementArray, handleKeyDown } = useEditKeyword()

  return (
    <>
      <div className="border-solid border-cyan-200 border-2 h-44 text-white flex flex-wrap p-1 items-start content-start gap-1 overflow-auto ">
        {tagElementArray}

        <input className=" outline-none bg-transparent p-1" onKeyDown={handleKeyDown} />
      </div>
    </>
  )
}

export default Keyword
