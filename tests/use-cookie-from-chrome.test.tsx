import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  hasBilibiliTab: vi.fn(),
  queryAndSendMessage: vi.fn(),
  setGlobalData: vi.fn(),
}))

vi.mock('@/utils/tab', () => ({
  hasBilibiliTab: mocks.hasBilibiliTab,
  queryAndSendMessage: mocks.queryAndSendMessage,
}))

vi.mock('@/store/global-data', () => ({
  useGlobalConfig: (
    selector: (state: {
      cookie: string | undefined
      setGlobalData: (data: { cookie?: string }) => void
    }) => unknown,
  ) =>
    selector({
      cookie: mocks.cookie,
      setGlobalData: mocks.setGlobalData,
    }),
}))

import { useCookieFromChrome } from '../src/hooks/use-cookie'

describe('useCookieFromChrome', () => {
  beforeEach(() => {
    mocks.cookie = undefined
    mocks.queryAndSendMessage.mockReset()
    mocks.hasBilibiliTab.mockReset()
    mocks.hasBilibiliTab.mockResolvedValue(true)
    mocks.setGlobalData.mockReset()
    mocks.setGlobalData.mockImplementation((data: { cookie?: string }) => {
      mocks.cookie = data.cookie
    })
  })

  it('通过消息读取 Cookie，并同步到 Zustand 后刷新登录状态', async () => {
    mocks.queryAndSendMessage.mockResolvedValue('DedeUserID=123; bili_jct=csrf-token')

    const { result } = renderHook(() => useCookieFromChrome(true))

    expect(result.current.isChecking).toBe(true)

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
      expect(result.current.isLogin).toBe(true)
    })

    expect(mocks.queryAndSendMessage).toHaveBeenCalledWith({
      type: 'getCookieFromChrome',
    })
    expect(mocks.setGlobalData).toHaveBeenCalledWith({
      cookie: 'DedeUserID=123; bili_jct=csrf-token',
    })
    expect(mocks.hasBilibiliTab).toHaveBeenCalledTimes(1)
  })

  it('Cookie 有效但没有任何 B 站 Tab 时仍然显示未登录状态', async () => {
    mocks.queryAndSendMessage.mockResolvedValue('DedeUserID=123; bili_jct=csrf-token')
    mocks.hasBilibiliTab.mockResolvedValue(false)

    const { result } = renderHook(() => useCookieFromChrome(true))

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.hasBilibiliTab).toBe(false)
    expect(result.current.isLogin).toBe(false)
  })

  it('非 Popup 页面直接使用 Zustand 中已同步的 Cookie', async () => {
    mocks.cookie = 'DedeUserID=123; bili_jct=csrf-token'

    const { result } = renderHook(() => useCookieFromChrome(false))

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
      expect(result.current.isLogin).toBe(true)
    })

    expect(mocks.queryAndSendMessage).not.toHaveBeenCalled()
    expect(mocks.hasBilibiliTab).toHaveBeenCalledTimes(1)
  })
})
