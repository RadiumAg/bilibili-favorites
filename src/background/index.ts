import OpenAI from 'openai'
import { MessageEnum } from '@/utils/message'

/**
 * 通过 port 流式发送 AI 请求结果
 */
const streamAIRequest = async (
  port: chrome.runtime.Port,
  config: { apiKey: string; baseURL?: string; model?: string; extraParams?: Record<string, any> },
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
) => {
  const requestParams = {
    model: config.model!,
    messages,
    stream: true,
    ...(config.extraParams || {}),
  }

  const openai = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const stream = await openai.chat.completions.create(requestParams)

    for await (const chunk of stream as any) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        port.postMessage({ type: 'chunk', content })
      }
    }

    port.postMessage({ type: 'done' })
  } catch (error) {
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

  port.onMessage.addListener((message) => {
    console.log('[Background] Received message:', message)

    switch (message.type) {
      case MessageEnum.fetchChatGpt: {
        const { titleArray, config } = message.data
        const messages = buildKeywordExtractionMessages(titleArray)
        streamAIRequest(port, config, messages)
        break
      }

      case MessageEnum.fetchAIMove: {
        const { videos, favoriteTitles, config } = message.data
        const messages = buildAIMoveMessages(videos, favoriteTitles)
        streamAIRequest(port, config, messages)
        break
      }

      default:
        console.warn('[Background] Unknown message type:', message.type)
        port.postMessage({ type: 'error', error: `Unknown message type: ${message.type}` })
    }
  })
})
