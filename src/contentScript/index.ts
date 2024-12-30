import { MessageEnum } from '@/utils/message'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugger
  if (message === MessageEnum.getCookie) {
    sendResponse(document.cookie)
  }
})
