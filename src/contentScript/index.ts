import { MessageEnum } from '@/utils/message'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message === MessageEnum.getCookie) {
    sendResponse(document.cookie)
  }
})
