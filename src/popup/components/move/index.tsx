import React from 'react'
import { Button } from '@/components/ui/button'
import { DataContext } from '@/popup/utils/data-context'

const Move: React.FC = () => {
  const dataContext = React.use(DataContext)

  return (
    <div className="mt-2">
      <Button size="sm" className=" bg-b-primary hover:bg-b-primary hover:bg-opacity-50 p-1 h-6">
        move
      </Button>

      {/* <div className="fixed w-full h-full bg-b-primary top-0 left-0  bg-opacity-20"></div> */}
    </div>
  )
}

export default Move
