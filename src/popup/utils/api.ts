import { getCookieValue } from '@/utils'
import { DataContextType } from './data-context'

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
): Promise<{ data: { list: DataContextType['favoriteData'] } }> => {
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
const getAllFavoriteFlag = (cookies: stirng) => {
  if (cookies == null) return Promise.resolve({}) as ReturnType<typeof getFavoriteList>

  const dedeUserID = getCookieValue('DedeUserID', cookies)

  return fetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${dedeUserID}`, {
    method: 'get',
  }).then((res) => res.json())
}

/**
 *  move target video to source favorite tag
 *
 * @param {string} srcMediaId
 * @param {string} tarMediaId
 * @param {string} videoId
 * @return {*}
 */
const moveFavorite = (srcMediaId: string, tarMediaId: string, videoId: string) => {
  return fetch('https://api.bilibili.com/x/v3/fav/resource/move', {
    method: 'post',
    body: JSON.stringify({
      resources: `${videoId}:2`,
      mid: getCookieValue('DedeUserID'),
      platform: 'web',
      tar_media_id: tarMediaId,
      src_media_id: srcMediaId,
      csrf: getCookieValue('bili_jct'),
    }),
  }).then((res) => res.json())
}

export { getAllFavoriteFlag, getFavoriteList, moveFavorite }
