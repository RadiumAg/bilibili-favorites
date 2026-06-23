import { queryBilibiliTabs } from '@/utils/tab'

/** 桌宠广播事件（content script 中 PetMoodEngine 监听） */
export type PetBroadcastType = 'organize_done' | 'favorite_added' | 'ai_analysis_done'

/** 桌宠 runtime 消息类型 */
export enum PetMessageEnum {
  getFavStats = 'get_fav_stats',
  getDefaultFavCount = 'get_default_fav_count',
  internalGetFavStats = 'pet:internal_get_fav_stats',
}

export type PetFavStats = {
  total: number
  defaultCount: number
  count: number
}

/** 向所有 B 站标签页广播桌宠事件 */
export function broadcastPetEvent(
  type: PetBroadcastType,
  data?: Record<string, unknown>,
): void {
  const message = { type, ...data }

  queryBilibiliTabs((tabs) => {
    for (const tab of tabs) {
      if (tab.id == null) continue
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // 标签页可能尚未注入 content script
      })
    }
  })
}

export function notifyOrganizeDone(movedCount?: number): void {
  broadcastPetEvent('organize_done', movedCount != null ? { movedCount } : undefined)
}

export function notifyAiAnalysisDone(summary?: string): void {
  broadcastPetEvent('ai_analysis_done', summary ? { summary } : undefined)
}
