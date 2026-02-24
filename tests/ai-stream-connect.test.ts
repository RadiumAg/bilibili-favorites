import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Mock chrome.runtime.connect 和 port 通信
 * 测试 connectAndStream 的流式通信机制
 */

type PortMessageListener = (message: any) => void
type PortDisconnectListener = () => void

/**
 * 创建一个模拟的 chrome.runtime.Port
 */
const createMockPort = () => {
  const messageListeners: PortMessageListener[] = []
  const disconnectListeners: PortDisconnectListener[] = []
  let isDisconnected = false

  const port = {
    name: 'ai-stream',
    postMessage: vi.fn(),
    disconnect: vi.fn(() => {
      isDisconnected = true
    }),
    onMessage: {
      addListener: vi.fn((listener: PortMessageListener) => {
        messageListeners.push(listener)
      }),
      removeListener: vi.fn(),
    },
    onDisconnect: {
      addListener: vi.fn((listener: PortDisconnectListener) => {
        disconnectListeners.push(listener)
      }),
      removeListener: vi.fn(),
    },
  }

  return {
    port,
    simulateMessage: (message: any) => {
      messageListeners.forEach((listener) => listener(message))
    },
    simulateDisconnect: () => {
      disconnectListeners.forEach((listener) => listener())
    },
    isDisconnected: () => isDisconnected,
  }
}

/**
 * 模拟 connectAndStream 的核心逻辑（从 api.ts 中提取）
 * 这样可以在不依赖 chrome API 的情况下测试流式通信
 */
const connectAndStream = (
  mockPort: ReturnType<typeof createMockPort>['port'],
  message: { type: string; data: any },
) => {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      mockPort.onMessage.addListener((response: any) => {
        switch (response.type) {
          case 'chunk':
            controller.enqueue(encoder.encode(response.content))
            break
          case 'done':
            controller.close()
            mockPort.disconnect()
            break
          case 'error':
            controller.error(new Error(response.error))
            mockPort.disconnect()
            break
        }
      })

      mockPort.onDisconnect.addListener(() => {
        // 模拟 chrome.runtime.lastError 检查
      })

      mockPort.postMessage(message)
    },
  })

  return { toReadableStream: () => stream }
}

describe('AI Stream Connect (onConnect 流式通信)', () => {
  let mockPortContext: ReturnType<typeof createMockPort>

  beforeEach(() => {
    mockPortContext = createMockPort()
  })

  it('应该正确建立连接并发送初始消息', () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['React Hooks详解'], config: { apiKey: 'test-key', model: 'gpt-4' } },
    }

    connectAndStream(mockPortContext.port, message)

    expect(mockPortContext.port.postMessage).toHaveBeenCalledWith(message)
    expect(mockPortContext.port.onMessage.addListener).toHaveBeenCalled()
    expect(mockPortContext.port.onDisconnect.addListener).toHaveBeenCalled()
  })

  it('应该能流式接收多个 chunk 并拼接完整内容', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()
    const decoder = new TextDecoder()

    // 模拟 Background 端逐块发送
    mockPortContext.simulateMessage({ type: 'chunk', content: '["react"' })
    mockPortContext.simulateMessage({ type: 'chunk', content: ',"hooks"' })
    mockPortContext.simulateMessage({ type: 'chunk', content: ',"vue"]' })
    mockPortContext.simulateMessage({ type: 'done' })

    // 逐块读取并拼接
    let fullContent = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      fullContent += decoder.decode(value, { stream: true })
    }
    fullContent += decoder.decode()

    expect(fullContent).toBe('["react","hooks","vue"]')
  })

  it('应该在收到 done 消息后关闭流并断开连接', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()

    mockPortContext.simulateMessage({ type: 'chunk', content: 'hello' })
    mockPortContext.simulateMessage({ type: 'done' })

    // 读取所有数据
    const { value } = await reader.read()
    const { done } = await reader.read()

    expect(done).toBe(true)
    expect(mockPortContext.port.disconnect).toHaveBeenCalled()
  })

  it('应该在收到 error 消息后抛出错误并断开连接', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()

    mockPortContext.simulateMessage({ type: 'error', error: 'API key invalid' })

    await expect(reader.read()).rejects.toThrow('API key invalid')
    expect(mockPortContext.port.disconnect).toHaveBeenCalled()
  })

  it('应该能处理空 chunk（不影响最终结果）', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()
    const decoder = new TextDecoder()

    mockPortContext.simulateMessage({ type: 'chunk', content: '' })
    mockPortContext.simulateMessage({ type: 'chunk', content: 'data' })
    mockPortContext.simulateMessage({ type: 'chunk', content: '' })
    mockPortContext.simulateMessage({ type: 'done' })

    let fullContent = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      fullContent += decoder.decode(value, { stream: true })
    }
    fullContent += decoder.decode()

    expect(fullContent).toBe('data')
  })

  it('应该能处理大量 chunk 的流式传输', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()
    const decoder = new TextDecoder()

    // 模拟 100 个 chunk
    const chunkCount = 100
    for (let i = 0; i < chunkCount; i++) {
      mockPortContext.simulateMessage({ type: 'chunk', content: `chunk${i},` })
    }
    mockPortContext.simulateMessage({ type: 'done' })

    let fullContent = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      fullContent += decoder.decode(value, { stream: true })
    }
    fullContent += decoder.decode()

    // 验证所有 chunk 都被正确接收
    for (let i = 0; i < chunkCount; i++) {
      expect(fullContent).toContain(`chunk${i},`)
    }
  })

  it('toReadableStream 应该返回同一个 ReadableStream 实例', () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const stream1 = result.toReadableStream()
    const stream2 = result.toReadableStream()

    expect(stream1).toBe(stream2)
    expect(stream1).toBeInstanceOf(ReadableStream)
  })

  it('应该能正确处理 fetchAIMove 类型的消息', async () => {
    const message = {
      type: 'fetchAIMove',
      data: {
        videos: [{ id: 1, title: 'React教程' }],
        favoriteTitles: ['前端', '后端'],
        config: { apiKey: 'key', model: 'gpt-4' },
      },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()
    const decoder = new TextDecoder()

    const aiResponse = '[{"title":"React教程","targetFavorite":"前端","reason":"React是前端框架"}]'
    // 模拟分块发送 JSON
    mockPortContext.simulateMessage({ type: 'chunk', content: aiResponse.slice(0, 20) })
    mockPortContext.simulateMessage({ type: 'chunk', content: aiResponse.slice(20, 50) })
    mockPortContext.simulateMessage({ type: 'chunk', content: aiResponse.slice(50) })
    mockPortContext.simulateMessage({ type: 'done' })

    let fullContent = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      fullContent += decoder.decode(value, { stream: true })
    }
    fullContent += decoder.decode()

    expect(fullContent).toBe(aiResponse)

    // 验证可以解析为有效 JSON
    const parsed = JSON.parse(fullContent)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].targetFavorite).toBe('前端')
  })

  it('应该在 chunk 之间保持正确的接收顺序', async () => {
    const message = {
      type: 'fetchChatGpt',
      data: { titleArray: ['测试'], config: { apiKey: 'key', model: 'gpt-4' } },
    }

    const result = connectAndStream(mockPortContext.port, message)
    const reader = result.toReadableStream().getReader()
    const decoder = new TextDecoder()

    const chunks = ['first,', 'second,', 'third,', 'fourth,', 'fifth']
    chunks.forEach((chunk) => {
      mockPortContext.simulateMessage({ type: 'chunk', content: chunk })
    })
    mockPortContext.simulateMessage({ type: 'done' })

    const receivedChunks: string[] = []
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      receivedChunks.push(decoder.decode(value))
    }

    expect(receivedChunks).toEqual(chunks)
  })
})
