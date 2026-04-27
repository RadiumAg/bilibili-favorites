enum MessageEnum {
  getCookie = 'getCookie',
  moveVideo = 'moveVideo',
  getFavoriteList = 'getFavoriteList',
  getAllFavoriteFlag = 'getAllFavoriteFlag',
  fetchChatGpt = 'fetchChatGpt',
  fetchAIMove = 'fetchAIMove',
  // AIGate 相关消息
  checkAIGateQuota = 'checkAIGateQuota',
  callAIGateAI = 'callAIGateAI',
}

type Message<T = any> = {
  type: MessageEnum
  data?: T
}

export { MessageEnum }
export type { Message }
