import { getAllFavoriteFlag, getFavoriteDetail, getFavoriteList, moveFavorite } from '@/utils/api'
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
          sendResponse({ code: -1 })
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
          sendResponse({ code: -1 })
        })

      break
    }

    case MessageEnum.getFavoriteDetail: {
      const { mediaId } = message.data

      getFavoriteDetail(mediaId)
        .then((data) => {
          sendResponse(data)
        })
        .catch((error) => {
          console.error('Error fetching favorite detail:', error)
          sendResponse({ code: -1, message: error.message || 'Failed to fetch favorite detail' })
        })

      break
    }

    case MessageEnum.getAllFavoriteFlag: {
      getAllFavoriteFlag(document.cookie)
        .then((data) => {
          sendResponse(data)
        })
        .catch((error) => {
          console.error('Error fetching all favorite flags:', error)
          sendResponse({ code: -1, message: error.message || 'Failed to fetch favorite flags' })
        })

      break
    }
  }

  return true
})
