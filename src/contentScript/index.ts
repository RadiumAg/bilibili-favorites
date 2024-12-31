import { moveFavorite } from '@/utils/api'
import { Message, MessageEnum } from '@/utils/message'

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
  switch (message.type) {
    case MessageEnum.getCookie:
      {
        sendResponse(document.cookie)
      }
      break

    case MessageEnum.moveVideo:
      {
        const { srcMediaId, tarMediaId, videoId } = message.data
        await moveFavorite(srcMediaId, tarMediaId, videoId, document.cookie)
        console.log('run end')

        sendResponse(MessageEnum.moveVideo)
      }
      break
  }
})
