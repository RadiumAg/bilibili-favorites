import { FC, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTourist } from './use-tourist'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type TourStep = {
  target: string
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="favorites"]',
    title: '📁 收藏夹列表',
    description: '点击选中收藏夹，即可查看该收藏夹下的分类关键字。',
    placement: 'bottom',
  },
  {
    target: '[data-tour="favorites"] [data-id]',
    title: '⭐ 设置默认收藏夹',
    description:
      '长按收藏夹可标记为默认文件夹（显示星标）。点击「关键字整理」后，会将该文件夹中的视频自动分类到匹配关键字的收藏夹中。',
    placement: 'bottom',
  },
  {
    target: '[data-tour="keywords"]',
    title: '🏷️ 关键字过滤',
    description: '设置关键字后，可以快速筛选出包含特定关键词的视频，支持添加多个关键字。',
    placement: 'top',
  },
  {
    target: '[data-tour="actions"]',
    title: '🎮 智能操作',
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

const Tourist: FC = () => {
  const { isVisible, currentStep, totalSteps, nextStep, prevStep, skipTourist, completeTourist } =
    useTourist()
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })

  const currentStepData = TOUR_STEPS[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  const updatePosition = useCallback(() => {
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
  }, [currentStepData])

  useEffect(() => {
    if (!isVisible) return

    updatePosition()

    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible, currentStep, updatePosition])

  if (!isVisible || !currentStepData) {
    return null
  }

  const tourContent = (
    <div className="fixed inset-0 z-[9999]">
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
          }}
        />
      )}

      <div
        className="absolute w-[280px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: popoverPosition.top,
          left: popoverPosition.left,
        }}
      >
        <div className="h-1 bg-gray-100">
          <div
            className={cn(
              'h-full bg-gradient-to-r from-[#BF00FF] to-[#FF1493] transition-all duration-300',
              currentStep === 0 && 'w-1/4',
              currentStep === 1 && 'w-2/4',
              currentStep === 2 && 'w-3/4',
              currentStep === 3 && 'w-full',
            )}
          />
        </div>

        <button
          onClick={skipTourist}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          title="跳过引导"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 pr-6">{currentStepData.title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{currentStepData.description}</p>
        </div>

        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  index === currentStep ? 'w-4 bg-[#BF00FF]' : 'bg-gray-200',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-3 h-3 mr-0.5" />
                上一步
              </Button>
            )}

            <Button
              size="sm"
              onClick={isLastStep ? completeTourist : nextStep}
              className="h-7 px-3 text-xs bg-gradient-to-r from-[#BF00FF] to-[#FF1493] hover:from-[#A000D9] hover:to-[#E0127F] text-white"
            >
              {isLastStep ? (
                '完成'
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-3 h-3 ml-0.5" />
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
