import { describe, it, expect, vi } from 'vitest'
import {
  extractKeywordFromBuffer,
  parseStreamChunk,
  shouldSkipContent,
} from '../src/hooks/use-create-keyword-by-ai/ai-stream-parser'

describe('parseStreamChunk', () => {
  it('应该解析有效的SSE流数据', () => {
    const data = {
      choices: [
        {
          delta: {
            content: 'hello world',
          },
        },
      ],
    }
    const encoder = new TextEncoder()
    const value = encoder.encode(JSON.stringify(data))

    const result = parseStreamChunk(value)

    expect(result).toBe('hello world')
  })

  it('应该解析reasoning_content字段', () => {
    const data = {
      choices: [
        {
          delta: {
            reasoning_content: 'thinking process',
          },
        },
      ],
    }
    const encoder = new TextEncoder()
    const value = encoder.encode(JSON.stringify(data))

    const result = parseStreamChunk(value)

    expect(result).toBe('thinking process')
  })

  it('content字段优先级高于reasoning_content', () => {
    const data = {
      choices: [
        {
          delta: {
            content: 'main content',
            reasoning_content: 'reasoning',
          },
        },
      ],
    }
    const encoder = new TextEncoder()
    const value = encoder.encode(JSON.stringify(data))

    const result = parseStreamChunk(value)

    expect(result).toBe('main content')
  })

  it('解析失败时应该返回空字符串', () => {
    const encoder = new TextEncoder()
    const value = encoder.encode('invalid json')

    const result = parseStreamChunk(value)

    expect(result).toBe('')
  })

  it('choices为空数组时应该返回空字符串', () => {
    const data = { choices: [] }
    const encoder = new TextEncoder()
    const value = encoder.encode(JSON.stringify(data))

    const result = parseStreamChunk(value)

    expect(result).toBe('')
  })

  it('delta字段不存在时应该返回空字符串', () => {
    const data = {
      choices: [
        {
          message: {
            content: 'hello',
          },
        },
      ],
    }
    const encoder = new TextEncoder()
    const value = encoder.encode(JSON.stringify(data))

    const result = parseStreamChunk(value)

    expect(result).toBe('')
  })
})

describe('shouldSkipContent', () => {
  it('应该跳过左方括号', () => {
    expect(shouldSkipContent('[')).toBe(true)
  })

  it('应该跳过右方括号', () => {
    expect(shouldSkipContent(']')).toBe(true)
  })

  it('应该跳过空字符串', () => {
    expect(shouldSkipContent('')).toBe(true)
  })

  it('不应该跳过正常内容', () => {
    expect(shouldSkipContent('hello')).toBe(false)
  })

  it('不应该跳过包含方括号的其他内容', () => {
    expect(shouldSkipContent('[hello]')).toBe(false)
  })
})

describe('实际AI流式输出场景 - 基于调试日志', () => {
  it('应该处理渐进式流输出 - 模拟图片中的实际场景', () => {
    // 模拟图片中展示的流式输出渐进缓冲区状态
    // 注意：在真实场景中，关键词是逐步累积的，每次提取完整的关键词后更新buffer
    const streamChunks = [
      { input: '"lang graph", "大模型", "agent"', expected: ['lang graph', '大模型', 'agent'] },
      { input: ', "智能体", "rag"', expected: ['智能体', 'rag'] },
      { input: ', "智能客服", "llm"', expected: ['智能客服', 'llm'] },
      { input: ', "langchain", "chatglm"', expected: ['langchain', 'chatglm'] },
      { input: ', "chatglm-4", "transformer"', expected: ['chatglm-4', 'transformer'] },
      { input: ', "deepseek", "nlp"]', expected: ['deepseek', 'nlp'] },
    ]

    const extractedKeywords: string[] = []
    let buffer = ''

    for (const chunk of streamChunks) {
      buffer += chunk.input
      // 循环提取所有完整的关键词
      while (true) {
        const result = extractKeywordFromBuffer(buffer)
        if (!result.success) break
        extractedKeywords.push(result.keyword!)
        buffer = result.newBuffer
      }

      // 验证每次处理后的关键词
      for (const expected of chunk.expected) {
        expect(extractedKeywords).toContain(expected)
      }
    }

    // 验证最终提取的所有关键词
    expect(extractedKeywords).toEqual([
      'lang graph',
      '大模型',
      'agent',
      '智能体',
      'rag',
      '智能客服',
      'llm',
      'langchain',
      'chatglm',
      'chatglm-4',
      'transformer',
      'deepseek',
      'nlp',
    ])
  })

  it('应该处理包含连字符和数字的关键词 - chatglm-4', () => {
    const result = extractKeywordFromBuffer('"chatglm-4", "next"')

    expect(result.success).toBe(true)
    expect(result.keyword).toBe('chatglm-4')
    expect(result.newBuffer).toBe('"next"')
  })

  it('应该处理短小的英文缩写关键词 - rag, llm, nlp', () => {
    const testCases = [
      { input: '"rag", "next"', expected: 'rag' },
      { input: '"llm", "next"', expected: 'llm' },
      { input: '"nlp"]', expected: 'nlp' },
    ]

    for (const testCase of testCases) {
      const result = extractKeywordFromBuffer(testCase.input)
      expect(result.success).toBe(true)
      expect(result.keyword).toBe(testCase.expected)
    }
  })

  it('应该正确解析包含转义引号的关键词', () => {
    const result = extractKeywordFromBuffer(String.raw`"AI \"Agent\"", "next"`)
    expect(result.success).toBe(true)
    expect(result.keyword).toBe('AI "Agent"')
    expect(result.newBuffer).toBe('"next"')
  })

  it('应该处理chatglm系列关键词的连续提取', () => {
    let buffer = '"chatglm", "chatglm-4", "next"'
    const keywords: string[] = []

    while (buffer.includes('"')) {
      const result = extractKeywordFromBuffer(buffer)
      if (!result.success) break
      keywords.push(result.keyword!)
      buffer = result.newBuffer
    }

    expect(keywords).toEqual(['chatglm', 'chatglm-4', 'next'])
  })

  it('应该处理混合中英文的复杂列表', () => {
    const buffer = '"lang graph", "大模型", "agent", "智能体", "rag", "智能客服", "llm"]'
    const keywords: string[] = []
    let currentBuffer = buffer

    while (true) {
      const result = extractKeywordFromBuffer(currentBuffer)
      if (!result.success) break
      keywords.push(result.keyword!)
      currentBuffer = result.newBuffer
    }

    expect(keywords).toEqual(['lang graph', '大模型', 'agent', '智能体', 'rag', '智能客服', 'llm'])
  })

  it('应该正确处理关键词被分割在多个chunk中的情况', () => {
    // 模拟 "chat" 和 "glm" 被分割在不同chunk中
    let buffer = ''
    const chunks = ['"chat', 'glm", "next"']
    const keywords: string[] = []

    for (const chunk of chunks) {
      buffer += chunk
      const result = extractKeywordFromBuffer(buffer)
      if (result.success && result.keyword) {
        keywords.push(result.keyword)
        buffer = result.newBuffer
      }
    }

    expect(keywords).toEqual(['chatglm'])
  })
})

describe('createAIStreamParser transaction', () => {
  it('同一个 chunk 中的多个标签全部暂存，commit 前不写入全局状态', async () => {
    const { createAIStreamParser } = await import(
      '../src/hooks/use-create-keyword-by-ai/ai-stream-parser'
    )
    let state: any = {
      keyword: [
        {
          favoriteDataId: 1,
          value: [{ id: 'manual', value: '人工标签' }],
        },
      ],
    }
    const setGlobalData = vi.fn((patch: any) => {
      state = { ...state, ...patch }
    })
    const parser = createAIStreamParser({
      favKey: '1',
      getGlobalData: () => state,
      setGlobalData,
      adapter: {
        parse: (chunk: Uint8Array) => new TextDecoder().decode(chunk),
      },
    } as any)

    parser.processChunk(new TextEncoder().encode('["AI标签一", "AI标签二", "AI标签一"]'))
    expect(parser.getPendingKeywords()).toEqual(['AI标签一', 'AI标签二'])
    expect(setGlobalData).not.toHaveBeenCalled()

    parser.flush()
    parser.commit()

    expect(state.keyword[0].value.map((item: any) => item.value)).toEqual([
      '人工标签',
      'AI标签一',
      'AI标签二',
    ])
  })

  it('流末尾残缺时拒绝 commit，从而不污染已有标签', async () => {
    const { createAIStreamParser } = await import(
      '../src/hooks/use-create-keyword-by-ai/ai-stream-parser'
    )
    let state: any = {
      keyword: [{ favoriteDataId: 1, value: [{ id: 'manual', value: '人工标签' }] }],
    }
    const setGlobalData = vi.fn((patch: any) => {
      state = { ...state, ...patch }
    })
    const parser = createAIStreamParser({
      favKey: '1',
      getGlobalData: () => state,
      setGlobalData,
      adapter: {
        parse: (chunk: Uint8Array) => new TextDecoder().decode(chunk),
      },
    } as any)

    parser.processChunk(new TextEncoder().encode('["AI标签一", "残缺'))
    expect(() => parser.flush()).toThrow('AI 标签输出不完整')
    expect(setGlobalData).not.toHaveBeenCalled()
    expect(state.keyword[0].value).toEqual([{ id: 'manual', value: '人工标签' }])
  })
})
