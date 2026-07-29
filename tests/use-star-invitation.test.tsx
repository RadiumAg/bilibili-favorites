import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/star-invitation', () => ({
  recordSuccessfulUseForStarInvitation: vi.fn(),
  requestPendingStarInvitation: vi.fn(),
}))

import { useStarInvitation } from '../src/hooks/use-star-invitation'
import {
  recordSuccessfulUseForStarInvitation,
  requestPendingStarInvitation,
} from '../src/utils/star-invitation'

describe('useStarInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(recordSuccessfulUseForStarInvitation).mockResolvedValue(false)
  })

  it('成功记录待提示状态后，在完成弹层关闭时请求展示', async () => {
    vi.mocked(recordSuccessfulUseForStarInvitation).mockResolvedValue(true)
    const { result } = renderHook(() => useStarInvitation())

    await act(async () => {
      await result.current.recordSuccessfulUse()
    })
    act(() => {
      result.current.showStarInvitationAfterClose()
    })

    expect(requestPendingStarInvitation).toHaveBeenCalledTimes(1)
  })

  it('没有待提示状态时不会请求展示', async () => {
    const { result } = renderHook(() => useStarInvitation())

    await act(async () => {
      await result.current.recordSuccessfulUse()
    })
    act(() => {
      result.current.showStarInvitationAfterClose()
    })

    expect(requestPendingStarInvitation).not.toHaveBeenCalled()
  })

  it('新一轮整理开始时会清除上一轮尚未触发的内存状态', async () => {
    vi.mocked(recordSuccessfulUseForStarInvitation).mockResolvedValue(true)
    const { result } = renderHook(() => useStarInvitation())

    await act(async () => {
      await result.current.recordSuccessfulUse()
    })
    act(() => {
      result.current.resetStarInvitation()
      result.current.showStarInvitationAfterClose()
    })

    expect(requestPendingStarInvitation).not.toHaveBeenCalled()
  })
})
