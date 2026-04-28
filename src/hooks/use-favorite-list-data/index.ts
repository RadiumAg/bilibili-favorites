import { fetchAllFavoriteMedias, type FavoriteMedia } from '@/utils/api'

const CACHE_PREFIX = 'fav-list-cache:'
const CACHE_DURATION = 20 * 60 * 1000 // 20 分钟

/**
 * 请求去重：同一 mediaId 的并发请求共享同一个 Promise
 */
const pendingRequests = new Map<string, Promise<FavoriteMedia[]>>()

type CacheEntry = {
  data: FavoriteMedia[]
  timestamp: number
}

const getCachedData = (mediaId: string): FavoriteMedia[] | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${mediaId}`)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_PREFIX}${mediaId}`)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

const setCachedData = (mediaId: string, data: FavoriteMedia[]) => {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() }
    localStorage.setItem(`${CACHE_PREFIX}${mediaId}`, JSON.stringify(entry))
  } catch {
    // localStorage 满了或其他异常，静默忽略
  }
}

/**
 * 收藏夹视频列表数据 Hook
 * 在 fetchAllFavoriteMedias 基础上增加 localStorage 本地缓存 + 请求去重
 */
const useFavoriteListData = () => {
  /**
   * 获取收藏夹视频列表（带缓存）
   * @param mediaId 收藏夹 ID
   * @param pageSize 每页数量
   * @param expireTime IndexedDB 缓存过期时间（localStorage 缓存独立于此参数）
   */
  const fetchWithCache = async (
    mediaId: string,
    pageSize?: number,
    expireTime?: number,
  ): Promise<FavoriteMedia[]> => {
    // 1. 检查 localStorage 缓存
    const cached = getCachedData(mediaId)
    if (cached) return cached

    // 2. 请求去重：复用同一 mediaId 的进行中请求
    if (pendingRequests.has(mediaId)) {
      return pendingRequests.get(mediaId)!
    }

    // 3. 发起新请求
    const request = fetchAllFavoriteMedias(mediaId, pageSize, expireTime || 0)
      .then((data) => {
        setCachedData(mediaId, data)
        pendingRequests.delete(mediaId)
        return data
      })
      .catch((error) => {
        pendingRequests.delete(mediaId)
        throw error
      })

    pendingRequests.set(mediaId, request)
    return request
  }

  /**
   * 将视频从源收藏夹缓存移动到目标收藏夹缓存（同步更新，不发起新请求）
   * @param srcMediaId 源收藏夹 ID
   * @param tarMediaId 目标收藏夹 ID
   * @param videoIds 要移动的视频 ID 列表
   */
  const moveVideosCache = (srcMediaId: string, tarMediaId: string, videoIds: number[]) => {
    const srcCached = getCachedData(srcMediaId)
    if (!srcCached) return

    const idSet = new Set(videoIds)
    const movedMedias = srcCached.filter((m) => idSet.has(m.id))
    if (movedMedias.length === 0) return

    // 从源收藏夹缓存中移除
    setCachedData(
      srcMediaId,
      srcCached.filter((m) => !idSet.has(m.id)),
    )

    // 添加到目标收藏夹缓存（若目标缓存存在则追加，否则不创建）
    const tarCached = getCachedData(tarMediaId)
    if (tarCached) {
      const existingIds = new Set(tarCached.map((m) => m.id))
      const newMedias = movedMedias.filter((m) => !existingIds.has(m.id))
      setCachedData(tarMediaId, [...tarCached, ...newMedias])
    }
  }

  /**
   * 清除缓存
   * @param mediaId 指定收藏夹 ID，不传则清除全部
   */
  const invalidateCache = (mediaId?: string) => {
    if (mediaId) {
      localStorage.removeItem(`${CACHE_PREFIX}${mediaId}`)
    } else {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    }
  }

  return { fetchWithCache, moveVideosCache, invalidateCache }
}

export { useFavoriteListData }
