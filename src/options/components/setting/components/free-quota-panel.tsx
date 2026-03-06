import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { QuotaInfo } from '../types'

interface FreeQuotaPanelProps {
  checkingQuota: boolean
  onCheckQuota: (quotaInfo: QuotaInfo | null) => void
}

export const FreeQuotaPanel: React.FC<FreeQuotaPanelProps> = ({ checkingQuota, onCheckQuota }) => {
  const checkQuota = async () => {
    try {
      const port = chrome.runtime.connect({ name: 'ai-stream' })

      port.postMessage({
        type: 'checkAIGateQuota',
      })

      port.onMessage.addListener((response) => {
        if (response.type === 'quota-result') {
          const { quotaInfo, message } = response.data
          onCheckQuota(quotaInfo)
          toast({
            variant: 'default',
            title: '配额检查成功',
            description: message,
          })
          port.disconnect()
        } else if (response.type === 'error') {
          toast({
            variant: 'destructive',
            title: '配额检查失败',
            description: response.error,
          })
          port.disconnect()
          onCheckQuota(null)
        }
      })

      setTimeout(() => {
        port.disconnect()
        toast({
          variant: 'destructive',
          title: '请求超时',
          description: '配额检查请求超时',
        })
        onCheckQuota(null)
      }, 10000)
    } catch (error) {
      console.error('配额检查失败:', error)
      toast({
        variant: 'destructive',
        title: '配额检查失败',
        description: error instanceof Error ? error.message : '未知错误',
      })
      onCheckQuota(null)
    }
  }

  return (
    <div className="pt-6 mt-6">
      <div className="flex gap-3"></div>
    </div>
  )
}
