import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/utils/promise', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}))

vi.mock('../src/utils/tab', () => ({
  queryAndSendMessage: vi.fn(),
}))

vi.mock('../src/utils/indexed-db', () => ({
  default: {
    get: vi.fn(() => Promise.resolve(null)),
    isExpired: vi.fn(() => Promise.resolve(true)),
    set: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

import { fetchAllFavoriteMedias } from '../src/utils/api'
import { queryAndSendMessage } from '../src/utils/tab'

const media = (id: number) => ({ id, title: `video-${id}` }) as any

const page = (ids: number[], hasMore: boolean) => ({
  code: 0,
  message: '0',
  ttl: 1,
  data: {
    info: {} as any,
    medias: ids.map(media),
    has_more: hasMore,
    ttl: 1,
  },
})

describe('favorite pagination guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('分页重叠时去重，但保留后续页真正的新视频', async () => {
    vi.mocked(queryAndSendMessage)
      .mockResolvedValueOnce(page([1, 2], true))
      .mockResolvedValueOnce(page([2, 3], false))

    const result = await fetchAllFavoriteMedias('100', { expireTime: 0 })

    expect(result.map((item) => item.id)).toEqual([1, 2, 3])
    expect(queryAndSendMessage).toHaveBeenCalledTimes(2)
  })

  it('B 站重复返回同一页时立即停止，避免无限分页', async () => {
    vi.mocked(queryAndSendMessage)
      .mockResolvedValueOnce(page([1, 2], true))
      .mockResolvedValueOnce(page([1, 2], true))

    await expect(fetchAllFavoriteMedias('100', { expireTime: 0 })).rejects.toThrow('重复')
    expect(queryAndSendMessage).toHaveBeenCalledTimes(2)
  })

  it('连续空页仍声称 has_more 时停止，避免无休止请求', async () => {
    vi.mocked(queryAndSendMessage)
      .mockResolvedValueOnce(page([], true))
      .mockResolvedValueOnce(page([], true))

    await expect(fetchAllFavoriteMedias('100', { expireTime: 0 })).rejects.toThrow('连续页面没有新视频')
    expect(queryAndSendMessage).toHaveBeenCalledTimes(2)
  })
})
