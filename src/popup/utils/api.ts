const getFavoriteList = (mediaId: string, pn: number, ps: number, keyword = '') => {
  return fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}&keyword=${keyword}&order=mtime&tid=0&platform=web&web_location=333.1387`,
    { method: 'get' },
  ).then((res) => res.json())
}

const getAllFavoriteFlag = () => {
  return fetch('https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=352413383', {
    method: 'get',
  }).then((res) => res.json())
}

const moveFavorite = () => {
  return fetch('https://api.bilibili.com/x/v3/fav/resource/move', { method: 'get' }).then((res) =>
    res.json(),
  )
}

export { getAllFavoriteFlag, getFavoriteList, moveFavorite }
