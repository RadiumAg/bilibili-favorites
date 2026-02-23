import React from 'react'
import {
  getQuotaUsage,
  hasQuota,
  getRemainingQuota,
  useQuota,
  shouldWarn,
  getQuotaPercentage,
  resetQuota,
  setQuotaConfig,
  getQuotaConfig,
  type QuotaUsage,
  type QuotaConfig,
} from '@/utils/quota'

type UseQuotaReturn = {
  usage: QuotaUsage | null
  config: QuotaConfig | null
  remaining: number
  percentage: number
  hasQuota: boolean
  shouldWarn: boolean
  loading: boolean
  useQuota: () => Promise<boolean>
  refreshUsage: () => Promise<void>
  resetQuota: () => Promise<void>
  updateConfig: (config: QuotaConfig) => Promise<void>
}

/**
 * AI API 配额管理 Hook
 */
export const useQuotaManagement = (): UseQuotaReturn => {
  const [usage, setUsage] = React.useState<QuotaUsage | null>(null)
  const [config, setConfig] = React.useState<QuotaConfig | null>(null)
  const [remaining, setRemaining] = React.useState<number>(0)
  const [percentage, setPercentage] = React.useState<number>(0)
  const [hasQuotaAvailable, setHasQuotaAvailable] = React.useState<boolean>(true)
  const [showWarning, setShowWarning] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)

  // 刷新配额使用情况
  const refreshUsage = React.useCallback(async () => {
    setLoading(true)
    try {
      const [usageData, configData, remainingData, percentageData, hasQuotaData, shouldWarnData] =
        await Promise.all([
          getQuotaUsage(),
          getQuotaConfig(),
          getRemainingQuota(),
          getQuotaPercentage(),
          hasQuota(),
          shouldWarn(),
        ])

      setUsage(usageData)
      setConfig(configData)
      setRemaining(remainingData)
      setPercentage(percentageData)
      setHasQuotaAvailable(hasQuotaData)
      setShowWarning(shouldWarnData)
    } catch (error) {
      console.error('Failed to refresh quota usage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 使用配额
  const handleUseQuota = React.useCallback(async (): Promise<boolean> => {
    const success = await useQuota()
    if (success) {
      await refreshUsage()
    }
    return success
  }, [refreshUsage])

  // 重置配额
  const handleResetQuota = React.useCallback(async (): Promise<void> => {
    await resetQuota()
    await refreshUsage()
  }, [refreshUsage])

  // 更新配置
  const handleUpdateConfig = React.useCallback(
    async (newConfig: QuotaConfig): Promise<void> => {
      await setQuotaConfig(newConfig)
      await refreshUsage()
    },
    [refreshUsage],
  )

  // 初始化和监听存储变化
  React.useEffect(() => {
    refreshUsage()

    // 监听 Chrome Storage 变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.ai_quota_usage || changes.aiQuotaConfig) {
        refreshUsage()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    // 每分钟检查一次是否需要重置（跨天）
    const intervalId = setInterval(() => {
      refreshUsage()
    }, 60 * 1000) // 每分钟检查一次

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
      clearInterval(intervalId)
    }
  }, [refreshUsage])

  return {
    usage,
    config,
    remaining,
    percentage,
    hasQuota: hasQuotaAvailable,
    shouldWarn: showWarning,
    loading,
    useQuota: handleUseQuota,
    refreshUsage,
    resetQuota: handleResetQuota,
    updateConfig: handleUpdateConfig,
  }
}
