import React from 'react'
import { Button } from '@/components/ui/button'
import { useMove } from '@/hooks/use-move'

const Move: React.FC = () => {
  const { handleMove, isLoadingElement } = useMove()

  return (
    <div>
      <Button
        onClick={handleMove}
        size="sm"
        className=" bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
      >
        开始整理
      </Button>

      {isLoadingElement}
    </div>
  )
}

export default Move
