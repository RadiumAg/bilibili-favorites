import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteFavoriteResources, moveFavorite, restoreFavoriteResource } from '../src/utils/api'

const cookies = 'DedeUserID=123; bili_jct=test-csrf'

describe('favorite resource operations', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ code: 0, message: '0' }),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('移动收藏时要求 B 站业务 code 为 0', async () => {
    await moveFavorite(1, 2, 3, cookies)
    const [, options] = vi.mocked(fetch).mock.calls[0]
    const body = options?.body as URLSearchParams
    expect(body.get('src_media_id')).toBe('1')
    expect(body.get('tar_media_id')).toBe('2')
    expect(body.get('resources')).toBe('3:2')

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ code: -509, message: '请求频率过高' }),
    } as Response)
    await expect(moveFavorite(1, 2, 3, cookies)).rejects.toThrow('请求频率过高')
  })

  it('批量删除时携带收藏夹、视频和 CSRF 参数', async () => {
    await deleteFavoriteResources(9, [11, 12], cookies)

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    const body = options?.body as URLSearchParams
    expect(url).toBe('https://api.bilibili.com/x/v3/fav/resource/batch-del')
    expect(body.get('media_id')).toBe('9')
    expect(body.get('resources')).toBe('11:2,12:2')
    expect(body.get('csrf')).toBe('test-csrf')
  })

  it('恢复时将视频重新加入原收藏夹', async () => {
    await restoreFavoriteResource(9, 11, cookies)

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    const body = options?.body as URLSearchParams
    expect(url).toBe('https://api.bilibili.com/x/v3/fav/resource/deal')
    expect(body.get('rid')).toBe('11')
    expect(body.get('type')).toBe('2')
    expect(body.get('add_media_ids')).toBe('9')
  })

  it('B 站返回错误时抛出明确错误', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ code: -403, message: '权限不足' }),
    } as Response)

    await expect(deleteFavoriteResources(9, [11], cookies)).rejects.toThrow('权限不足')
  })
})
