import React from 'react'
import { Button } from '@/components/ui/button'
import { useCreateKeywordByAi } from '@/hooks'

const OperateButton: React.FC = () => {
  const { handleCreate } = useCreateKeywordByAi()

  return (
    <>
      <Button className="mr-2" onClick={handleCreate.bind(null, 'all')} size="sm">
        为所有创建
      </Button>

      <Button onClick={handleCreate.bind(null, 'select')} size="sm">
        为选中创建
      </Button>
    </>
  )
}

export default OperateButton
