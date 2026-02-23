enum MessageEnum {
  getCookie = 'getCookie',
  moveVideo = 'moveVideo',
  getFavoriteList = 'getFavoriteList',
  getFavoriteDetail = 'getFavoriteDetail',
  fetchChatGpt = 'fetchChatGpt',
  fetchAIMove = 'fetchAIMove',
}

type Message<T = any> = {
  type: MessageEnum
  data?: T
}

export { MessageEnum }
export type { Message }
