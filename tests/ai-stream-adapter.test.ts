import { describe, it, expect } from 'vitest'
import { SparkStreamAdapter, OpenAIStreamAdapter, createStreamAdapter } from '../src/hooks/use-create-keyword-by-ai/ai-stream-parser'

describe('AIStreamAdapter', () => {
  describe('SparkStreamAdapter', () => {
    const adapter = new SparkStreamAdapter()

    it('应该解析星火大模型的 content 字段', () => {
      const mockData = {
        choices: [
          {
            delta: {
              content: '测试内容',
            },
          },
        ],
      }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('测试内容')
    })

    it('应该解析星火大模型的 reasoning_content 字段', () => {
      const mockData = {
        choices: [
          {
            delta: {
              reasoning_content: '推理内容',
            },
          },
        ],
      }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('推理内容')
    })

    it('content 字段优先级高于 reasoning_content', () => {
      const mockData = {
        choices: [
          {
            delta: {
              content: '主要内容',
              reasoning_content: '推理内容',
            },
          },
        ],
      }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('主要内容')
    })

    it('无效 JSON 应该返回空字符串', () => {
      const chunk = new TextEncoder().encode('invalid json')

      const result = adapter.parse(chunk)
      expect(result).toBe('')
    })

    it('缺少 choices 字段应该返回空字符串', () => {
      const mockData = { other: 'data' }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('')
    })
  })

  describe('OpenAIStreamAdapter', () => {
    const adapter = new OpenAIStreamAdapter()

    it('应该解析 OpenAI 兼容的 content 字段', () => {
      const mockData = {
        choices: [
          {
            delta: {
              content: 'OpenAI 内容',
            },
          },
        ],
      }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('OpenAI 内容')
    })

    it('无效 JSON 应该返回空字符串', () => {
      const chunk = new TextEncoder().encode('invalid json')

      const result = adapter.parse(chunk)
      expect(result).toBe('')
    })

    it('缺少 choices 字段应该返回空字符串', () => {
      const mockData = { other: 'data' }
      const chunk = new TextEncoder().encode(JSON.stringify(mockData))

      const result = adapter.parse(chunk)
      expect(result).toBe('')
    })
  })

  describe('createStreamAdapter', () => {
    it('应该创建星火适配器', () => {
      const adapter = createStreamAdapter('spark')
      expect(adapter).toBeInstanceOf(SparkStreamAdapter)
    })

    it('应该创建 OpenAI 适配器', () => {
      const adapter = createStreamAdapter('openai')
      expect(adapter).toBeInstanceOf(OpenAIStreamAdapter)
    })

    it('应该为 custom 类型创建 OpenAI 适配器', () => {
      const adapter = createStreamAdapter('custom')
      expect(adapter).toBeInstanceOf(OpenAIStreamAdapter)
    })
  })
})
