import { getCookieValue } from './cookie'
import { DataContextType } from './data-context'
import OpenAI from 'openai'

type BResponse<T> = {
  data: T
}

type GetAllFavoriteFlagRes = BResponse<{ list: DataContextType['favoriteData'] }>
type GetFavoriteListRes = BResponse<{ medias: { id: number; title: string }[] | null }>

/**
 * get favorite list
 *
 * @param mediaId
 * @param pn
 * @param ps
 * @param keyword
 * @returns Promise<GetFavoriteListRes>
 */
const getFavoriteList = (
  mediaId: string,
  pn: number,
  ps: number,
  keyword = '',
): Promise<GetFavoriteListRes> => {
  return fetch(
    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${ps}${keyword ? `&keyword=${keyword}` : ''}&order=mtime&tid=0&platform=web&web_location=333.1387`,
    {
      method: 'get',
      credentials: 'include',
    },
  ).then((res) => res.json())
}

/**
 * get all favorite tag
 *
 * @return {*}
 */
const getAllFavoriteFlag = (cookies?: string): Promise<GetAllFavoriteFlagRes> => {
  if (cookies == null) return Promise.resolve({}) as Promise<GetAllFavoriteFlagRes>
  const dedeUserID = getCookieValue('DedeUserID', cookies)

  return fetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${dedeUserID}`, {
    method: 'get',
  }).then((res) => res.json())
}

/**
 *  move target video to source favorite tag
 *
 * @param {number} srcMediaId
 * @param {number} tarMediaId
 * @param {number} videoId
 * @return {*}
 */
const moveFavorite = (
  srcMediaId: number,
  tarMediaId: number,
  videoId: number,
  cookies?: string,
) => {
  if (cookies == null) return

  const midString = getCookieValue('DedeUserID', cookies)
  if (midString == null) return

  return fetch('https://api.bilibili.com/x/v3/fav/resource/move', {
    method: 'post',
    credentials: 'include',
    body: `resources=${videoId}:2&mid=${midString}&platform=web&tar_media_id=${tarMediaId}&src_media_id=${srcMediaId}&csrf=${getCookieValue('bili_jct', cookies) || ''}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => res.json())
}

type AIProvider =
  | 'openai'
  | 'claude'
  | 'deepseek'
  | 'qwen'
  | 'zhipu'
  | 'doubao'
  | 'coze'
  | 'xinghuo'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseURL?: string
  model?: string
  extraParams?: Record<string, any>  // 额外参数，会被塞入请求 body
}

const getAIConfig = (config: AIConfig) => {
  const { provider, apiKey, baseURL, model } = config

  // 默认配置映射
  const defaultConfigs: Record<AIProvider, { baseURL: string; model: string }> = {
    openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
    claude: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
    deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    qwen: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
    zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
    doubao: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k' },
    coze: { baseURL: 'https://api.coze.com/v3', model: 'coze-chat' },
    xinghuo: { baseURL: 'https://spark-api-open.xf-yun.com/v1', model: 'generalv3.5' },
  }

  const defaultConfig = defaultConfigs[provider]
  return {
    baseURL: baseURL || defaultConfig.baseURL,
    model: model || defaultConfig.model,
  }
}

const fetchChatGpt = async (titleArray: string[], config: AIConfig) => {
  const { provider, apiKey, extraParams } = config
  const { baseURL, model } = getAIConfig(config)

  const systemPrompt =
    '你是一名文案，现在开始，你要根据我提供的视频标题，生成一个关键字数组，例如：["ts学习","大学英语四级"] ，对应关键字：["ts","typescript","大学英语", "四级"]，你只需要返回数组，不可以有其他回答'

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    {
      role: 'user' as const,
      content: '["ts学习","大学英语四级"]',
    },
    {
      role: 'assistant' as const,
      content: '["ts","typescript","大学英语", "四级"]',
    },
    {
      role: 'user' as const,
      content: JSON.stringify(titleArray),
    },
  ]

  // 各服务商跳过思考过程的参数配置
  const getCompletionConfig = () => {
    switch (provider) {
      case 'deepseek':
        // DeepSeek-R1 会返回 reasoning_content，OpenAI SDK 会自动过滤
        return {}
      case 'claude':
        // Claude 3.7 通过 max_tokens 控制输出
        return { max_tokens: 1000 }
      case 'qwen':
        // 通义千问使用 max_tokens 限制
        return { max_tokens: 1000 }
      case 'zhipu':
        // 智谱清言使用 max_tokens 限制
        return { max_tokens: 1000 }
      case 'doubao':
        // 豆包使用 max_tokens 限制
        return { max_tokens: 1000 }
      case 'coze':
        // Coze 使用 max_tokens 限制
        return { max_tokens: 1000 }
      case 'xinghuo':
        // 星火使用 max_tokens 限制
        return { max_tokens: 1000 }
      case 'openai':
      default:
        // OpenAI 默认不返回思考过程
        return { max_tokens: 1000 }
    }
  }

  // 合并所有配置参数
  const requestParams = {
    model,
    messages,
    stream: true,
    ...getCompletionConfig(),
    ...(extraParams || {}),  // 塞入额外参数
  }

  // 使用 OpenAI SDK 的兼容模式（支持所有 OpenAI 兼容的 API）
  const openai = await new OpenAI({
    baseURL,
    apiKey,
    dangerouslyAllowBrowser: true,
    // 某些服务商需要自定义 headers
    defaultHeaders:
      provider === 'claude'
        ? {
            'anthropic-version': '2023-06-01',
          }
        : undefined,
  }).chat.completions.create(requestParams)

  return openai
}

export { getAllFavoriteFlag, getFavoriteList, moveFavorite, fetchChatGpt }
