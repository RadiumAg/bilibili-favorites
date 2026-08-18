import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchAIMove: vi.fn(),
  fetchAllFavoriteMedias: vi.fn(),
  moveVideosCache: vi.fn(),
  queryAndSendMessage: vi.fn(),
  requestOriginPermission: vi.fn(),
  recordSuccessfulUse: vi.fn(),
  resetStarInvitation: vi.fn(),
  showStarInvitationAfterClose: vi.fn(),
  toast: vi.fn(),
}))

let storeState = {
  keyword: [],
  favoriteData: [{ id: 1, title: '收藏夹 1', media_count: 1 }],
  defaultFavoriteId: 1,
  aiConfig: {
    configMode: 'custom' as const,
    key: 'test-key',
    baseUrl: 'https://example.com/v1',
    model: 'test-model',
    extraParams: {},
    adapter: 'spark' as const,
  },
  cookie: '',
}

vi.mock('zustand/react/shallow', () => ({
  useShallow: (selector: unknown) => selector,
}))

vi.mock('@/store/global-data', () => ({
  useGlobalConfig: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}))

vi.mock('@/hooks', () => ({
  toast: mocks.toast,
  useFavoriteListData: () => ({ moveVideosCache: mocks.moveVideosCache }),
}))

vi.mock('@/hooks/use-star-invitation', () => ({
  useStarInvitation: () => ({
    recordSuccessfulUse: mocks.recordSuccessfulUse,
    resetStarInvitation: mocks.resetStarInvitation,
    showStarInvitationAfterClose: mocks.showStarInvitationAfterClose,
  }),
}))

vi.mock('@/utils/api', () => ({
  fetchAIMove: mocks.fetchAIMove,
  fetchAllFavoriteMedias: mocks.fetchAllFavoriteMedias,
}))

vi.mock('@/utils/tab', () => ({
  queryAndSendMessage: mocks.queryAndSendMessage,
}))

vi.mock('@/utils/promise', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/utils/origin-permission', () => ({
  requestOriginPermission: mocks.requestOriginPermission,
}))

vi.mock('@/utils/pet-message', () => ({
  notifyOrganizeDone: vi.fn(),
}))

vi.mock('@/hooks/use-create-keyword-by-ai/ai-stream-parser', () => ({
  createStreamAdapter: vi.fn(),
}))

vi.mock('@/components/finished-animate', () => ({
  default: () => null,
}))

vi.mock('@/components/ui/button', () => ({
  Button: () => null,
}))

vi.mock('@/assets/loading.gif', () => ({ default: 'loading.gif' }))

import { useAIMove } from '../src/popup/components/ai-move/use-ai-move'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolvePromise: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve(value) {
      resolvePromise?.(value)
    },
  }
}

const createVideo = (id: number, title: string) => ({ id, title })

describe('useAIMove single run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requestOriginPermission.mockResolvedValue(true)
    storeState = {
      ...storeState,
      favoriteData: [{ id: 1, title: '收藏夹 1', media_count: 1 }],
      defaultFavoriteId: 1,
    }
  })

  it('取消权限请求阶段的旧任务后，旧任务不会继续读取收藏夹数据', async () => {
    const permissionRequest = createDeferred<boolean>()
    mocks.requestOriginPermission.mockReturnValueOnce(permissionRequest.promise)

    const { result } = renderHook(() => useAIMove())

    let run: Promise<void> | undefined
    act(() => {
      run = result.current.handleAIMove()
    })

    expect(mocks.fetchAllFavoriteMedias).not.toHaveBeenCalled()

    act(() => {
      result.current.cancelMove()
    })

    await act(async () => {
      permissionRequest.resolve(true)
      await run
    })

    expect(mocks.fetchAllFavoriteMedias).not.toHaveBeenCalled()
    expect(mocks.fetchAIMove).not.toHaveBeenCalled()
  })

  it('取消数据请求阶段的旧任务后，旧任务不会继续进入 AI 整理', async () => {
    const firstRequest = createDeferred<Array<{ id: number; title: string }>>()
    const secondRequest = createDeferred<Array<{ id: number; title: string }>>()
    mocks.fetchAllFavoriteMedias
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const { result, rerender } = renderHook(() => useAIMove())

    let firstRun: Promise<void> | undefined
    act(() => {
      firstRun = result.current.handleAIMove()
    })
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.handleAIMove()
    })
    expect(mocks.fetchAllFavoriteMedias).toHaveBeenCalledTimes(1)
    expect(mocks.toast).toHaveBeenCalledWith({
      title: '已有整理任务进行中',
      description: '请先取消当前任务后再开始新的整理',
    })

    act(() => {
      result.current.cancelMove()
    })

    storeState = {
      ...storeState,
      favoriteData: [{ id: 2, title: '收藏夹 2', media_count: 1 }],
      defaultFavoriteId: 2,
    }
    rerender()

    let secondRun: Promise<void> | undefined
    act(() => {
      secondRun = result.current.handleAIMove()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(mocks.fetchAllFavoriteMedias).toHaveBeenNthCalledWith(2, '2', { mediaCount: 1 })

    await act(async () => {
      firstRequest.resolve([createVideo(1, '旧视频')])
      await firstRun
    })

    expect(mocks.fetchAIMove).not.toHaveBeenCalled()
    expect(mocks.queryAndSendMessage).not.toHaveBeenCalled()
    expect(mocks.recordSuccessfulUse).not.toHaveBeenCalled()
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: '整理失败' }))
    expect(result.current.isLoadingElement.props.className).not.toContain('hidden')

    act(() => {
      result.current.cancelMove()
    })
    await act(async () => {
      secondRequest.resolve([createVideo(2, '新视频')])
      await secondRun
    })
  })
})
