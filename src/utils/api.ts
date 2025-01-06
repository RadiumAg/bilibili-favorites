import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import OpenAI from 'openai'

type BResponse<T> = {
  data: T
}

type GetAllFavoriteFlagRes = BResponse<{ list: DataContextType['favoriteData'] }>
type GetFavoriteListRes = BResponse<{ medias: { id: number; title: string }[] | null }>

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

const fetchChatGpt = async (titleArray: string[]) => {
  const openai = await new OpenAI({
    baseURL: import.meta.env.VITE_OPENAI_URL,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  }).chat.completions.create({
    model: 'gpt',
    messages: [
      {
        role: 'system',
        content:
          '你是一名文案，现在开始，你要根据我提供的视频标题，生成一个关键字数组，例如：["ts学习","大学英语四级"] ，对应关键字：["ts","typescript","大学英语", "四级"]，你只需要返回数组，不可以有其他回答',
      },
      {
        role: 'user',
        content: '["ts学习","大学英语四级"]',
      },
      {
        role: 'assistant',
        content: '["ts","typescript","大学英语", "四级"]',
      },
      {
        role: 'user',
        content: `${JSON.stringify(titleArray)}`,
      },
    ],
    stream: true,
  })

  return openai
}

export { getAllFavoriteFlag, getFavoriteList, moveFavorite, fetchChatGpt }
