import { getAllFavoriteFlag } from '@/utils/api'
import type { PetFavStats } from '@/utils/pet-message'

function buildStats(
  list: Array<{ id: number; media_count: number }>,
  defaultFavoriteId?: number,
): PetFavStats {
  const total = list.reduce((sum, item) => sum + item.media_count, 0)
  const defaultFav = defaultFavoriteId != null ? list.find((f) => f.id === defaultFavoriteId) : undefined
  const defaultCount = defaultFav?.media_count ?? 0

  return { total, defaultCount, count: defaultCount }
}

/** 从 cookie 获取桌宠所需的收藏夹统计 */
export async function fetchPetFavStats(
  cookie: string | undefined,
  defaultFavoriteId?: number,
): Promise<PetFavStats | null> {
  if (!cookie) return null

  try {
    const res = await getAllFavoriteFlag(cookie)
    const list = res?.data?.list
    if (!list) return null
    return buildStats(list, defaultFavoriteId)
  } catch {
    return null
  }
}

/** 获取默认收藏夹视频数量 */
export async function fetchPetDefaultFavCount(
  cookie: string | undefined,
  defaultFavoriteId?: number,
): Promise<number | null> {
  const stats = await fetchPetFavStats(cookie, defaultFavoriteId)
  return stats?.defaultCount ?? null
}

/** 从 chrome.storage 读取 defaultFavoriteId */
export function getStoredDefaultFavoriteId(): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      chrome?.storage?.local?.get(['defaultFavoriteId'], (result) => {
        resolve(result.defaultFavoriteId as number | undefined)
      })
    } catch {
      resolve(undefined)
    }
  })
}
