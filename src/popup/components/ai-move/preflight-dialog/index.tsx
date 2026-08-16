import React from 'react'
import { AlertCircle, Sparkles, Star } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type PreflightDialogKind = 'missing-default' | 'no-tags' | 'quota-empty' | 'quota-warning'

type PreflightDialogProps = {
  kind: PreflightDialogKind | null
  aiVideoCount?: number
  remainingQuota?: number
  onCancel: () => void
  onPrimary: () => void
  onContinue?: () => void
}

const CONTENT: Record<
  Exclude<PreflightDialogKind, 'quota-warning'>,
  { title: string; description: string; primaryLabel: string }
> = {
  'missing-default': {
    title: '先设置默认收藏夹',
    description: '智能整理会处理默认收藏夹中的视频。在收藏夹标签上点击星标即可设置。',
    primaryLabel: '去设置',
  },
  'no-tags': {
    title: '本次将全部由 AI 分析',
    description:
      '还没有标签。本次整理完成后，可以把确认过的归类沉淀为标签，下次更快、更省配额。',
    primaryLabel: '开始整理',
  },
  'quota-empty': {
    title: '免费配额不足',
    description: '今日免费额度已用完。可明天再试，或配置自己的 AI 服务。',
    primaryLabel: '配置自己的 AI',
  },
}

const PreflightDialog: React.FC<PreflightDialogProps> = ({
  kind,
  aiVideoCount = 0,
  remainingQuota = 0,
  onCancel,
  onPrimary,
  onContinue,
}) => {
  if (kind == null) return null

  const isWarning = kind === 'quota-warning'
  const content = isWarning
    ? {
        title: '本次配额可能不足',
        description: `预计需 AI 处理 ${aiVideoCount} 个视频，当前剩余 ${remainingQuota} 次请求。可继续尝试，或先配置自己的 AI。`,
        primaryLabel: '配置自己的 AI',
      }
    : CONTENT[kind]
  const Icon = kind === 'missing-default' ? Star : isWarning || kind === 'quota-empty' ? AlertCircle : Sparkles

  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-sm gap-3 motion-reduce:animate-none">
        <AlertDialogHeader className="text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF00FF]/10 text-[#A000D9]">
            <Icon className="h-5 w-5" aria-hidden={true} />
          </span>
          <AlertDialogTitle className="text-sm font-semibold text-gray-900">
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-5 text-gray-600">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="min-h-11">
            取消
          </AlertDialogCancel>
          {isWarning && onContinue && (
            <AlertDialogAction
              onClick={onContinue}
              className="min-h-11 border border-[#BF00FF]/25 bg-white text-[#A000D9] hover:bg-[#BF00FF]/5"
            >
              继续整理
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={onPrimary}
            className="min-h-11 bg-[#BF00FF] text-white hover:bg-[#A000D9]"
          >
            {content.primaryLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PreflightDialog
export type { PreflightDialogKind }
