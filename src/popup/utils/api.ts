import { getCookieValue } from '@/utils'
import { DataContextType } from './data-context'

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
 * @returns
 */
const getFavoriteList = (
  mediaId: string,
  pn: number,
  ps: number,
  keyword = '',
): Promise<GetFavoriteListRes> => {
  return fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}&keyword=${keyword}&order=mtime&tid=0&platform=web&web_location=333.1387`,
    { method: 'get' },
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
    body: JSON.stringify({
      resources: `${videoId}:2`,
      mid: +midString,
      platform: 'web',
      tar_media_id: tarMediaId,
      src_media_id: srcMediaId,
      csrf: getCookieValue('bili_jct', cookies),
    }),
  }).then((res) => res.json())
}

export { getAllFavoriteFlag, getFavoriteList, moveFavorite }
