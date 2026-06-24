import { getAllFavoriteFlag, getFavoriteList, moveFavorite } from '@/utils/api'
import { Message, MessageEnum } from '@/utils/message'
import { PetMessageEnum } from '@/utils/pet-message'
import { fetchPetFavStats, getStoredDefaultFavoriteId } from '@/utils/pet-stats'
import { DesktopPet } from '@/components/desktop-pet'
import ReactDOM from 'react-dom/client'
import React from 'react'

const PET_CONTAINER_ID = 'bilibili-favorites-pet'

function mountDesktopPet() {
  if (document.getElementById(PET_CONTAINER_ID)) return

  const container = document.createElement('div')
  container.id = PET_CONTAINER_ID
  container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;'
  document.body.appendChild(container)

  const root = ReactDOM.createRoot(container)
  root.render(React.createElement(DesktopPet))
}

function unmountDesktopPet() {
  const container = document.getElementById(PET_CONTAINER_ID)
  if (container) {
    container.remove()
  }
}

function initDesktopPet() {
  try {
    chrome?.storage?.local?.get(['petEnabled'], (result) => {
      const enabled = result.petEnabled !== false
      if (enabled) mountDesktopPet()
    })

    chrome?.storage?.onChanged?.addListener((changes) => {
      if (changes.petEnabled) {
        if (changes.petEnabled.newValue === false) {
          unmountDesktopPet()
        } else {
          mountDesktopPet()
        }
      }
    })
  } catch {
    mountDesktopPet()
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initDesktopPet()
} else {
  window.addEventListener('DOMContentLoaded', initDesktopPet)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === PetMessageEnum.internalGetFavStats) {
    void (async () => {
      const defaultFavoriteId = await getStoredDefaultFavoriteId()
      const stats = await fetchPetFavStats(document.cookie, defaultFavoriteId)
      sendResponse(stats)
    })()
    return true
  }

  const typedMessage = message as Message

  switch (typedMessage.type) {
    case MessageEnum.getCookie:
      {
        sendResponse(document.cookie)
      }
      break

    case MessageEnum.moveVideo: {
      const { srcMediaId, tarMediaId, videoId } = typedMessage.data
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
      const { mediaId, pn, ps } = typedMessage.data

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
