import { FC } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useQuotaManagement } from '@/hooks/use-quota'

interface QuotaIndicatorProps {
  showDetails?: boolean
  compact?: boolean
}

const QuotaIndicator: FC<QuotaIndicatorProps> = (props) => {
  const { showDetails = true, compact = false } = props
  const { usage, remaining, percentage, hasQuota, shouldWarn, loading } = useQuotaManagement()

  if (loading || !usage) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  // 获取状态颜色和图标
  const getStatusColor = () => {
    if (!hasQuota) return 'text-red-500'
    if (shouldWarn) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!hasQuota) return <XCircle className="w-4 h-4" />
    if (shouldWarn) return <AlertCircle className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  const getProgressColor = () => {
    if (!hasQuota) return 'bg-red-500'
    if (shouldWarn) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 紧凑模式
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span className="text-sm font-medium">
          {remaining}/{usage.limit}
        </span>
      </div>
    )
  }

  // 完整模式
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">AI 调用配额</CardTitle>
          <Badge variant={hasQuota ? 'default' : 'destructive'}>
            {hasQuota ? '可用' : '已用完'}
          </Badge>
        </div>
        <CardDescription className="text-xs">今日剩余调用次数</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 配额数字 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={getStatusColor()}>{getStatusIcon()}</span>
              <span className="text-2xl font-bold">{remaining}</span>
              <span className="text-sm text-gray-500">/ {usage.limit}</span>
            </div>
            <span className="text-sm text-gray-500">{percentage.toFixed(0)}% 已使用</span>
          </div>

          {/* 进度条 */}
          <Progress value={percentage} className="h-2" indicatorClassName={getProgressColor()} />

          {/* 详细信息 */}
          {showDetails && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>已使用：</span>
                <span className="font-medium">{usage.used} 次</span>
              </div>
              <div className="flex justify-between">
                <span>重置时间：</span>
                <span className="font-medium">明天 00:00</span>
              </div>
            </div>
          )}

          {/* 警告提示 */}
          {shouldWarn && hasQuota && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <p className="text-xs text-yellow-700">配额即将用完，请合理使用</p>
            </div>
          )}

          {!hasQuota && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-md">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-xs text-red-700">今日配额已用完，明天 00:00 自动重置</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuotaIndicator
