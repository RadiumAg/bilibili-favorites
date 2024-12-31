import React from 'react'

import { Button } from '@/components/ui/button'
import { useMove } from '@/popup/hooks/use-move'

const Move: React.FC = () => {
  const { handleMove, isLoading } = useMove()

  return (
    <div className="mt-2">
      <Button
        onClick={handleMove}
        size="sm"
        className=" bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
      >
        move
      </Button>

      {isLoading && (
        <div className="fixed w-full h-full bg-b-primary top-0 left-0  bg-opacity-20"></div>
      )}
    </div>
  )
}

export default Move
