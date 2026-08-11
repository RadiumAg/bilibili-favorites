enum MessageEnum {
  getCookie = 'getCookie',
  getCookieFromChrome = 'getCookieFromChrome',
  moveVideo = 'moveVideo',
  deleteFavoriteVideos = 'deleteFavoriteVideos',
  restoreFavoriteVideo = 'restoreFavoriteVideo',
  getFavoriteList = 'getFavoriteList',
  getAllFavoriteFlag = 'getAllFavoriteFlag',
  fetchChatGpt = 'fetchChatGpt',
  fetchAIMove = 'fetchAIMove',
  // AIGate 相关消息
  checkAIGateQuota = 'checkAIGateQuota',
  callAIGateAI = 'callAIGateAI',
  // 性格分析
  fetchPersonalityAnalysis = 'fetchPersonalityAnalysis',
}

type Message<T = any> = {
  type: MessageEnum
  data?: T
}

export { MessageEnum }
export type { Message }
