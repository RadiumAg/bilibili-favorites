import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import { MessageEnum } from './message'
import dbManager from './indexed-db'
import { queryAndSendMessage } from './tab'
import { AIError } from './error'
import { sleep } from './promise'

type BResponse<T> = {
  code: number
  message: string
  ttl: number
  data: T
}

type AIConfig = {
  apiKey: string
  baseURL?: string
  model?: string
  extraParams?: Record<string, any> // 额外参数，会被塞入请求 body
}
type AIMoveInput = { id: number; title: string }[]

type AIMoveConfig = {
  apiKey: string
  baseURL?: string
  model?: string
  extraParams?: Record<string, any>
}

type GetAllFavoriteFlagRes = BResponse<{ list: DataContextType['favoriteData'] }>
export type GetFavoriteListRes = BResponse<{
  info: FavoriteDetailInfo
  medias: FavoriteMedia[] | null
  has_more: boolean
  ttl: number
}>

type MediaCountInfo = {
  collect: number
  play: number
  thumb_up: number
  share: number
}

type FavoriteMediaUpper = {
  mid: number
  name: string
  face: string
  jump_link: string
}

type FavoriteMediaUGC = {
  first_cid: number
}

type FavoriteMedia = {
  id: number
  type: number // 2: 视频
  title: string
  cover: string
  intro: string
  page: number
  duration: number
  upper: FavoriteMediaUpper
  attr: number
  cnt_info: MediaCountInfo
  link: string
  ctime: number
  pubtime: number
  fav_time: number // 收藏时间
  bv_id: string
  bvid: string
  season: null
  ogv: null
  ugc: FavoriteMediaUGC
  media_list_link: string
}

type FavoriteDetailInfoUpper = {
  mid: number
  name: string
  face: string
  followed: boolean
  vip_type: number
  vip_statue: number
}

type FavoriteDetailInfo = {
  id: number
  fid: number
  mid: number
  attr: number
  title: string
  cover: string
  upper: FavoriteDetailInfoUpper
  cover_type: number
  cnt_info: MediaCountInfo
  type: number
  intro: string
  ctime: number
  mtime: number
  state: number
  fav_state: number
  like_state: number
  media_count: number
  is_top: boolean
}

/**
 * get favorite list
 *
 * @param mediaId
 * @param pn
 * @param ps
 * @param keyword
 * @returns Promise<GetFavoriteListRes>
 */
const getFavoriteList = (
  mediaId: string,
  pn: number,
  ps: number,
  keyword = '',
): Promise<GetFavoriteListRes> => {
  return fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}${keyword ? `&keyword=${keyword}` : ''}&order=mtime&tid=0&platform=web&web_location=333.1387`,
    {
      method: 'get',
      credentials: 'include',
    },
  ).then((res) => res.json())
}

/**
 * get all favorite tag
 *
 * @return {*}
 */
const getAllFavoriteFlag = (cookies?: string): Promise<GetAllFavoriteFlagRes> => {
  if (cookies == null) return Promise.resolve({}) as Promise<GetAllFavoriteFlagRes>
  const dedeUserID = getCookieValue('DedeUserID', cookies)

  return fetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${dedeUserID}`, {
    method: 'get',
    credentials: 'include',
  }).then((res) => res.json())
}

/**
 *  move target video to source favorite tag
 *
 * @param {number} srcMediaId
 * @param {number} tarMediaId
 * @param {number} videoId
 * @return {*}
 */
const moveFavorite = (
  srcMediaId: number,
  tarMediaId: number,
  videoId: number,
  cookies?: string,
) => {
  if (cookies == null) return

  const midString = getCookieValue('DedeUserID', cookies)
  if (midString == null) return

  return fetch('https://api.bilibili.com/x/v3/fav/resource/move', {
    method: 'post',
    credentials: 'include',
    body: `resources=${videoId}:2&mid=${midString}&platform=web&tar_media_id=${tarMediaId}&src_media_id=${srcMediaId}&csrf=${getCookieValue('bili_jct', cookies) || ''}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => res.json())
}

/**
 * 通过 chrome.runtime.connect 建立长连接，实现流式 AI 通信
 * 返回一个带有 toReadableStream 方法和 cancel 方法的对象
 */
const connectAndStream = (message: { type: MessageEnum; data: any }) => {
  const port = chrome.runtime.connect({ name: 'ai-stream' })
  const encoder = new TextEncoder()
  let isCancelled = false
  const cancel = () => {
    isCancelled = true
    port.postMessage({ type: 'cancel' })
    port.disconnect()
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      port.onMessage.addListener((response) => {
        console.log('[Background] Received response:', response)
        switch (response.type) {
          case 'chunk':
            if (!isCancelled) {
              controller.enqueue(encoder.encode(response.content))
            }
            break
          case 'done':
            controller.close()
            port.disconnect()
            break
          case 'error':
            controller.error(new AIError(response.error, response.detail))
            port.disconnect()
            break
          case 'aborted':
            controller.close()
            port.disconnect()
            break
        }
      })

      port.onDisconnect.addListener(() => {
        if (isCancelled) {
          // 用户取消，正常关闭 stream
          controller.close()
          return
        }
        const lastError = chrome.runtime.lastError
        if (lastError) {
          controller.error(new AIError('连接已断开', lastError.message))
        }
      })

      // 发送请求消息
      port.postMessage(message)
    },
    cancel,
  })

  return {
    toReadableStream: () => stream,
    cancel,
  }
}

const fetchChatGpt = async (titleArray: string[], config: AIConfig, useCustomAI: boolean) => {
  return connectAndStream({
    type: MessageEnum.fetchChatGpt,
    data: {
      titleArray,
      useCustomAI,
      config: {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        extraParams: config.extraParams,
      },
    },
  })
}

const fetchAIMove = async (
  videos: AIMoveInput,
  favoriteTitles: string[],
  config: AIMoveConfig,
  useCustomAI: boolean,
  favoriteTagsMap?: Record<string, string[]>,
) => {
  return connectAndStream({
    type: MessageEnum.fetchAIMove,
    data: {
      videos,
      useCustomAI,
      favoriteTitles,
      favoriteTagsMap,
      config: {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        extraParams: config.extraParams,
      },
    },
  })
}

/**
 * 调用 AIGate AI 服务（免费额度）
 */
const callAIGateAI = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
) => {
  return connectAndStream({
    type: MessageEnum.callAIGateAI,
    data: {
      messages,
    },
  })
}

/**
 * 性格分析摘要数据类型
 */
type PersonalitySummary = {
  totalCount: number
  folders: { title: string; count: number; topKeywords: string[] }[]
  globalTopKeywords: string[]
}

/**
 * 调用 AI 性格分析
 */
const fetchPersonalityAnalysis = async (
  summary: PersonalitySummary,
  config: AIConfig,
  useCustomAI: boolean,
) => {
  return connectAndStream({
    type: MessageEnum.fetchPersonalityAnalysis,
    data: {
      summary,
      useCustomAI,
      config: {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        extraParams: config.extraParams,
      },
    },
  })
}

/** 分页缓存配置（与 use-favorite-list-data 中保持一致） */
const PAGE_CACHE_PREFIX = 'fav-page:'
const PAGE_CACHE_DURATION = 20 * 60 * 1000

type _PageCacheEntry = {
  medias: FavoriteMedia[]
  hasMore: boolean
  timestamp: number
}

/**
 * 尝试从分页缓存拼装收藏夹全量数据
 * 若该收藏夹的所有页均已被缓存（如用户先在拖拽管理器页面浏览过），则返回拼装结果否则返回 null
 */
const tryAssembleFromPageCache = (mediaId: string, pageSize: number): FavoriteMedia[] | null => {
  try {
    const assembled: FavoriteMedia[] = []
    let page = 1
    while (true) {
      const raw = localStorage.getItem(`${PAGE_CACHE_PREFIX}${mediaId}:${page}:${pageSize}`)
      if (!raw) return null // 某页未命中，无法完整拼装
      const entry: _PageCacheEntry = JSON.parse(raw)
      if (Date.now() - entry.timestamp > PAGE_CACHE_DURATION) return null // 分页缓存已过期
      assembled.push(...entry.medias)
      if (!entry.hasMore) return assembled // 所有页均已命中，拼装完成
      page++
    }
  } catch {
    return null
  }
}

/**
 * 获取某个收藏夹指定页的视频列表（单页，不循环）
 * @param mediaId 收藏夹 ID
 * @param page 页码（从 1 开始）
 * @param pageSize 每页数量，最大 40（B 站限制）
 * @returns 当前页视频列表及是否有下一页
 */
const fetchFavoritePage = async (
  mediaId: string,
  page: number,
  pageSize = 40,
): Promise<{ medias: FavoriteMedia[]; hasMore: boolean }> => {
  const response = await queryAndSendMessage<GetFavoriteListRes>({
    type: MessageEnum.getFavoriteList,
    data: { mediaId, pn: page, ps: pageSize },
  })
  if (response.code !== 0) {
    throw new Error(response.message || '获取收藏夹数据失败')
  }
  return {
    medias: response.data.medias || [],
    hasMore: response.data.has_more,
  }
}

/**
 * 获取全量收藏夹数据的进度回调
 */
type FetchAllProgress = {
  /** 已加载的视频数量 */
  loaded: number
  /** 收藏夹总视频数量（通过 mediaCount 传入时可用，否则为 undefined） */
  total?: number
  /** 当前请求页码 */
  currentPage: number
}

type FetchAllFavoriteMediasOptions = {
  /** 每页数量，默认 40（B 站最大值） */
  pageSize?: number
  /** 缓存过期时间，默认 10 分钟 */
  expireTime?: number
  /**
   * 收藏夹的视频总数（来自 getAllFavoriteFlag 的 media_count 字段）
   * 传入后可实现：1) 进度条显示总数 2) 缓存智能判断——数量未变则跳过请求
   */
  mediaCount?: number
  /** 进度回调，每加载完一页后触发 */
  onProgress?: (progress: FetchAllProgress) => void
}

/**
 * 分页获取某个收藏夹的全部视频列表
 * @param mediaId 收藏夹 ID
 * @param options 配置选项（pageSize / expireTime / mediaCount / onProgress）
 * @returns 该收藏夹下的全部视频
 */
const fetchAllFavoriteMedias = async (
  mediaId: string,
  pageSizeOrOptions?: number | FetchAllFavoriteMediasOptions,
  legacyExpireTime?: number,
): Promise<FavoriteMedia[]> => {
  // 兼容旧的调用方式：fetchAllFavoriteMedias(mediaId, pageSize, expireTime)
  let pageSize = 40
  let expireTime = 10 * 60 * 1000
  let mediaCount: number | undefined
  let onProgress: ((progress: FetchAllProgress) => void) | undefined

  if (typeof pageSizeOrOptions === 'object' && pageSizeOrOptions !== null) {
    pageSize = pageSizeOrOptions.pageSize ?? 40
    expireTime = pageSizeOrOptions.expireTime ?? 10 * 60 * 1000
    mediaCount = pageSizeOrOptions.mediaCount
    onProgress = pageSizeOrOptions.onProgress
  } else if (typeof pageSizeOrOptions === 'number') {
    pageSize = pageSizeOrOptions
    expireTime = legacyExpireTime ?? 10 * 60 * 1000
  }

  const allMedias: FavoriteMedia[] = []
  let currentPage = 1
  let hasMore = true
  const key = `favorite-all-${mediaId}`
  const mediaData = await dbManager.get(key)
  const isExpired = await dbManager.isExpired(key, expireTime)

  // 缓存命中判断：时间未过期直接返回；时间过期但 mediaCount 未变也返回缓存
  if (mediaData) {
    if (!isExpired) return mediaData.data
    if (
      mediaCount !== undefined &&
      Array.isArray(mediaData.data) &&
      mediaData.data.length === mediaCount
    ) {
      // 视频数量未变，延长缓存有效期
      console.log(`[fetchAllFavoriteMedias] 视频数量未变 (${mediaCount})，复用缓存 (${mediaId})`)
      dbManager.set(key, mediaData.data)
      return mediaData.data
    }
  }

  // 尝试从分页缓存拼装（如用户最近在拖拽管理器中浏览过该收藏夹，则无需任何网络请求）
  const fromPageCache = tryAssembleFromPageCache(mediaId, pageSize)
  if (fromPageCache) {
    console.log(`[fetchAllFavoriteMedias] 命中分页缓存，无需请求 API (${mediaId})`)
    dbManager.set(key, fromPageCache)
    return fromPageCache
  }

  while (hasMore) {
    await sleep(1000) // 防止触发b站api风控
    const response = await queryAndSendMessage<GetFavoriteListRes>({
      type: MessageEnum.getFavoriteList,
      data: { mediaId, pn: currentPage, ps: pageSize },
    })

    if (response.code !== 0) {
      throw new Error(response.message || '获取收藏夹数据失败')
    }

    const medias = response.data.medias
    if (medias && medias.length > 0) {
      allMedias.push(...medias)
    }

    hasMore = response.data.has_more

    onProgress?.({
      loaded: allMedias.length,
      total: mediaCount,
      currentPage,
    })

    currentPage++
  }

  dbManager.set(key, allMedias)
  return allMedias
}

export {
  getAllFavoriteFlag,
  getFavoriteList,
  moveFavorite,
  fetchChatGpt,
  fetchAIMove,
  fetchFavoritePage,
  fetchAllFavoriteMedias,
  callAIGateAI,
  fetchPersonalityAnalysis,
}
export type {
  FavoriteMedia,
  FavoriteDetailInfo,
  MediaCountInfo,
  FavoriteMediaUpper,
  FavoriteMediaUGC,
  FavoriteDetailInfoUpper,
  AIConfig,
  PersonalitySummary,
  FetchAllProgress,
}
