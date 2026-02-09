/**
 * AI API 每日配额管理工具
 */

export type QuotaConfig = {
  dailyLimit: number // 每日调用次数限制
  warningThreshold: number // 警告阈值（百分比，如 80 表示 80%）
}

export type QuotaUsage = {
  date: string // 日期 YYYY-MM-DD
  used: number // 已使用次数
  limit: number // 配额限制
  lastResetTime: number // 上次重置时间戳
}

const STORAGE_KEY = 'ai_quota_usage'
const DEFAULT_DAILY_LIMIT = 100 // 默认每日 100 次

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
const getTodayDateString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * 获取今天 0 点的时间戳
 */
const getTodayStartTimestamp = (): number => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}

/**
 * 从 Chrome Storage 获取配额使用情况
 */
export const getQuotaUsage = async (): Promise<QuotaUsage> => {
  const result = await chrome.storage.local.get([STORAGE_KEY, 'aiQuotaConfig'])
  const stored = result[STORAGE_KEY] as QuotaUsage | undefined
  const config = result.aiQuotaConfig as QuotaConfig | undefined

  const today = getTodayDateString()
  const todayStart = getTodayStartTimestamp()
  const dailyLimit = config?.dailyLimit || DEFAULT_DAILY_LIMIT

  // 如果没有记录或日期不是今天，重置配额
  if (!stored || stored.date !== today) {
    const newUsage: QuotaUsage = {
      date: today,
      used: 0,
      limit: dailyLimit,
      lastResetTime: todayStart,
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: newUsage })
    return newUsage
  }

  // 更新配额限制（如果用户修改了配置）
  if (stored.limit !== dailyLimit) {
    stored.limit = dailyLimit
    await chrome.storage.local.set({ [STORAGE_KEY]: stored })
  }

  return stored
}

/**
 * 检查是否还有配额
 */
export const hasQuota = async (): Promise<boolean> => {
  const usage = await getQuotaUsage()
  return usage.used < usage.limit
}

/**
 * 获取剩余配额
 */
export const getRemainingQuota = async (): Promise<number> => {
  const usage = await getQuotaUsage()
  return Math.max(0, usage.limit - usage.used)
}

/**
 * 使用配额（调用 API 前调用）
 * @returns 是否成功使用配额
 */
export const useQuota = async (): Promise<boolean> => {
  const usage = await getQuotaUsage()

  if (usage.used >= usage.limit) {
    return false
  }

  usage.used += 1
  await chrome.storage.local.set({ [STORAGE_KEY]: usage })
  return true
}

/**
 * 检查是否需要警告（接近配额限制）
 */
export const shouldWarn = async (): Promise<boolean> => {
  const result = await chrome.storage.local.get('aiQuotaConfig')
  const config = result.aiQuotaConfig as QuotaConfig | undefined
  const warningThreshold = config?.warningThreshold || 80

  const usage = await getQuotaUsage()
  const usagePercentage = (usage.used / usage.limit) * 100

  return usagePercentage >= warningThreshold
}

/**
 * 获取配额使用百分比
 */
export const getQuotaPercentage = async (): Promise<number> => {
  const usage = await getQuotaUsage()
  return Math.min(100, (usage.used / usage.limit) * 100)
}

/**
 * 重置配额（手动重置，通常不需要调用）
 */
export const resetQuota = async (): Promise<void> => {
  const result = await chrome.storage.local.get('aiQuotaConfig')
  const config = result.aiQuotaConfig as QuotaConfig | undefined
  const dailyLimit = config?.dailyLimit || DEFAULT_DAILY_LIMIT

  const newUsage: QuotaUsage = {
    date: getTodayDateString(),
    used: 0,
    limit: dailyLimit,
    lastResetTime: getTodayStartTimestamp(),
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: newUsage })
}

/**
 * 设置配额配置
 */
export const setQuotaConfig = async (config: QuotaConfig): Promise<void> => {
  await chrome.storage.local.set({ aiQuotaConfig: config })

  // 更新当前配额限制
  const usage = await getQuotaUsage()
  usage.limit = config.dailyLimit
  await chrome.storage.local.set({ [STORAGE_KEY]: usage })
}

/**
 * 获取配额配置
 */
export const getQuotaConfig = async (): Promise<QuotaConfig> => {
  const result = await chrome.storage.local.get('aiQuotaConfig')
  return (
    result.aiQuotaConfig || {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      warningThreshold: 80,
    }
  )
}
