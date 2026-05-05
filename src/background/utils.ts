import { BaseMessageLike } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { AIError } from '@/utils/error'

/**
 * 关键词提取 - 系统 Prompt
 */
const KEYWORD_SYSTEM_PROMPT = `你是一个关键词提取专家。任务：从视频标题中提取搜索关键词。

### 规则
1. 提取标题中的核心词汇和常见别称
2. 包含缩写、全称、中英文等多种表达
3. 去除无意义的修饰词（如"学习"、"教程"等）
4. 只返回 JSON 数组格式，不要任何解释

### 示例
输入：["TypeScript入门教程","大学英语四级备考"]
输出：["typescript","ts","type script","大学英语","四级","cet4","英语四级"]`

/**
 * 关键词提取 - Few-shot 示例
 */
const KEYWORD_EXAMPLES = [
  {
    user: '["React Hooks详解","Python数据分析"]',
    assistant: '["react","hooks","react hooks","python","数据分析","data analysis"]',
  },
]

/**
 * 关键词提取 Prompt 模板（LangChain ChatPromptTemplate）
 */
const keywordExtractionPrompt = ChatPromptTemplate.fromMessages([
  ['system', KEYWORD_SYSTEM_PROMPT],
  ...KEYWORD_EXAMPLES.flatMap<[string, string]>((ex) => [
    ['user', ex.user],
    ['assistant', ex.assistant],
  ]),
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
 * AI 移动分类 - 系统 Prompt
 */
const AIMOVE_SYSTEM_PROMPT = `你是一个视频分类助手。任务：根据视频标题，判断应该移动到哪个收藏夹。

【强制约束】targetFavorite 必须严格从以下「可用的收藏夹列表」中选择，严禁使用列表外的任何名称，包括同义词、近似词或概括性描述。

### 可用的收藏夹列表
{favoriteList}

### 规则
1. 仔细阅读视频标题，理解其主题内容
2. 根据标题内容，从「可用的收藏夹列表」中选择最合适的收藏夹
3. **targetFavorite 必须是可用收藏夹列表中的某个名称，严禁使用列表外的名称**
4. 如果没有合适的收藏夹，必须返回"默认收藏夹"
5. 只返回 JSON 数组格式，不要任何解释

### 返回格式（严格按照此格式）
[
  {{
    "title": "原始视频标题",
    "targetFavorite": "目标收藏夹名称（必须是可用列表中的名称）",
    "reason": "选择理由（简短）"
  }}
]

### 注意事项
- 如果视频标题是"TypeScript入门教程"，而列表中有"前端开发"，则 targetFavorite 必须是"前端开发"
- 严禁返回"技术教程""编程"等列表中不存在的名称，即使语义相近也不允许`

/**
 * AI 移动分类 - Few-shot 示例
 */
const AIMOVE_EXAMPLES = [
  {
    user: `输入：["React Hooks详解","Python数据分析"]
收藏夹：["前端开发","后端开发","数据分析","默认收藏夹"]`,
    assistant: `[
  {{"title": "React Hooks详解","targetFavorite":"前端开发","reason":"React是前端框架"}},
  {{"title": "Python数据分析","targetFavorite":"数据分析","reason":"主题是数据分析"}}
]`,
  },
]

/**
 * AI 移动分类 Prompt 模板（LangChain ChatPromptTemplate）
 */
const aiMovePrompt = ChatPromptTemplate.fromMessages([
  ['system', AIMOVE_SYSTEM_PROMPT],
  ...AIMOVE_EXAMPLES.flatMap<[string, string]>((ex) => [
    ['user', ex.user],
    ['assistant', ex.assistant],
  ]),
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

/**
 * MBTI 性格分析 - 系统 Prompt
 */
const PERSONALITY_SYSTEM_PROMPT = `你是一位资深的性格分析专家，擅长根据用户的收藏内容推断其 MBTI 性格倾向。

### 任务
根据用户B站收藏夹的数据（收藏夹名称、视频数量、高频关键词），推断其 MBTI 性格类型。

### MBTI 四维度说明
- EI 维度：E（外向）偏好社交/娱乐/流行内容，I（内向）偏好深度学习/独立探索/小众内容
- SN 维度：S（感觉）偏好实用/具体/生活化内容，N（直觉）偏好抽象/理论/未来向内容
- TF 维度：T（思考）偏好技术/逻辑/科学内容，F（情感）偏好艺术/情感/人文内容
- JP 维度：J（判断）偏好系统化/有组织的收藏习惯，P（感知）偏好随性/多元化的收藏习惯

### 输出要求
只返回 JSON 格式，不要任何解释。严格按以下结构：
{{
  "type": "INTJ",
  "title": "思辨型收藏家",
  "description": "50-100字的性格描述",
  "dimensions": {{
    "EI": {{ "tendency": "I", "score": 72, "reason": "简短理由" }},
    "SN": {{ "tendency": "N", "score": 65, "reason": "简短理由" }},
    "TF": {{ "tendency": "T", "score": 80, "reason": "简短理由" }},
    "JP": {{ "tendency": "J", "score": 55, "reason": "简短理由" }}
  }},
  "interests": ["兴趣1", "兴趣2", "兴趣3", "兴趣4", "兴趣5"],
  "suggestions": ["建议1", "建议2", "建议3"]
}}

score 为 0-100 的整数，表示该维度的倾向程度（50为中立，越极端越明显）。
interests 是基于收藏内容推测的兴趣领域。
suggestions 是给用户的个性化建议。`

/**
 * MBTI 性格分析 Prompt 模板
 */
const personalityPrompt = ChatPromptTemplate.fromMessages([
  ['system', PERSONALITY_SYSTEM_PROMPT],
  ['user', '{summary}'],
])

/**
 * 构建性格分析的 messages
 */
const buildPersonalityMessages = async (summary: {
  totalCount: number
  folders: { title: string; count: number; topKeywords: string[] }[]
  globalTopKeywords: string[]
}) => {
  return personalityPrompt.formatMessages({
    summary: JSON.stringify(summary, null, 2),
  })
}

export {
  streamAIRequest,
  buildAIMoveMessages,
  buildKeywordExtractionMessages,
  buildPersonalityMessages,
}
