import { getAllFavoriteFlag, getFavoriteList, moveFavorite } from '@/utils/api'
import { Message, MessageEnum } from '@/utils/message'
import { DesktopPet } from '@/components/desktop-pet'
import ReactDOM from 'react-dom/client'
import React from 'react'

/** 注入桌宠到页面 */
function mountDesktopPet() {
  // 避免重复注入
  if (document.getElementById('bilibili-favorites-pet')) return

  const container = document.createElement('div')
  container.id = 'bilibili-favorites-pet'
  container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;'
  document.body.appendChild(container)

  const root = ReactDOM.createRoot(container)
  root.render(React.createElement(DesktopPet))
}

// 页面加载完成后注入桌宠
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountDesktopPet()
} else {
  window.addEventListener('DOMContentLoaded', mountDesktopPet)
}

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
