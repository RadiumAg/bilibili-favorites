import React from 'react'
import loadingGif from '@/assets/loading.gif'
import type { FetchProgress } from '@/options/components/analysis/use-analysis-data'

type AnalysisLoadingOverlayProps = {
  loading: boolean
  fetchProgress?: FetchProgress
  /** overlay=遮罩模式（绝对定位覆盖），fullscreen=全屏居中模式 */
  mode?: 'overlay' | 'fullscreen'
  /** 全屏模式下的自定义提示文案 */
  tip?: string
}

/**
 * 分析数据加载中遮罩/全屏 loading 组件
 * - overlay 模式：绝对定位覆盖父容器，毛玻璃背景
 * - fullscreen 模式：整页居中，适合替代整个页面内容
 */
const AnalysisLoadingOverlay: React.FC<AnalysisLoadingOverlayProps> = ({
  loading,
  fetchProgress,
  mode = 'overlay',
  tip,
}) => {
  if (!loading) return null

  const progressText = fetchProgress
    ? `正在分析第 ${fetchProgress.current}/${fetchProgress.total} 个收藏夹`
    : (tip ?? '正在加载收藏夹数据...')

  const content = (
    <div className="flex flex-col items-center gap-4">
      <img alt="loading" src={loadingGif} className="w-24 h-24" />
      <div className="text-center">
        <p className="text-sm font-medium text-[#18191C]">{progressText}</p>
        {fetchProgress && (
          <p className="text-xs text-[#61666D] mt-1 max-w-[200px] truncate">
            {fetchProgress.currentTitle}
          </p>
        )}
      </div>
    </div>
  )
  if (mode === 'fullscreen') {
    return React.cloneElement(content, {
      className: 'flex flex-col items-center justify-center gap-4 h-[700px]',
    })
  }

  return (
    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
      {content}
    </div>
  )
}

export { AnalysisLoadingOverlay }
