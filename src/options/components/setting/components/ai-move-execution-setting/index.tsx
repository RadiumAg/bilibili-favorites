import React from 'react'
import { Eye, Zap } from 'lucide-react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useGlobalConfig } from '@/store/global-data'
import type { AIMoveExecutionMode } from '@/utils/data-context'

const OPTIONS: Array<{
  value: AIMoveExecutionMode
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}> = [
  {
    value: 'ask',
    title: '始终询问',
    description: '分析完成后检查并调整目标收藏夹',
    icon: Eye,
  },
  {
    value: 'auto',
    title: '自动执行',
    description: '分析完成后直接按 AI 结果移动',
    icon: Zap,
  },
]

const AIMoveExecutionSetting: React.FC = () => {
  const { executionMode, getGlobalData, setGlobalData } = useGlobalConfig(
    useShallow((state) => ({
      executionMode: state.aiConfig.aiMoveExecutionMode ?? 'ask',
      getGlobalData: state.getGlobalData,
      setGlobalData: state.setGlobalData,
    })),
  )

  const handleModeChange = useMemoizedFn((mode: AIMoveExecutionMode) => {
    const globalData = getGlobalData()
    setGlobalData({
      aiConfig: {
        ...globalData.aiConfig,
        aiMoveExecutionMode: mode,
      },
    })
  })

  return (
    <section className="rounded-xl border border-[#00AEEC]/20 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 id="ai-move-execution-title" className="text-sm font-semibold text-gray-900">
          AI 整理执行方式
        </h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">选择 AI 给出分类结果后的处理方式。</p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="ai-move-execution-title"
        className="grid gap-3 sm:grid-cols-2"
      >
        {OPTIONS.map((option) => {
          const selected = executionMode === option.value
          const Icon = option.icon

          return (
            <label
              key={option.value}
              htmlFor={`ai-move-execution-${option.value}`}
              className={cn(
                'relative min-h-20 cursor-pointer rounded-lg border p-3 text-left transition-colors duration-200',
                selected
                  ? 'border-[#00AEEC] bg-[#00AEEC]/5 shadow-sm shadow-[#00AEEC]/10'
                  : 'border-gray-200 bg-white hover:border-[#00AEEC]/40 hover:bg-[#00AEEC]/5',
              )}
            >
              <input
                id={`ai-move-execution-${option.value}`}
                type="radio"
                name="ai-move-execution-mode"
                value={option.value}
                checked={selected}
                onChange={() => handleModeChange(option.value)}
                className="peer sr-only"
              />
              <span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-[#00AEEC] peer-focus-visible:ring-offset-2" />
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    selected ? 'bg-[#00AEEC]/15 text-[#008CC1]' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden={true} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    {option.description}
                  </span>
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {executionMode === 'auto' && (
        <p className="mt-3 rounded-md bg-[#FB7299]/10 px-3 py-2 text-xs leading-5 text-[#C94F78]">
          自动执行会跳过结果确认，请先确认收藏夹名称和标签配置准确。
        </p>
      )}
    </section>
  )
}

export default AIMoveExecutionSetting
