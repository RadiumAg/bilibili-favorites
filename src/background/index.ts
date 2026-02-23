import OpenAI from 'openai'
import { MessageEnum } from '@/utils/message'

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log(message)

  switch (message.type) {
    case MessageEnum.fetchChatGpt: {
      const { titleArray, config } = message.data

      const systemPrompt = `你是一个关键词提取专家。任务：从视频标题中提取搜索关键词。

规则：
1. 提取标题中的核心词汇和常见别称
2. 包含缩写、全称、中英文等多种表达
3. 去除无意义的修饰词（如"学习"、"教程"等）
4. 只返回 JSON 数组格式，不要任何解释

示例：
输入：["TypeScript入门教程","大学英语四级备考"]
输出：["typescript","ts","type script","大学英语","四级","cet4","英语四级"]`

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: '["React Hooks详解","Python数据分析"]',
        },
        {
          role: 'assistant' as const,
          content: '["react","hooks","react hooks","python","数据分析","data analysis"]',
        },
        {
          role: 'user' as const,
          content: JSON.stringify(titleArray),
        },
      ]

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

      openai.chat.completions
        .create(requestParams)
        .then(async (stream) => {
          let fullContent = ''
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              fullContent += content
            }
          }
          sendResponse({ content: fullContent })
        })
        .catch((error) => {
          console.error('AI request failed:', error)
          sendResponse({ error: error.message })
        })

      return true // 保持消息通道开放
    }

    case MessageEnum.fetchAIMove: {
      const { videos, favoriteTitles, config } = message.data

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

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: JSON.stringify(videos.map((v: any) => v.title)),
        },
      ]

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

      openai.chat.completions
        .create(requestParams)
        .then(async (stream) => {
          let fullContent = ''
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              fullContent += content
            }
          }
          sendResponse({ content: fullContent })
        })
        .catch((error) => {
          console.error('AI request failed:', error)
          sendResponse({ error: error.message })
        })

      return true // 保持消息通道开放
    }
  }
})
