import { PetMessageEnum, type PetFavStats } from '@/utils/pet-message'
import { fetchPetFavStats } from '@/utils/pet-stats'
import { sendMessageToTab, tabUrlPattern } from '@/utils/tab'

async function queryStatsFromBilibiliTab(): Promise<PetFavStats | null> {
  const tabs = await chrome.tabs.query({ url: tabUrlPattern })
  const tab = tabs.find((item) => item.id != null)
  if (!tab?.id) return null

  try {
    return await sendMessageToTab<PetFavStats | null>(tab.id, {
      type: PetMessageEnum.internalGetFavStats,
    })
  } catch {
    return null
  }
}

async function queryStatsFromStorage(): Promise<PetFavStats | null> {
  const data = await chrome.storage.local.get(['cookie', 'defaultFavoriteId'])
  return fetchPetFavStats(data.cookie as string | undefined, data.defaultFavoriteId as number | undefined)
}

async function resolvePetFavStats(): Promise<PetFavStats | null> {
  const fromTab = await queryStatsFromBilibiliTab()
  if (fromTab) return fromTab
  return queryStatsFromStorage()
}

/** 注册桌宠相关的 background 消息处理 */
export function setupPetMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message?.type) {
      case PetMessageEnum.getFavStats: {
        void resolvePetFavStats().then((stats) => sendResponse(stats))
        return true
      }
      case PetMessageEnum.getDefaultFavCount: {
        void resolvePetFavStats().then((stats) => sendResponse({ count: stats?.defaultCount ?? 0 }))
        return true
      }
      default:
        return false
    }
  })
}
