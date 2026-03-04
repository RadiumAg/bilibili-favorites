import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'

type QuotaInfo = {
  daily: {
    limit: number
    used: number
    remaining: number
  }
  monthly: {
    limit: number
    used: number
    remaining: number
  }
  rpm: {
    limit: number
    used: number
    remaining: number
  }
}

interface QuotaCardProps {
  quotaInfo: QuotaInfo
  lastCheckTime: string
}

export const QuotaCard: React.FC<QuotaCardProps> = ({ quotaInfo, lastCheckTime }) => {
  const dailyUsagePercent =
    quotaInfo.daily.limit > 0 ? (quotaInfo.daily.used / quotaInfo.daily.limit) * 100 : 0
  const rpmUsagePercent =
    quotaInfo.rpm.limit > 0 ? (quotaInfo.rpm.used / quotaInfo.rpm.limit) * 100 : 0

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          配额使用情况
          {lastCheckTime && (
            <span className="text-sm font-normal text-muted-foreground">
              (最后更新: {lastCheckTime})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 日配额 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">今日请求配额</span>
            <span
              className={`text-sm ${
                quotaInfo.daily.remaining > quotaInfo.daily.limit * 0.2
                  ? 'text-green-600'
                  : quotaInfo.daily.remaining > 0
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {quotaInfo.daily.remaining}/{quotaInfo.daily.limit} 次请求
            </span>
          </div>
          <Progress value={dailyUsagePercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>已使用: {quotaInfo.daily.used} 次</span>
            <span>剩余: {quotaInfo.daily.remaining} 次</span>
          </div>
        </div>

        {/* RPM 限制 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">请求频率限制</span>
            <span className="text-sm text-muted-foreground">
              {quotaInfo.rpm.remaining}/{quotaInfo.rpm.limit} RPM
            </span>
          </div>
          <Progress value={rpmUsagePercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>限制: {quotaInfo.rpm.limit} 次/分钟</span>
            <span>当前可用: {quotaInfo.rpm.remaining} 次/分钟</span>
          </div>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">服务正常</span>
          </div>
          {quotaInfo.daily.remaining === 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">今日配额已用完</span>
            </div>
          )}
          {quotaInfo.daily.remaining > 0 &&
            quotaInfo.daily.remaining < quotaInfo.daily.limit * 0.2 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">配额即将用完</span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
