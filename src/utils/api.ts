import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import { MessageEnum } from './message'
import dbManager from './indexed-db'
import { queryAndSendMessage } from './tab'

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
            controller.error(new Error(response.error))
            port.disconnect()
            break
          case 'aborted':
            controller.close()
            port.disconnect()
            break
        }
      })

      port.onDisconnect.addListener(() => {
        const lastError = chrome.runtime.lastError
        if (lastError && !isCancelled) {
          controller.error(new Error(lastError.message))
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

const fetchChatGpt = async (titleArray: string[], config: AIConfig) => {
  return connectAndStream({
    type: MessageEnum.fetchChatGpt,
    data: {
      titleArray,
      config: {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        extraParams: config.extraParams,
      },
    },
  })
}

const fetchAIMove = async (videos: AIMoveInput, favoriteTitles: string[], config: AIMoveConfig) => {
  return connectAndStream({
    type: MessageEnum.fetchAIMove,
    data: {
      videos,
      favoriteTitles,
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
 * 分页获取某个收藏夹的全部视频列表
 * @param mediaId 收藏夹 ID
 * @param pageSize 每页数量，默认 40（B 站最大值）
 * @returns 该收藏夹下的全部视频
 */
const fetchAllFavoriteMedias = async (
  mediaId: string,
  pageSize = 40,
  expireTime = 2 * 60 * 1000,
): Promise<FavoriteMedia[]> => {
  const allMedias: FavoriteMedia[] = []
  let currentPage = 1
  let hasMore = true
  const key = `favorite-all-${mediaId}`
  const mediaData = await dbManager.get(key)
  const isExpired = await dbManager.isExpired(key, expireTime)
  if (mediaData && !isExpired) return mediaData.data

  while (hasMore) {
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
  fetchAllFavoriteMedias,
}
export type {
  FavoriteMedia,
  FavoriteDetailInfo,
  MediaCountInfo,
  FavoriteMediaUpper,
  FavoriteMediaUGC,
  FavoriteDetailInfoUpper,
  AIConfig,
}
