import React from 'react'
import { Button } from '@/components/ui/button'
import { useCreateKeyword } from '@/hooks/use-create-keyword'
import KeywordModeSelector from '@/components/keyword-mode-selector'
import loadingImg from '@/assets/loading.gif'

const OperateButton: React.FC = () => {
  const { handleCreate, isLoading, currentMode, setCurrentMode, cancelCreate } = useCreateKeyword({
    mode: 'local', // 默认使用本地算法
  })

  const loadingElement = isLoading && (
    <div className="absolute w-full h-full top-0 left-0 bg-white bg-opacity-55 z-[999]">
      <div className="left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] absolute flex flex-col items-center">
        <img alt="loading-img" className="mt-[-51px]" src={loadingImg} />
        <Button onClick={cancelCreate} size="sm" variant="outline">
          取消
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-2">
      <KeywordModeSelector value={currentMode} onChange={setCurrentMode} disabled={isLoading} />

      <Button
        className="mr-2"
        onClick={() => handleCreate('all', currentMode)}
        size="sm"
        disabled={isLoading}
      >
        为所有创建
      </Button>

      <Button onClick={() => handleCreate('select', currentMode)} size="sm" disabled={isLoading}>
        为选中创建
      </Button>
      {loadingElement}
    </div>
  )
}

export default OperateButton
