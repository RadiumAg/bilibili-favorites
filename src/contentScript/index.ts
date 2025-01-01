import { getFavoriteList, moveFavorite } from '@/utils/api'
import { Message, MessageEnum } from '@/utils/message'

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case MessageEnum.getCookie:
      {
        sendResponse(document.cookie)
      }
      break

    case MessageEnum.moveVideo: {
      const { srcMediaId, tarMediaId, videoId } = message.data
      moveFavorite(srcMediaId, tarMediaId, videoId, document.cookie)
        ?.then(() => {
          sendResponse(MessageEnum.moveVideo)
        })
        .catch(() => {
          sendResponse(MessageEnum.moveVideo)
        })

      break
    }

    case MessageEnum.getFavoriteList: {
      const { mediaId, pn, ps } = message.data

      getFavoriteList(mediaId, pn, ps)
        .then((data) => {
          sendResponse(data)
        })
        .catch(() => {
          sendResponse(MessageEnum.getFavoriteList)
        })

      break
    }
  }

  return true
})
