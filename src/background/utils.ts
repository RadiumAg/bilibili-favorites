import { BaseMessageLike } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { AIError } from '@/utils/error'

/**
 * 关键词提取 Prompt 模板（LangChain ChatPromptTemplate）
 */
const keywordExtractionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `你是一个关键词提取专家。任务：从视频标题中提取搜索关键词。

规则：
1. 提取标题中的核心词汇和常见别称
2. 包含缩写、全称、中英文等多种表达
3. 去除无意义的修饰词（如"学习"、"教程"等）
4. 只返回 JSON 数组格式，不要任何解释

示例：
输入：["TypeScript入门教程","大学英语四级备考"]
输出：["typescript","ts","type script","大学英语","四级","cet4","英语四级"]`,
  ],
  ['user', '["React Hooks详解","Python数据分析"]'],
  ['assistant', '["react","hooks","react hooks","python","数据分析","data analysis"]'],
  ['user', '{titles}'],
])

/**
 * 构建关键词提取的 messages
 */
const buildKeywordExtractionMessages = async (titleArray: string[]) => {
  return keywordExtractionPrompt.formatMessages({
    titles: JSON.stringify(titleArray),
  })
}

/**
 * AI 移动分类 Prompt 模板（LangChain ChatPromptTemplate）
 */
const aiMovePrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `你是一个视频分类助手。任务：根据视频标题，判断应该移动到哪个收藏夹。

可用的收藏夹列表：
{favoriteList}

规则：
1. 仔细阅读视频标题，理解其主题内容
2. 根据标题内容，选择最合适的收藏夹
3. 如果没有合适的收藏夹，返回"默认收藏夹"
4. 只返回 JSON 数组格式，不要任何解释

返回格式（严格按照此格式）：
[
  {{
    "title": "原始视频标题",
    "targetFavorite": "目标收藏夹名称",
    "reason": "选择理由（简短）"
  }}
]

示例：
输入：["React Hooks详解","Python数据分析"]
收藏夹：["前端开发","后端开发","数据分析","默认收藏夹"]
输出：
[
  {{"title": "React Hooks详解","targetFavorite":"前端开发","reason":"React是前端框架"}},
  {{"title": "Python数据分析","targetFavorite":"数据分析","reason":"主题是数据分析"}}
]`,
  ],
  ['user', '{videoTitles}'],
])

/**
 * 构建 AI 移动分类的 messages
 */
const buildAIMoveMessages = async (videos: any[], favoriteTitles: string[]) => {
  return aiMovePrompt.formatMessages({
    favoriteList: favoriteTitles
      .map((title: string, idx: number) => `${idx + 1}. ${title}`)
      .join('\n'),
    videoTitles: JSON.stringify(videos.map((v: any) => v.title)),
  })
}

/**
 * 通过 port 流式发送 AI 请求结果
 * 使用 LangChain ChatOpenAI 实现标准化流式输出
 */
const streamAIRequest = async (
  port: chrome.runtime.Port,
  config: { apiKey: string; baseURL?: string; model?: string; extraParams?: Record<string, any> },
  messages: BaseMessageLike[],
  abortController: AbortController,
) => {
  try {
    const model = new ChatOpenAI({
      model: config.model!,
      apiKey: config.apiKey,
      temperature: 0,
      configuration: {
        baseURL: config.baseURL,
      },
      modelKwargs: config.extraParams,
    })

    const stream = await model.stream(messages, {
      signal: abortController.signal,
    })

    for await (const chunk of stream) {
      // 双重检查：在处理每个 chunk 前检查是否已取消
      if (abortController.signal.aborted) {
        console.log('[Background] Request aborted during streaming')
        port.postMessage({ type: 'aborted' })
        return
      }

      console.log('[DEBUG] chunk', chunk)
      // 从 AIMessageChunk 中提取纯文本内容
      const content = typeof chunk.content === 'string' ? chunk.content : ''
      if (content) {
        // 包装为 OpenAI 兼容格式以保持前端适配器兼容
        port.postMessage({
          type: 'chunk',
          content: JSON.stringify({
            choices: [{ delta: { content } }],
          }),
        })
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
    const detail = error instanceof AIError ? error.detail : undefined
    console.error('AI request failed:', error)
    port.postMessage({ type: 'error', error: errorMessage, detail })
  }
}

export { streamAIRequest, buildAIMoveMessages, buildKeywordExtractionMessages }
