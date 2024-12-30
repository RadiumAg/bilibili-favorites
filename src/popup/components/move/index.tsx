import React from 'react'

import { Button } from '@/components/ui/button'
import { DataContext } from '@/popup/utils/data-context'
import { getFavoriteList } from '@/popup/utils/api'

const Move: React.FC = () => {
  const dataContext = React.use(DataContext)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleMove = async () => {
    setIsLoading(true)
    await startMove()
    setIsLoading(false)
  }

  const startMove = async () => {
    let pageIndex = 0

    const run = async () => {
      if (dataContext.defaultFavoriteId == null) return

      const allDefaultFavoriteVideo = await getFavoriteList(
        dataContext.defaultFavoriteId?.toString(),
        pageIndex,
        20,
      )

      console.log(allDefaultFavoriteVideo)

      pageIndex += 1
      run()
    }

    run()
  }

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
