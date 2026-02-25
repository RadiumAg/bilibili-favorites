import { Adapter, DataContextType } from '@/utils/data-context'
import { v4 as uuid } from 'uuid'

export type StreamParserOptions = {
  /** 收藏夹 ID */
  favKey: string
  /** 获取最新数据的函数 */
  getGlobalData: () => DataContextType
  /** 设置全局数据的函数 */
  setGlobalData: (data: Partial<DataContextType>) => void
  /** 可选的回调函数，当解析到关键词时触发 */
  onKeywordExtracted?: (keyword: string) => void
  /** 可选的 AI 流解析适配器 */
  adapter?: AIStreamAdapter
}

export type ParseResult = {
  /** 是否成功解析 */
  success: boolean
  /** 解析出的关键词 */
  keyword?: string
  /** 更新后的缓冲区 */
  newBuffer: string
}

/**
 * AI 流解析适配器接口
 * 用于适配不同 AI 模型的流式响应格式
 */
export type AIStreamAdapter = {
  /** 解析流数据块并返回内容字符串 */
  parse(chunk: Uint8Array): string
}

/**
 * 星火大模型流解析适配器
 * 实现星火大模型 SSE 流数据的解析逻辑
 */
export class SparkStreamAdapter implements AIStreamAdapter {
  parse(chunk: Uint8Array): string {
    const decoder = new TextDecoder('utf-8')

    try {
      const decoded = decoder.decode(chunk)
      console.log('[DEBUG] AI stream chunk:', decoded)
      const parsed = JSON.parse(decoded)
      return (
        parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || ''
      )
    } catch {
      return ''
    }
  }
}

/**
 * OpenAI 流解析适配器
 * 实现 OpenAI 兼容模型的 SSE 流数据解析逻辑
 */
export class OpenAIStreamAdapter implements AIStreamAdapter {
  parse(chunk: Uint8Array): string {
    const decoder = new TextDecoder('utf-8')

    try {
      const decoded = decoder.decode(chunk)
      const parsed = JSON.parse(decoded)

      return parsed.choices?.[0]?.delta?.content || ''
    } catch {
      return ''
    }
  }
}

/**
 * 创建 AI 流解析适配器工厂函数
 * 根据适配器类型创建对应的适配器实例
 * @param adapterType - 适配器类型
 * @returns AI 流解析适配器实例
 */
export function createStreamAdapter(adapterType: Adapter = 'spark'): AIStreamAdapter {
  switch (adapterType) {
    case 'spark':
      return new SparkStreamAdapter()
    case 'openai':
      return new OpenAIStreamAdapter()
    case 'custom':
      // 自定义适配器，可以扩展为从配置中读取自定义解析逻辑
      return new OpenAIStreamAdapter()
    default:
      return new SparkStreamAdapter()
  }
}

/**
 * 从 SSE 流数据中解析出内容片段（使用星火大模型适配器）
 * @param value - 流数据块
 * @returns 解析出的内容字符串
 */
export function parseStreamChunk(value: Uint8Array): string {
  const adapter = new SparkStreamAdapter()
  return adapter.parse(value)
}

/**
 * 检查内容是否应该被跳过
 * @param data - 内容字符串
 * @returns 是否应该跳过
 */
export function shouldSkipContent(data: string): boolean {
  if (data === '[' || data === ']') return true
  if (data === '') return true
  return false
}

/**
 * 从缓冲区中提取完整的关键词
 * @param buffer - 当前缓冲区内容
 * @returns 解析结果
 */
export function extractKeywordFromBuffer(buffer: string): ParseResult {
  // 匹配模式："keyword" 后面跟着逗号或数组结束
  const keywordMatch = buffer.match(/"([^"]*)"(?=\s*,|\s*\]|$)/)

  if (!keywordMatch) {
    return { success: false, newBuffer: buffer }
  }

  const keyword = keywordMatch[1].trim()

  if (!keyword) {
    return { success: false, newBuffer: buffer }
  }

  // 从缓冲区中移除已处理的部分
  let newBuffer = buffer.slice(keywordMatch[0].length + keywordMatch.index!)
  // 清理开头的逗号和空格
  newBuffer = newBuffer.replace(/^[\s,]+/, '')

  return {
    success: true,
    keyword,
    newBuffer,
  }
}

/**
 * 将关键词添加到全局数据中
 * @param options - 解析选项
 * @param keyword - 要添加的关键词
 */
export function addKeywordToGlobalData(options: StreamParserOptions, keyword: string): void {
  const { favKey, getGlobalData, setGlobalData } = options
  const globalData = getGlobalData()

  let targetKeyword = globalData.keyword.find((item) => item.favoriteDataId === +favKey)

  if (targetKeyword == null) {
    targetKeyword = {
      favoriteDataId: +favKey,
      value: [{ id: uuid(), value: keyword }],
    }
    setGlobalData({
      keyword: [...globalData.keyword, targetKeyword],
    })
  } else {
    // 检查关键词是否已存在，避免重复
    const exists = targetKeyword.value.some((k) => k.value === keyword)
    if (!exists) {
      targetKeyword.value.push({ id: uuid(), value: keyword })
      setGlobalData({
        keyword: [...globalData.keyword],
      })
    }
  }

  // 触发回调
  options.onKeywordExtracted?.(keyword)
}

/**
 * 处理单个流数据块
 * @param options - 解析选项
 * @param buffer - 当前缓冲区
 * @param value - 流数据块
 * @returns 更新后的缓冲区
 */
export function processStreamChunk(
  options: StreamParserOptions,
  buffer: string,
  value: Uint8Array,
): string {
  // 使用传入的适配器或默认的星火适配器
  const adapter = options.adapter || new SparkStreamAdapter()
  const data = adapter.parse(value)

  // 跳过不需要的内容
  if (shouldSkipContent(data)) {
    return buffer
  }

  // 累积到缓冲区
  let newBuffer = buffer + data

  // 尝试提取完整的关键词
  const result = extractKeywordFromBuffer(newBuffer)

  if (result.success && result.keyword) {
    addKeywordToGlobalData(options, result.keyword)
    return result.newBuffer
  }

  return newBuffer
}

/**
 * 创建 AI Stream 解析器
 * @param options - 解析选项
 * @returns 解析器对象
 */
export function createAIStreamParser(options: StreamParserOptions) {
  let buffer = ''
  // 使用传入的适配器或默认的星火适配器
  const adapter = options.adapter || new SparkStreamAdapter()

  return {
    /**
     * 处理单个数据块
     * @param value - 流数据块
     */
    processChunk(value: Uint8Array): void {
      const data = adapter.parse(value)
      console.log('[AIStreamParser] Received data:', data)

      // 跳过不需要的内容
      if (shouldSkipContent(data)) {
        return
      }

      // 累积到缓冲区
      buffer += data

      // 尝试提取完整的关键词
      const result = extractKeywordFromBuffer(buffer)

      if (result.success && result.keyword) {
        addKeywordToGlobalData(options, result.keyword)
        buffer = result.newBuffer
      }
    },

    /**
     * 获取当前缓冲区内容
     */
    getBuffer(): string {
      return buffer
    },

    /**
     * 清空缓冲区
     */
    clearBuffer(): void {
      buffer = ''
    },

    /**
     * 处理剩余缓冲区内容
     */
    flush(): void {
      const result = extractKeywordFromBuffer(buffer)
      if (result.success && result.keyword) {
        addKeywordToGlobalData(options, result.keyword)
      }
      buffer = ''
    },
  }
}
