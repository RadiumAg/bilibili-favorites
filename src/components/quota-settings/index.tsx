import { FC, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { useQuotaManagement } from '@/hooks/use-quota'
import { Settings, RefreshCw } from 'lucide-react'

const QuotaSettings: FC = () => {
  const { config, updateConfig, resetQuota, loading } = useQuotaManagement()
  const { toast } = useToast()

  const [dailyLimit, setDailyLimit] = useState<number>(config?.dailyLimit || 100)
  const [warningThreshold, setWarningThreshold] = useState<number>(config?.warningThreshold || 80)
  const [saving, setSaving] = useState<boolean>(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateConfig({
        dailyLimit,
        warningThreshold,
      })

      toast({
        title: '保存成功',
        description: '配额设置已更新',
      })
    } catch (error) {
      toast({
        title: '保存失败',
        description: '无法保存配额设置，请重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      await resetQuota()
      toast({
        title: '重置成功',
        description: '配额已手动重置',
      })
    } catch (error) {
      toast({
        title: '重置失败',
        description: '无法重置配额，请重试',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>配额设置</CardTitle>
        </div>
        <CardDescription>配置 AI API 每日调用限制和警告阈值</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 每日限制 */}
        <div className="space-y-2">
          <Label htmlFor="daily-limit">每日调用限制</Label>
          <div className="flex items-center gap-4">
            <Input
              id="daily-limit"
              type="number"
              min="1"
              max="10000"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-500">次/天</span>
          </div>
          <p className="text-xs text-gray-500">
            建议根据 AI 服务商的免费额度设置，避免超出限制产生费用
          </p>
        </div>

        {/* 警告阈值 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="warning-threshold">警告阈值</Label>
            <span className="text-sm font-medium">{warningThreshold}%</span>
          </div>
          <Slider
            id="warning-threshold"
            min={50}
            max={95}
            step={5}
            value={[warningThreshold]}
            onValueChange={(value: number[]) => setWarningThreshold(value[0])}
          />
          <p className="text-xs text-gray-500">当使用量达到此百分比时，系统会显示警告提示</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? '保存中...' : '保存设置'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            手动重置
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            💡 配额每天 00:00 自动重置。如需立即重置，可点击"手动重置"按钮。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuotaSettings
