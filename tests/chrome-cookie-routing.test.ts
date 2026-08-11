import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageEnum } from '../src/utils/message'
import { readBilibiliCookieFromChrome } from '../src/utils/cookie'
import { hasBilibiliTab, queryAndSendMessage } from '../src/utils/tab'

describe('Chrome Cookie message routing', () => {
  const runtimeSendMessage = vi.fn()
  const tabsQuery = vi.fn()
  const tabsSendMessage = vi.fn()
  const cookiesGet = vi.fn()
  const scriptingExecuteScript = vi.fn()
  const scriptingInsertCSS = vi.fn()
  const runtimeApi: {
    lastError?: { message: string }
    getManifest: ReturnType<typeof vi.fn>
    sendMessage: ReturnType<typeof vi.fn>
  } = {
    getManifest: vi.fn(),
    sendMessage: runtimeSendMessage,
  }

  beforeEach(() => {
    runtimeSendMessage.mockReset()
    tabsQuery.mockReset()
    tabsSendMessage.mockReset()
    cookiesGet.mockReset()
    scriptingExecuteScript.mockReset()
    scriptingInsertCSS.mockReset()
    runtimeApi.lastError = undefined
    runtimeApi.getManifest.mockReset()
    runtimeApi.getManifest.mockReturnValue({
      content_scripts: [
        {
          js: ['assets/pet-main.js'],
          world: 'MAIN',
        },
        {
          js: ['assets/content-script.js'],
          css: ['assets/content-script.css'],
        },
      ],
    })

    vi.stubGlobal('chrome', {
      cookies: {
        get: cookiesGet,
      },
      runtime: runtimeApi,
      scripting: {
        executeScript: scriptingExecuteScript,
        insertCSS: scriptingInsertCSS,
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

  it('没有任何 B 站标签页时返回 false', async () => {
    tabsQuery.mockImplementation((_query, callback) => callback([]))

    await expect(hasBilibiliTab()).resolves.toBe(false)
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

  it('现有 B 站页面缺少 Content Script 时自动注入并重试', async () => {
    let hasContentScript = false
    tabsQuery.mockImplementation((_query, callback) => callback([{ id: 7 }]))
    scriptingExecuteScript.mockImplementation(async () => {
      hasContentScript = true
      return []
    })
    tabsSendMessage.mockImplementation((_tabId, message, callback) => {
      if (!hasContentScript) {
        runtimeApi.lastError = {
          message: 'Could not establish connection. Receiving end does not exist.',
        }
        callback(undefined)
        runtimeApi.lastError = undefined
        return
      }

      callback(message.type === MessageEnum.pingContentScript ? true : { code: 0 })
    })

    await expect(queryAndSendMessage({ type: MessageEnum.getAllFavoriteFlag })).resolves.toEqual({
      code: 0,
    })

    expect(scriptingExecuteScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['assets/content-script.js'],
    })
    expect(scriptingInsertCSS).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['assets/content-script.css'],
    })
    expect(tabsSendMessage).toHaveBeenCalledWith(
      7,
      { type: MessageEnum.pingContentScript },
      expect.any(Function),
    )
    expect(tabsSendMessage).toHaveBeenLastCalledWith(
      7,
      { type: MessageEnum.getAllFavoriteFlag },
      expect.any(Function),
    )
  })
})
