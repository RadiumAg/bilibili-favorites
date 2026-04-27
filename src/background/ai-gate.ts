import {
  BaseMessage,
  MessageStructure,
  MessageToolSet,
  MessageType,
} from '@langchain/core/messages'
import { getExtensionDeviceId } from '@/utils/tab'
import { AIError } from '@/utils/error'

const apiKeyId = 'key_1773224729422_glodcb9m00i'
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
const checkAIGateQuota = async () => {
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
  messages: BaseMessage<MessageStructure<MessageToolSet>, MessageType>[],
  abortController: AbortController,
) => {
  const userId = await getExtensionDeviceId()

  try {
    // 先检查配额
    const quotaCheck = await checkAIGateQuota()
    if (!quotaCheck.hasQuota) {
      throw new AIError('配额不足', 'AIGate 每日请求配额已用完，请明日再试或切换到自定义 AI 配置')
    }

    // 调用 AIGate AI 接口（SSE 流式响应）
    const response = await fetch(`${freeApiUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        apiKeyId,
        request: {
          temperature: 0,
          chat_template_kwargs: { enable_thinking: false },
          messages: messages.map((message) => {
            let type = ''
            switch (message.type) {
              case 'ai':
              case 'system':
                type = 'assistant'
                break
              case 'human':
                type = 'user'
                break
              default:
                type = 'user'
            }
            return {
              role: type,
              content: message.content,
            }
          }),
        },
      }),
    })

    // 解析 SSE 流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new AIError('无法读取响应流', '服务器未返回数据，请检查网络连接后重试')
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
    const detail = error instanceof AIError ? error.detail : undefined
    console.error('AI request failed:', error)
    port.postMessage({ type: 'error', error: errorMessage, detail })
  }
}

export { callAIGateAI, checkAIGateQuota }
