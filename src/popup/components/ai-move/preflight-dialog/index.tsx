import React from 'react'
import { Sparkles, Star } from 'lucide-react'
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

type PreflightDialogKind = 'missing-default' | 'no-tags'

type PreflightDialogProps = {
  kind: PreflightDialogKind | null
  onCancel: () => void
  onPrimary: () => void
}

const CONTENT: Record<PreflightDialogKind, { title: string; description: string; primaryLabel: string }> = {
  'missing-default': {
    title: '先设置默认收藏夹',
    description: '智能整理会处理默认收藏夹中的视频。在收藏夹标签上点击星标即可设置。',
    primaryLabel: '去设置',
  },
  'no-tags': {
    title: '本次将全部由 AI 分析',
    description: '还没有标签。本次整理完成后，可以把确认过的归类沉淀为标签，下次更快、更省配额。',
    primaryLabel: '开始整理',
  },
}

const PreflightDialog: React.FC<PreflightDialogProps> = ({ kind, onCancel, onPrimary }) => {
  if (kind == null) return null

  const content = CONTENT[kind]
  const Icon = kind === 'missing-default' ? Star : Sparkles

  return (
    <AlertDialog open={true}>
      <AlertDialogContent
        className="max-w-sm gap-3 motion-reduce:animate-none"
        onEscapeKeyDown={onCancel}
      >
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
