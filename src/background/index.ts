import { MessageEnum } from '@/utils/message'
import { AIError } from '@/utils/error'
import {
  buildKeywordExtractionMessages,
  buildAIMoveMessages,
  buildPersonalityMessages,
  streamAIRequest,
} from './utils'
import { callAIGateAI, checkAIGateQuota } from './ai-gate'
import { setupPetMessageHandlers } from './pet'
import { uploadSync } from '@/utils/sync-service'
import type { WebDAVRequestOptions } from '@/utils/webdav'

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
setupPetMessageHandlers()

// ========== WebDAV 同步防抖计时器 ==========
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SYNC_DEBOUNCE_MS = 5000

function debouncedSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(async () => {
    try {
      await uploadSync()
      console.log('[Background] WebDAV auto sync completed')
    } catch (error) {
      console.warn('[Background] WebDAV auto sync failed:', error)
    }
  }, SYNC_DEBOUNCE_MS)
}

// ========== 消息监听（短连接） ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // WebDAV 请求代理
  if (message?.type === 'webdavRequest') {
    const options = message.data as WebDAVRequestOptions
    handleWebDAVRequest(options)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    return true // 表示异步响应
  }

  // WebDAV 同步触发
  if (message?.type === 'triggerSync') {
    debouncedSync()
    return false
  }

  if (message?.type === 'open_sidepanel') {
    const windowId = sender.tab?.windowId
    if (windowId !== undefined) {
      chrome.sidePanel.open({ windowId })
    }
  }

  if (message?.type === 'openOptionsPage' && typeof message.tab === 'string') {
    chrome.tabs.create({
      url: `options.html?tab=${message.tab}`,
      active: true,
    })
  }
})

/**
 * 处理 WebDAV 请求代理（在 background 中发起 fetch，绕过 CORS）
 */
async function handleWebDAVRequest(options: WebDAVRequestOptions) {
  const { method, url, headers, body } = options

  const response = await fetch(url, {
    method,
    headers: headers || {},
    body: body || undefined,
  })

  const responseBody = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: responseBody,
  }
}

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
              detail: error instanceof AIError ? error.detail : undefined,
            })
          })
        }
        break
      }

      case MessageEnum.fetchAIMove: {
        const { videos, favoriteTitles, config, useCustomAI, favoriteTagsMap } = message.data
        const messages = await buildAIMoveMessages(videos, favoriteTitles, favoriteTagsMap)
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
              detail: error instanceof AIError ? error.detail : undefined,
            })
          })
        break
      }

      case MessageEnum.fetchPersonalityAnalysis: {
        const { summary, config, useCustomAI } = message.data
        const messages = await buildPersonalityMessages(summary)
        currentAbortController = new AbortController()
        if (useCustomAI) {
          streamAIRequest(port, config, messages, currentAbortController)
        } else {
          callAIGateAI(port, messages, currentAbortController).catch((error) => {
            port.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'AI 调用失败',
              detail: error instanceof AIError ? error.detail : undefined,
            })
          })
        }
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
