import React from 'react'
import { Button } from '@/components/ui/button'
import loadingGif from '@/assets/loading.gif'
import { useMove } from '@/hooks/use-move'

const Move: React.FC = () => {
  const { handleMove, isLoading } = useMove()

  return (
    <div>
      <Button
        onClick={handleMove}
        size="sm"
        className=" bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6"
      >
        移动
      </Button>

      {isLoading && (
        <div className="fixed flex w-full h-full bg-white top-0 left-0 bg-opacity-70 items-center justify-center">
          <img src={loadingGif} />
        </div>
      )}
    </div>
  )
}

export default Move
