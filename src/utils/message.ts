enum MessageEnum {
  getCookie = 'getCookie',
  moveVideo = 'moveVideo',
}

type Message<T = any> = {
  type: MessageEnum
  data?: T
}

export { MessageEnum }
export type { Message }
