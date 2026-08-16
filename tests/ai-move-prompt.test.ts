import { describe, expect, it } from 'vitest'
import { buildAIMoveMessages } from '../src/background/utils'

describe('buildAIMoveMessages', () => {
  it('把多重标签命中的候选收藏夹写入 AI 输入', async () => {
    const messages = await buildAIMoveMessages(
      [{ id: 1, title: 'TypeScript 全栈实践', candidateFavorites: ['前端', '后端'] }],
      ['默认收藏夹', '前端', '后端'],
      { 前端: ['TypeScript'], 后端: ['TypeScript'] },
    )

    expect(String(messages.at(-1)?.content)).toContain('candidateFavorites')
    expect(String(messages.at(-1)?.content)).toContain('前端')
    expect(String(messages[0].content)).toContain('已被用户确认的内容特征')
  })
})
