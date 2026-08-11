import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageEnum } from '../src/utils/message'
import { readBilibiliCookieFromChrome } from '../src/utils/cookie'
import { queryAndSendMessage } from '../src/utils/tab'

describe('Chrome Cookie message routing', () => {
  const runtimeSendMessage = vi.fn()
  const tabsQuery = vi.fn()
  const tabsSendMessage = vi.fn()
  const cookiesGet = vi.fn()

  beforeEach(() => {
    runtimeSendMessage.mockReset()
    tabsQuery.mockReset()
    tabsSendMessage.mockReset()
    cookiesGet.mockReset()

    vi.stubGlobal('chrome', {
      cookies: {
        get: cookiesGet,
      },
      runtime: {
        lastError: undefined,
        sendMessage: runtimeSendMessage,
      },
      tabs: {
        query: tabsQuery,
        sendMessage: tabsSendMessage,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('仅通过 chrome.cookies 读取必要的 B 站 Cookie', async () => {
    cookiesGet.mockImplementation(async ({ name }: { name: string }) => ({
      name,
      value: name === 'DedeUserID' ? '123' : 'csrf-token',
    }))

    await expect(readBilibiliCookieFromChrome()).resolves.toBe(
      'DedeUserID=123; bili_jct=csrf-token',
    )
    expect(cookiesGet).toHaveBeenNthCalledWith(1, {
      url: 'https://www.bilibili.com/',
      name: 'DedeUserID',
    })
    expect(cookiesGet).toHaveBeenNthCalledWith(2, {
      url: 'https://www.bilibili.com/',
      name: 'bili_jct',
    })
  })

  it('getCookieFromChrome 通过 Background 消息读取，不依赖 B 站标签页', async () => {
    runtimeSendMessage.mockImplementation((message, callback) => {
      callback('DedeUserID=123; bili_jct=csrf-token')
    })

    await expect(
      queryAndSendMessage<string>({ type: MessageEnum.getCookieFromChrome }),
    ).resolves.toBe('DedeUserID=123; bili_jct=csrf-token')

    expect(runtimeSendMessage).toHaveBeenCalledWith(
      { type: MessageEnum.getCookieFromChrome },
      expect.any(Function),
    )
    expect(tabsQuery).not.toHaveBeenCalled()
  })

  it('收藏夹接口仍然发送给 B 站内容脚本', async () => {
    tabsQuery.mockImplementation((_query, callback) => callback([{ id: 7 }]))
    tabsSendMessage.mockImplementation((_tabId, _message, callback) => {
      callback({ code: 0 })
    })

    await expect(queryAndSendMessage({ type: MessageEnum.getFavoriteList })).resolves.toEqual({
      code: 0,
    })

    expect(tabsSendMessage).toHaveBeenCalledWith(
      7,
      { type: MessageEnum.getFavoriteList },
      expect.any(Function),
    )
    expect(runtimeSendMessage).not.toHaveBeenCalled()
  })
})
