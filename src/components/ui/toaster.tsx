import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from '@/components/ui/toast'
import { useToast } from '@/hooks'
import { cn } from '@/lib/utils'

type ToastItemProps = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  detail?: React.ReactNode
  action?: React.ReactElement
}

function ToastItem({ id, title, description, detail, action, ...props }: ToastItemProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <Toast key={id} {...props}>
      <div className="grid gap-1 flex-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
        {detail && expanded && (
          <ToastDescription className="mt-1 text-xs opacity-75">{detail}</ToastDescription>
        )}
      </div>
      {detail && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-foreground/50 transition-colors hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label={expanded ? '收起详情' : '展开详情'}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}
      {action}
      <ToastClose />
    </Toast>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
