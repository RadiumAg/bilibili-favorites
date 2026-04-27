import { MessageEnum } from '@/utils/message'
import { buildKeywordExtractionMessages, buildAIMoveMessages, streamAIRequest } from './utils'
import { callAIGateAI, checkAIGateQuota } from './ai-gate'

// 使用 onConnect 监听长连接，支持流式传输
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ai-stream') return

  let currentAbortController: AbortController | null = null

  port.onMessage.addListener(async (message) => {
    console.log('[Background] Received message:', message)

    // 处理取消请求
    if (message.type === 'cancel') {
      if (currentAbortController) {
        currentAbortController.abort()
        currentAbortController = null
        console.log('[Background] Request cancelled by user')
      }
      return
    }

    switch (message.type) {
      case MessageEnum.fetchChatGpt: {
        const { titleArray, config, useCustomAI } = message.data
        const messages = await buildKeywordExtractionMessages(titleArray)
        currentAbortController = new AbortController()
        if (useCustomAI) {
          streamAIRequest(port, config, messages, currentAbortController)
        } else {
          callAIGateAI(port, messages, currentAbortController).catch((error) => {
            port.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'AI 调用失败',
            })
          })
        }
        break
      }

      case MessageEnum.fetchAIMove: {
        const { videos, favoriteTitles, config, useCustomAI } = message.data
        const messages = await buildAIMoveMessages(videos, favoriteTitles)
        currentAbortController = new AbortController()
        if (useCustomAI) {
          streamAIRequest(port, config, messages, currentAbortController)
        } else {
          callAIGateAI(port, messages, currentAbortController)
        }
        break
      }

      case MessageEnum.checkAIGateQuota: {
        checkAIGateQuota()
          .then((result) => {
            port.postMessage({ type: 'quota-result', data: result })
          })
          .catch((error) => {
            port.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : '配额检查失败',
            })
          })
        break
      }

      default:
        console.warn('[Background] Unknown message type:', message.type)
        port.postMessage({ type: 'error', error: `Unknown message type: ${message.type}` })
    }
  })

  // 当 port 断开时，取消正在进行的请求
  port.onDisconnect.addListener(() => {
    console.log('cancel')
    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
      console.log('[Background] Port disconnected, request cancelled')
    }
  })
})
