import { useMemo } from "react"

const getFavoriteList = (mediaId: string, pn: number, ps:number, keyword?: string) => {
  return  fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}&keyword=${keyword}&order=mtime&tid=0&platform=web&web_location=333.1387`,
    { method: 'get' },
  )
}


const useApi = ()=> { }



export { getFavoriteList }
