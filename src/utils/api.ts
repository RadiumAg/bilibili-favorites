import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import { MessageEnum } from './message'

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
export type GetFavoriteListRes = BResponse<{ medias: { id: number; title: string }[] | null }>

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

type GetFavoriteDetailRes = BResponse<{
  info: FavoriteDetailInfo
  medias: FavoriteMedia[]
  has_more: boolean
  ttl: number
}>

/**
 * get favorite detail (folder information)
 *
 * @param mediaId - Favorite folder ID
 * @returns Promise<GetFavoriteDetailRes>
 */
const getFavoriteDetail = (mediaId: string): Promise<GetFavoriteDetailRes> => {
  return fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=1&ps=40&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387`,
    {
      method: 'get',
      credentials: 'include',
    },
  ).then((res) => res.json())
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
 * 返回一个带有 toReadableStream 方法的对象，保持与调用方的兼容性
 */
const connectAndStream = (message: { type: MessageEnum; data: any }) => {
  const port = chrome.runtime.connect({ name: 'ai-stream' })
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      port.onMessage.addListener((response) => {
        switch (response.type) {
          case 'chunk':
            controller.enqueue(encoder.encode(response.content))
            break
          case 'done':
            controller.close()
            port.disconnect()
            break
          case 'error':
            controller.error(new Error(response.error))
            port.disconnect()
            break
        }
      })

      port.onDisconnect.addListener(() => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          controller.error(new Error(lastError.message))
        }
      })

      // 发送请求消息
      port.postMessage(message)
    },
  })

  return { toReadableStream: () => stream }
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

export {
  getAllFavoriteFlag,
  getFavoriteList,
  moveFavorite,
  fetchChatGpt,
  fetchAIMove,
  getFavoriteDetail,
}
export type {
  FavoriteMedia,
  FavoriteDetailInfo,
  GetFavoriteDetailRes,
  MediaCountInfo,
  FavoriteMediaUpper,
  FavoriteMediaUGC,
  FavoriteDetailInfoUpper,
  AIConfig,
}
