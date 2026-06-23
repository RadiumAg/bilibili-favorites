import React from 'react'
import { Button } from '@/components/ui/button'
import { useCreateKeyword } from '@/hooks/use-create-keyword'
import KeywordModeSelector from '@/components/keyword-mode-selector'
import loadingImg from '@/assets/loading.gif'

const OperateButton: React.FC = () => {
  const { isLoading, progress, currentMode, handleCreate, setCurrentMode, cancelCreate } =
    useCreateKeyword({
      mode: 'local',
    })

  const loadingElement = isLoading && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 flex flex-col items-center">
        <img alt="loading-img" className="w-24 h-24 mb-4" src={loadingImg} />
        {progress.total > 0 ? (
          <>
            <p className="text-lg font-semibold mb-2">
              正在分析第 {progress.current}/{progress.total} 个收藏夹
            </p>
            {progress.currentTitle && (
              <p
                className="text-sm text-[#61666D] mb-1 max-w-xs truncate"
                title={progress.currentTitle}
              >
                收藏夹：{progress.currentTitle}
              </p>
            )}
            {progress.phase === 'loading' && progress.videoTotal > 0 && (
              <p className="text-sm text-[#61666D] mb-1">
                正在加载视频 {progress.videoLoaded}/{progress.videoTotal}
              </p>
            )}
            {progress.phase === 'analyzing' && progress.videoTotal > 0 && (
              <p className="text-sm text-[#61666D] mb-1">
                正在分析 {progress.videoTotal} 个视频标题
              </p>
            )}
            {progress.currentVideoTitle && (
              <p
                className="text-xs text-[#9499A0] mb-1 max-w-xs truncate"
                title={progress.currentVideoTitle}
              >
                当前视频：{progress.currentVideoTitle}
              </p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-1">
              <div
                className="bg-b-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    progress.phase === 'loading' && progress.videoTotal > 0
                      ? (progress.videoLoaded / progress.videoTotal) * 100
                      : (progress.current / progress.total) * 100
                  }%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-lg font-semibold mb-2">正在准备...</p>
        )}
        <Button onClick={cancelCreate} size="sm" variant="outline" className="mt-4">
          取消
        </Button>
      </div>
    </div>
  )

  return (
    <>
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
      </div>
      {loadingElement}
    </>
  )
}

export default OperateButton
