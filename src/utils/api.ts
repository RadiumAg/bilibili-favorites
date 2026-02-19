import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import OpenAI from 'openai'

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

const fetchChatGpt = async (titleArray: string[], config: AIConfig) => {
  // 检查并使用配额
  // const hasQuota = await useQuota()
  // if (!hasQuota) {
  //   throw new Error('今日 AI 调用配额已用完，请明天再试或调整配额设置')
  // }
  const { apiKey, baseURL, model, extraParams } = config

  const systemPrompt = `你是一个关键词提取专家。任务：从视频标题中提取搜索关键词。

规则：
1. 提取标题中的核心词汇和常见别称
2. 包含缩写、全称、中英文等多种表达
3. 去除无意义的修饰词（如"学习"、"教程"等）
4. 只返回 JSON 数组格式，不要任何解释

示例：
输入：["TypeScript入门教程","大学英语四级备考"]
输出：["typescript","ts","type script","大学英语","四级","cet4","英语四级"]`

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    {
      role: 'user' as const,
      content: '["React Hooks详解","Python数据分析"]',
    },
    {
      role: 'assistant' as const,
      content: '["react","hooks","react hooks","python","数据分析","data analysis"]',
    },
    {
      role: 'user' as const,
      content: JSON.stringify(titleArray),
    },
  ]

  // 合并所有配置参数
  const requestParams = {
    model: model!,
    messages,
    stream: true,
    ...(extraParams || {}), // 塞入额外参数
  }

  // 使用 OpenAI SDK 的兼容模式（支持所有 OpenAI 兼容的 API）
  const openai = await new OpenAI({
    baseURL,
    apiKey,
    dangerouslyAllowBrowser: true,
  }).chat.completions.create(requestParams)

  return openai
}

const fetchAIMove = async (videos: AIMoveInput, favoriteTitles: string[], config: AIMoveConfig) => {
  const { apiKey, baseURL, model, extraParams } = config

  const systemPrompt = `你是一个视频分类助手。任务：根据视频标题，判断应该移动到哪个收藏夹。

可用的收藏夹列表：
${favoriteTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n')}

规则：
1. 仔细阅读视频标题，理解其主题内容
2. 根据标题内容，选择最合适的收藏夹
3. 如果没有合适的收藏夹，返回"默认收藏夹"
4. 只返回 JSON 数组格式，不要任何解释

返回格式（严格按照此格式）：
[
  {
    "title": "原始视频标题",
    "targetFavorite": "目标收藏夹名称",
    "reason": "选择理由（简短）"
  }
]

示例：
输入：["React Hooks详解","Python数据分析"]
收藏夹：["前端开发","后端开发","数据分析","默认收藏夹"]
输出：
[
  {"title": "React Hooks详解","targetFavorite":"前端开发","reason":"React是前端框架"},
  {"title": "Python数据分析","targetFavorite":"数据分析","reason":"主题是数据分析"}
]`

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    {
      role: 'user' as const,
      content: JSON.stringify(videos.map((v) => v.title)),
    },
  ]

  // 合并所有配置参数
  const requestParams = {
    model: model!,
    messages,
    stream: true,
    ...(extraParams || {}),
  }

  // 使用 OpenAI SDK 的兼容模式（支持所有 OpenAI 兼容的 API）
  const openai = await new OpenAI({
    baseURL,
    apiKey,
    dangerouslyAllowBrowser: true,
  }).chat.completions.create(requestParams)

  return openai
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
