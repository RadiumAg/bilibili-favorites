import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchAIMove: vi.fn(),
  fetchAllFavoriteMedias: vi.fn(),
  createStreamAdapter: vi.fn(),
  moveVideosCache: vi.fn(),
  queryAndSendMessage: vi.fn(),
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
    configMode: 'free' as const,
    key: '',
    baseUrl: '',
    model: '',
    extraParams: {},
    adapter: 'spark' as const,
    aiMoveExecutionMode: 'ask' as 'ask' | 'auto',
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

vi.mock('@/utils/pet-message', () => ({
  notifyOrganizeDone: vi.fn(),
}))

vi.mock('@/hooks/use-create-keyword-by-ai/ai-stream-parser', () => ({
  createStreamAdapter: mocks.createStreamAdapter,
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

const createAIStream = (content: string) => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(content))
      controller.close()
    },
  })

  return {
    toReadableStream: () => stream,
    cancel: vi.fn(),
  }
}

describe('useAIMove single run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createStreamAdapter.mockReturnValue({
      parse: (chunk: Uint8Array) => new TextDecoder().decode(chunk),
    })
    mocks.queryAndSendMessage.mockResolvedValue(undefined)
    mocks.recordSuccessfulUse.mockResolvedValue(undefined)
    storeState = {
      ...storeState,
      favoriteData: [{ id: 1, title: '收藏夹 1', media_count: 1 }],
      defaultFavoriteId: 1,
      aiConfig: {
        ...storeState.aiConfig,
        aiMoveExecutionMode: 'ask',
      },
    }
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

  it('始终询问模式会等待确认，并按用户调整后的目标移动', async () => {
    storeState = {
      ...storeState,
      favoriteData: [
        { id: 1, title: '默认收藏夹', media_count: 1 },
        { id: 2, title: 'AI 推荐', media_count: 0 },
        { id: 3, title: '手动调整', media_count: 0 },
      ],
      defaultFavoriteId: 1,
      aiConfig: {
        ...storeState.aiConfig,
        aiMoveExecutionMode: 'ask',
      },
    }
    mocks.fetchAllFavoriteMedias.mockResolvedValue([createVideo(101, '测试视频')])
    mocks.fetchAIMove.mockResolvedValue(
      createAIStream(
        JSON.stringify([{ title: '测试视频', targetFavorite: 'AI 推荐', reason: 'AI 推荐理由' }]),
      ),
    )

    const { result } = renderHook(() => useAIMove())

    await act(async () => {
      await result.current.handleAIMove()
    })

    expect(mocks.queryAndSendMessage).not.toHaveBeenCalled()
    expect(result.current.isLoadingElement?.props['aria-label']).toBe('确认 AI 整理结果')

    act(() => {
      result.current.handleTargetChange(101, 3)
    })
    await act(async () => {
      await result.current.handleConfirmMove()
    })

    expect(mocks.queryAndSendMessage).toHaveBeenCalledTimes(1)
    expect(mocks.queryAndSendMessage).toHaveBeenCalledWith({
      type: 'moveVideo',
      data: {
        srcMediaId: 1,
        tarMediaId: 3,
        videoId: 101,
      },
    })
  })

  it('自动执行模式会在分析全部完成后直接移动', async () => {
    storeState = {
      ...storeState,
      favoriteData: [
        { id: 1, title: '默认收藏夹', media_count: 1 },
        { id: 2, title: '目标收藏夹', media_count: 0 },
      ],
      defaultFavoriteId: 1,
      aiConfig: {
        ...storeState.aiConfig,
        aiMoveExecutionMode: 'auto',
      },
    }
    mocks.fetchAllFavoriteMedias.mockResolvedValue([createVideo(202, '自动整理视频')])
    mocks.fetchAIMove.mockResolvedValue(
      createAIStream(
        JSON.stringify([
          { title: '自动整理视频', targetFavorite: '目标收藏夹', reason: '自动分类' },
        ]),
      ),
    )

    const { result } = renderHook(() => useAIMove())

    await act(async () => {
      await result.current.handleAIMove()
    })

    expect(mocks.queryAndSendMessage).toHaveBeenCalledTimes(1)
    expect(mocks.queryAndSendMessage).toHaveBeenCalledWith({
      type: 'moveVideo',
      data: {
        srcMediaId: 1,
        tarMediaId: 2,
        videoId: 202,
      },
    })
  })
})
