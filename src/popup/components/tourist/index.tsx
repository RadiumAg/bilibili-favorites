import React from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTourist } from './use-tourist'
import { ChevronLeft, ChevronRight, X, FolderHeart, Star, Tag, Gamepad2 } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'

type TourStep = {
  target: string
  title: string
  icon: React.ReactNode
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const STEP_ICON_CLASS = 'w-4 h-4 text-[#BF00FF] flex-shrink-0'

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="favorites"]',
    title: '收藏夹列表',
    icon: <FolderHeart className={STEP_ICON_CLASS} />,
    description: '点击选中收藏夹，即可查看该收藏夹下的分类关键字。',
    placement: 'bottom',
  },
  {
    target: '[data-tour="favorites"] [data-id]',
    title: '设置默认收藏夹',
    icon: <Star className={STEP_ICON_CLASS} />,
    description:
      '长按收藏夹可标记为默认文件夹（显示星标）。点击「关键字整理」后，会将该文件夹中的视频自动分类到匹配关键字的收藏夹中。',
    placement: 'bottom',
  },
  {
    target: '[data-tour="keywords"]',
    title: '关键字过滤',
    icon: <Tag className={STEP_ICON_CLASS} />,
    description: '设置关键字后，可以快速筛选出包含特定关键词的视频，支持添加多个关键字。',
    placement: 'top',
  },
  {
    target: '[data-tour="actions"]',
    title: '智能操作',
    icon: <Gamepad2 className={STEP_ICON_CLASS} />,
    description: '批量移动视频、AI 智能分类、自动生成关键字等功能，让收藏夹管理变得轻松有趣！',
    placement: 'top',
  },
]

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

type TouristRef = {
  resetTourist: () => void
}

interface TouristProps {
  ref?: React.RefObject<TouristRef | null>
}

const Tourist: React.FC<TouristProps> = (props) => {
  const { ref } = props
  const {
    isVisible,
    currentStep,
    totalSteps,
    resetTourist,
    nextStep,
    prevStep,
    skipTourist,
    completeTourist,
  } = useTourist()
  const [targetRect, setTargetRect] = React.useState<TargetRect | null>(null)
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 })

  const currentStepData = TOUR_STEPS[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  const updatePosition = useMemoizedFn(() => {
    if (!currentStepData) return

    const targetElement = document.querySelector(currentStepData.target)
    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    const padding = 4

    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })

    const popoverWidth = 280
    const popoverHeight = 160
    const gap = 12

    let top = 0
    let left = 0

    switch (currentStepData.placement) {
      case 'top':
        top = rect.top - popoverHeight - gap
        left = rect.left + rect.width / 2 - popoverWidth / 2
        break
      case 'bottom':
        top = rect.bottom + gap
        left = rect.left + rect.width / 2 - popoverWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - popoverHeight / 2
        left = rect.left - popoverWidth - gap
        break
      case 'right':
        top = rect.top + rect.height / 2 - popoverHeight / 2
        left = rect.right + gap
        break
      default:
        top = rect.bottom + gap
        left = rect.left + rect.width / 2 - popoverWidth / 2
    }

    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8))
    top = Math.max(8, Math.min(top, window.innerHeight - popoverHeight - 8))

    setPopoverPosition({ top, left })
  })

  React.useEffect(() => {
    if (!isVisible) return

    updatePosition()

    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible, currentStep, updatePosition])

  React.useImperativeHandle(ref, () => {
    return {
      resetTourist,
    }
  })

  if (!isVisible || !currentStepData) {
    return null
  }

  const tourContent = (
    <div className="fixed inset-0 z-50">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#tour-mask)"
        />
      </svg>

      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-[#BF00FF] ring-offset-2 pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: '0 0 0 4px rgba(191, 0, 255, 0.15), 0 0 20px rgba(191, 0, 255, 0.1)',
          }}
        />
      )}

      <div
        className="absolute w-[280px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#BF00FF]/10"
        style={{
          top: popoverPosition.top,
          left: popoverPosition.left,
        }}
      >
        <div className="h-1.5 bg-gray-100/80">
          <div
            className="h-full bg-gradient-to-r from-[#BF00FF] to-[#FF1493] transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={skipTourist}
          className="absolute top-2.5 right-2.5 w-8 h-8 p-0 rounded-full hover:bg-[#BF00FF]/10 transition-colors duration-200 text-gray-400 hover:text-[#BF00FF] cursor-pointer"
          title="跳过引导"
          aria-label="跳过引导"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>

        <div className="p-4 pb-3">
          <div className="flex items-center gap-2 mb-2 pr-6">
            <div className="w-7 h-7 rounded-lg bg-[#BF00FF]/10 flex items-center justify-center flex-shrink-0">
              {currentStepData.icon}
            </div>
            <h3 className="text-sm font-bold text-gray-800">{currentStepData.title}</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed pl-9">
            {currentStepData.description}
          </p>
        </div>

        <div className="flex items-center justify-between px-4 pb-3.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === currentStep
                    ? 'w-5 bg-gradient-to-r from-[#BF00FF] to-[#FF1493]'
                    : index < currentStep
                      ? 'w-1.5 bg-[#BF00FF]/40'
                      : 'w-1.5 bg-gray-200',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="h-7 px-2 text-xs text-gray-500 hover:text-[#BF00FF] hover:bg-[#BF00FF]/10 transition-colors duration-200 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3 mr-0.5" aria-hidden="true" />
                上一步
              </Button>
            )}

            <Button
              size="sm"
              onClick={isLastStep ? completeTourist : nextStep}
              className="h-7 px-3 text-xs bg-gradient-to-r from-[#BF00FF] to-[#FF1493] hover:from-[#A000D9] hover:to-[#E0127F] text-white shadow-md shadow-[#BF00FF]/25 transition-all duration-200 cursor-pointer"
            >
              {isLastStep ? (
                '完成'
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-3 h-3 ml-0.5" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(tourContent, document.body)
}

export default Tourist
export { useTourist } from './use-tourist'
export type { TouristRef }
