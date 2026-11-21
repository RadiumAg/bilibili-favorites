enum MessageEnum {
  getCookie = 'getCookie',
  getCookieFromChrome = 'getCookieFromChrome',
  pingContentScript = 'pingContentScript',
  moveVideo = 'moveVideo',
  deleteFavoriteVideos = 'deleteFavoriteVideos',
  restoreFavoriteVideo = 'restoreFavoriteVideo',
  getFavoriteList = 'getFavoriteList',
  getAllFavoriteFlag = 'getAllFavoriteFlag',
  fetchChatGpt = 'fetchChatGpt',
  fetchAIMove = 'fetchAIMove',
  // 性格分析
  fetchPersonalityAnalysis = 'fetchPersonalityAnalysis',
}

type Message<T = any> = {
  type: MessageEnum
  data?: T
}

export { MessageEnum }
export type { Message }
