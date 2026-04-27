import { MessageEnum } from '@/utils/message'
import { getExtensionDeviceId } from '@/utils/tab'
import { buildKeywordExtractionMessages, buildAIMoveMessages, streamAIRequest } from './utils'

const apiKeyId = 'key_1772769367541_uih3fdvuwf'
const freeApiUrl = import.meta.env.VITE_FREE_API

/**
 * AIGate 配额信息类型
 */
type QuotaInfo = {
  daily: {
    limit: number
    used: number
    remaining: number
  }
  monthly: {
    limit: number
    used: number
    remaining: number
  }
  rpm: {
    limit: number
    used: number
    remaining: number
  }
}

/**
 * 检查 AIGate 配额
 * @returns
 */
const checkAIGateQuota = async (): Promise<{
  hasQuota: boolean
  quotaInfo: QuotaInfo
  message: string
}> => {
  const userId = await getExtensionDeviceId()

  try {
    // 调用 AIGate 配额检查 API
    const response = await fetch(`${freeApiUrl}/api/trpc/ai.getQuotaInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          userId,
          apiKeyId,
        },
      }),
    })

    const result = await response.json()

    // 解析实际的 API 响应结构
    const { policy, usage, remaining } = result.result.data.json

    // 根据实际数据结构调整配额信息
    const quotaInfo: QuotaInfo = {
      daily: {
        limit: policy.dailyRequestLimit,
        used: usage.requestsToday,
        remaining: remaining.daily,
      },
      monthly: {
        limit: 0, // 请求限制模式下没有月配额概念
        used: 0,
        remaining: 0,
      },
      rpm: {
        limit: policy.rpmLimit,
        used: 0, // API 没有返回当前 RPM 使用情况
        remaining: policy.rpmLimit,
      },
    }

    return {
      hasQuota: quotaInfo.daily.remaining > 0,
      quotaInfo,
      message: `今日剩余配额: ${quotaInfo.daily.remaining} 次请求`,
    }
  } catch (error) {
    console.error('AIGate 配额检查失败:', error)
    return {
      hasQuota: false,
      quotaInfo: {
        daily: { limit: 0, used: 0, remaining: 0 },
        monthly: { limit: 0, used: 0, remaining: 0 },
        rpm: { limit: 0, used: 0, remaining: 0 },
      },
      message: error instanceof Error ? error.message : '配额检查失败',
    }
  }
}

/**
 * 调用 AIGate AI 服务
 * @param port
 * @param messages
 * @param abortController
 * @returns
 */
const callAIGateAI = async (
  port: chrome.runtime.Port,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  abortController: AbortController,
) => {
  const userId = await getExtensionDeviceId()

  try {
    // 先检查配额
    const quotaCheck = await checkAIGateQuota()
    if (!quotaCheck.hasQuota) {
      throw new Error('配额不足')
    }

    // 调用 AIGate AI 接口（SSE 流式响应）
    const response = await fetch(`${freeApiUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        request: {
          model: 'lite',
          messages,
          temperature: 0.7,
        },
        apiKeyId,
      }),
    })

    // 解析 SSE 流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 双重检查：在处理每个 chunk 前检查是否已取消
      if (abortController.signal.aborted) {
        console.log('[Background] Request aborted during streaming')
        port.postMessage({ type: 'aborted' })
        return
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // 跳过 [DONE] 标记
        if (trimmedLine === 'data: [DONE]') {
          port.postMessage({ type: 'done' })
          continue
        }

        // 解析 SSE 数据行
        if (trimmedLine.startsWith('data: ')) {
          try {
            const dataStr = trimmedLine.substring(6) // 移除 "data: " 前缀
            const data = JSON.parse(dataStr)

            // 检查是否有错误
            if (data.code !== 0) {
              const error = data.message || 'API 返回错误'
              port.postMessage({ type: 'error', content: error })
              throw new Error(error)
            }

            // 流式发送每个 chunk
            if (data.choices && data.choices[0]?.delta) {
              port.postMessage({ type: 'chunk', content: JSON.stringify(data) })
            }
          } catch (e) {
            // 忽略解析错误，继续处理下一行
            console.warn('解析 SSE 数据失败:', e)
          }
        }
      }
    }
  } catch (error) {
    // 检查是否是因为取消导致的错误
    if (abortController.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      console.log('[Background] Request aborted')
      port.postMessage({ type: 'aborted' })
      return
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI request failed:', error)
    port.postMessage({ type: 'error', error: errorMessage })
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
          callAIGateAI(port, messages, currentAbortController).catch((error) => {
            port.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'AI 调用失败',
            })
          })
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
