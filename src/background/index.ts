import OpenAI from 'openai'
import { MessageEnum } from '@/utils/message'

// AIGate 配额信息类型
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

// 检查 AIGate 配额
const checkAIGateQuota = async (
  userId: string,
  apiKeyId: string,
): Promise<{
  hasQuota: boolean
  quotaInfo: QuotaInfo
  message: string
}> => {
  try {
    // 调用 AIGate 配额检查 API
    const response = await fetch('http://localhost:3000/api/trpc/ai.getQuotaInfo', {
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

// 调用 AIGate AI 服务
const callAIGateAI = async (
  userId: string,
  apiKeyId: string,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.7,
) => {
  try {
    // 先检查配额
    const quotaCheck = await checkAIGateQuota(userId, apiKeyId)
    if (!quotaCheck.hasQuota) {
      throw new Error('配额不足')
    }

    // 调用 AIGate AI 接口
    const response = await fetch('http://localhost:3000/api/trpc/ai.chatCompletion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          userId,
          apiKeyId,
          request: {
            model,
            messages,
            temperature,
            max_tokens: 2000,
          },
        },
      }),
    })

    // 解析响应（实际应该根据真实 API 响应格式调整）
    const responseData = await response.json()

    return {
      success: true,
      data: responseData,
      quotaInfo: quotaCheck.quotaInfo,
    }
  } catch (error: any) {
    console.error('AIGate AI 调用失败:', error)
    return {
      success: false,
      error: error.message || 'AI 调用失败',
      quotaInfo: null,
    }
  }
}

/**
 * 通过 port 流式发送 AI 请求结果
 */
const streamAIRequest = async (
  port: chrome.runtime.Port,
  config: { apiKey: string; baseURL?: string; model?: string; extraParams?: Record<string, any> },
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  abortController: AbortController,
) => {
  const openai = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const stream = await openai.chat.completions.create(
      {
        model: config.model!,
        messages,
        stream: true,
        ...(config.extraParams || {}),
      },
      {
        signal: abortController.signal,
      },
    )

    for await (const chunk of stream as any) {
      // 双重检查：在处理每个 chunk 前检查是否已取消
      if (abortController.signal.aborted) {
        console.log('[Background] Request aborted during streaming')
        port.postMessage({ type: 'aborted' })
        return
      }

      if (chunk) {
        port.postMessage({ type: 'chunk', content: JSON.stringify(chunk) })
      }
    }

    port.postMessage({ type: 'done' })
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

/**
 * 构建关键词提取的 messages
 */
const buildKeywordExtractionMessages = (titleArray: string[]) => {
  const systemPrompt = `你是一个关键词提取专家。任务：从视频标题中提取搜索关键词。

规则：
1. 提取标题中的核心词汇和常见别称
2. 包含缩写、全称、中英文等多种表达
3. 去除无意义的修饰词（如"学习"、"教程"等）
4. 只返回 JSON 数组格式，不要任何解释

示例：
输入：["TypeScript入门教程","大学英语四级备考"]
输出：["typescript","ts","type script","大学英语","四级","cet4","英语四级"]`

  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: '["React Hooks详解","Python数据分析"]' },
    {
      role: 'assistant' as const,
      content: '["react","hooks","react hooks","python","数据分析","data analysis"]',
    },
    { role: 'user' as const, content: JSON.stringify(titleArray) },
  ]
}

/**
 * 构建 AI 移动分类的 messages
 */
const buildAIMoveMessages = (videos: any[], favoriteTitles: string[]) => {
  const systemPrompt = `你是一个视频分类助手。任务：根据视频标题，判断应该移动到哪个收藏夹。

可用的收藏夹列表：
${favoriteTitles.map((title: string, idx: number) => `${idx + 1}. ${title}`).join('\n')}

规则：
1. 仔细阅读视频标题，理解其主题内容
2. 根据标题内容，选择最合适的收藏夹
3. 如果没有合适的收藏夹，返回"默认收藏夹"
4. 只返回 JSON 数组格式，不要任何解释

返回格式（严格按照此格式）：
[
  {
    "title": "原始视频标题",
    "targetFavorite": "目标收藏夹名称",
    "reason": "选择理由（简短）"
  }
]

示例：
输入：["React Hooks详解","Python数据分析"]
收藏夹：["前端开发","后端开发","数据分析","默认收藏夹"]
输出：
[
  {"title": "React Hooks详解","targetFavorite":"前端开发","reason":"React是前端框架"},
  {"title": "Python数据分析","targetFavorite":"数据分析","reason":"主题是数据分析"}
]`

  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: JSON.stringify(videos.map((v: any) => v.title)) },
  ]
}

// 使用 onConnect 监听长连接，支持流式传输
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ai-stream') return

  let currentAbortController: AbortController | null = null

  port.onMessage.addListener((message) => {
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
        const { titleArray, config } = message.data
        const messages = buildKeywordExtractionMessages(titleArray)
        currentAbortController = new AbortController()
        streamAIRequest(port, config, messages, currentAbortController)
        break
      }

      case MessageEnum.fetchAIMove: {
        const { videos, favoriteTitles, config } = message.data
        const messages = buildAIMoveMessages(videos, favoriteTitles)
        currentAbortController = new AbortController()
        streamAIRequest(port, config, messages, currentAbortController)
        break
      }

      case MessageEnum.checkAIGateQuota: {
        const { userId, apiKeyId } = message.data
        checkAIGateQuota(userId, apiKeyId)
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

      case MessageEnum.callAIGateAI: {
        const { userId, apiKeyId, model, messages, temperature } = message.data
        callAIGateAI(userId, apiKeyId, model, messages, temperature)
          .then((result) => {
            port.postMessage({ type: 'ai-result', data: result })
          })
          .catch((error) => {
            port.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'AI 调用失败',
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
