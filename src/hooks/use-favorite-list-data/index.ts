import { fetchAllFavoriteMedias, fetchFavoritePage, type FavoriteMedia } from '@/utils/api'

// ─── 全量缓存（现有，供分析等需要全量数据的功能使用） ────────────────────────────
const CACHE_PREFIX = 'fav-list-cache:'

// ─── 分页缓存（新，供拖拽管理等按页加载场景使用） ──────────────────────
const PAGE_CACHE_PREFIX = 'fav-page:'

const CACHE_DURATION = 20 * 60 * 1000 // 20 分钟

/**
 * 请求去重：同一 mediaId 的全量并发请求共享同一个 Promise
 */
const pendingRequests = new Map<string, Promise<FavoriteMedia[]>>()

/**
 * 请求去重：同一 mediaId+page+pageSize 的分页并发请求共享同一个 Promise
 */
const pendingPageRequests = new Map<
  string,
  Promise<{ medias: FavoriteMedia[]; hasMore: boolean }>
>()

type CacheEntry = {
  data: FavoriteMedia[]
  timestamp: number
}

type PageCacheEntry = {
  medias: FavoriteMedia[]
  hasMore: boolean
  timestamp: number
}

// ── 全量缓存辅助函数 ──────────────────────────────────────────────────────────

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

// ── 分页缓存辅助函数 ──────────────────────────────────────────────────────────

const getPageCacheKey = (mediaId: string, page: number, pageSize: number) =>
  `${PAGE_CACHE_PREFIX}${mediaId}:${page}:${pageSize}`

const getPageCachedData = (
  mediaId: string,
  page: number,
  pageSize: number,
): PageCacheEntry | null => {
  try {
    const raw = localStorage.getItem(getPageCacheKey(mediaId, page, pageSize))
    if (!raw) return null
    const entry: PageCacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getPageCacheKey(mediaId, page, pageSize))
      return null
    }
    return entry
  } catch {
    return null
  }
}

const setPageCachedData = (
  mediaId: string,
  page: number,
  pageSize: number,
  data: { medias: FavoriteMedia[]; hasMore: boolean },
) => {
  try {
    const entry: PageCacheEntry = { ...data, timestamp: Date.now() }
    localStorage.setItem(getPageCacheKey(mediaId, page, pageSize), JSON.stringify(entry))
  } catch {
    // localStorage 满了或其他异常，静默忽略
  }
}

/**
 * 收藏夹视频列表数据 Hook
 * - fetchWithCache：全量加载（带全量缓存），适用于分析、关键词提取等需要全量数据的功能
 * - fetchPageWithCache：分页加载（带分页缓存），适用于拖拽管理等按需加载场景
 */
const useFavoriteListData = () => {
  /**
   * 获取收藏夹视频列表（全量，带缓存）
   * 适用于需要全量数据的场景（如分析、关键词提取等）
   */
  const fetchWithCache = async (
    mediaId: string,
    pageSize?: number,
    expireTime?: number,
  ): Promise<FavoriteMedia[]> => {
    const cached = getCachedData(mediaId)
    if (cached) return cached

    if (pendingRequests.has(mediaId)) {
      return pendingRequests.get(mediaId)!
    }

    const request = fetchAllFavoriteMedias(mediaId, pageSize, expireTime)
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
   * 按页获取收藏夹视频列表（带分页缓存 + 请求去重）
   * 适用于拖拽管理等按需分页加载的场景，首页即时响应
   * @param mediaId 收藏夹 ID
   * @param page 页码（从 1 开始）
   * @param pageSize 每页数量，默认 40（B 站最大限制）
   */
  const fetchPageWithCache = async (
    mediaId: string,
    page: number,
    pageSize = 40,
  ): Promise<{ medias: FavoriteMedia[]; hasMore: boolean }> => {
    // 1. 检查分页缓存
    const cached = getPageCachedData(mediaId, page, pageSize)
    if (cached) return { medias: cached.medias, hasMore: cached.hasMore }

    // 2. 请求去重
    const reqKey = `${mediaId}:${page}:${pageSize}`
    if (pendingPageRequests.has(reqKey)) {
      return pendingPageRequests.get(reqKey)!
    }

    // 3. 发起新请求
    const request = fetchFavoritePage(mediaId, page, pageSize)
      .then((result) => {
        setPageCachedData(mediaId, page, pageSize, result)
        pendingPageRequests.delete(reqKey)
        return result
      })
      .catch((error) => {
        pendingPageRequests.delete(reqKey)
        throw error
      })

    pendingPageRequests.set(reqKey, request)
    return request
  }

  /**
   * 将视频从源收藏夹缓存移动到目标收藏夹缓存（同步更新全量缓存）
   */
  const moveVideosCache = (srcMediaId: string, tarMediaId: string, videoIds: number[]) => {
    const srcCached = getCachedData(srcMediaId)
    if (!srcCached) return

    const idSet = new Set(videoIds)
    const movedMedias = srcCached.filter((m) => idSet.has(m.id))
    if (movedMedias.length === 0) return

    setCachedData(
      srcMediaId,
      srcCached.filter((m) => !idSet.has(m.id)),
    )

    const tarCached = getCachedData(tarMediaId)
    if (tarCached) {
      const existingIds = new Set(tarCached.map((m) => m.id))
      const newMedias = movedMedias.filter((m) => !existingIds.has(m.id))
      setCachedData(tarMediaId, [...tarCached, ...newMedias])
    }
  }

  /**
   * 清除全量缓存
   * @param mediaId 指定收藏夹 ID，不传则清除全部
   */
  const invalidateCache = (mediaId?: string) => {
    if (mediaId) {
      localStorage.removeItem(`${CACHE_PREFIX}${mediaId}`)
    } else {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key)
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    }
  }

  /**
   * 清除分页缓存
   * @param mediaId 指定收藏夹 ID，不传则清除全部分页缓存
   */
  const invalidatePageCache = (mediaId?: string) => {
    const prefix = mediaId ? `${PAGE_CACHE_PREFIX}${mediaId}:` : PAGE_CACHE_PREFIX
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }

  return {
    fetchWithCache,
    fetchPageWithCache,
    moveVideosCache,
    invalidateCache,
    invalidatePageCache,
  }
}

export { useFavoriteListData }
