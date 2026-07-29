import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  adapterParse: vi.fn(),
  dbSet: vi.fn(),
  fetchPersonalityAnalysis: vi.fn(),
  notifyAiAnalysisDone: vi.fn(),
  recordSuccessfulUse: vi.fn(),
  resetStarInvitation: vi.fn(),
  showStarInvitationAfterClose: vi.fn(),
}))

vi.mock('zustand/react/shallow', () => ({
  useShallow: (selector: unknown) => selector,
}))

vi.mock('@/store/global-data', () => ({
  useGlobalConfig: (selector: (state: { aiConfig: { configMode: 'free' } }) => unknown) =>
    selector({
      aiConfig: {
        configMode: 'free',
      },
    }),
}))

vi.mock('@/utils/api', () => ({
  fetchPersonalityAnalysis: mocks.fetchPersonalityAnalysis,
}))

vi.mock('@/utils/keyword-extractor', () => ({
  quickExtractKeywords: vi.fn(() => ['编程']),
}))

vi.mock('@/hooks/use-create-keyword-by-ai/ai-stream-parser', () => ({
  createStreamAdapter: vi.fn(() => ({
    parse: mocks.adapterParse,
  })),
}))

vi.mock('@/utils/indexed-db', () => ({
  default: {
    get: vi.fn(),
    isExpired: vi.fn(() => Promise.resolve(true)),
    set: mocks.dbSet,
  },
}))

vi.mock('@/utils/pet-message', () => ({
  notifyAiAnalysisDone: mocks.notifyAiAnalysisDone,
}))

vi.mock('@/hooks/use-star-invitation', () => ({
  useStarInvitation: () => ({
    recordSuccessfulUse: mocks.recordSuccessfulUse,
    resetStarInvitation: mocks.resetStarInvitation,
    showStarInvitationAfterClose: mocks.showStarInvitationAfterClose,
  }),
}))

import {
  type PersonalityResult,
  usePersonalityAnalysis,
} from '../src/options/components/personality/use-personality-analysis'

const personalityResult: PersonalityResult = {
  type: 'INTJ',
  title: '建筑师',
  description: '善于独立思考和规划。',
  dimensions: {
    EI: { tendency: 'I', score: 70, reason: '偏好独立探索' },
    SN: { tendency: 'N', score: 65, reason: '关注抽象概念' },
    TF: { tendency: 'T', score: 60, reason: '重视逻辑分析' },
    JP: { tendency: 'J', score: 75, reason: '喜欢提前规划' },
  },
  interests: ['编程'],
  suggestions: ['保持探索'],
}

const createAnalysisStream = () => {
  const reader = {
    read: vi
      .fn()
      .mockResolvedValueOnce({ done: false, value: new Uint8Array([1]) })
      .mockResolvedValueOnce({ done: true, value: undefined }),
  }

  return {
    cancel: vi.fn(),
    toReadableStream: () => ({
      getReader: () => reader,
    }),
  }
}

describe('usePersonalityAnalysis Star invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchPersonalityAnalysis.mockResolvedValue(createAnalysisStream())
    mocks.adapterParse.mockReturnValue(JSON.stringify(personalityResult))
    mocks.dbSet.mockResolvedValue(undefined)
    mocks.recordSuccessfulUse.mockResolvedValue(undefined)
  })

  it('开始分析时重置当前提示周期，成功生成新结果后记录一次使用', async () => {
    const { result } = renderHook(() =>
      usePersonalityAnalysis(
        [{ id: 1, title: '默认收藏夹', media_count: 1 }],
        [{ title: 'React 架构实践' }],
      ),
    )

    await act(async () => {
      await result.current.startAnalysis()
    })

    expect(mocks.resetStarInvitation).toHaveBeenCalledTimes(1)
    expect(mocks.recordSuccessfulUse).toHaveBeenCalledTimes(1)
    expect(mocks.notifyAiAnalysisDone).toHaveBeenCalledWith('建筑师')
    expect(result.current.result).toEqual(personalityResult)
  })

  it('AI 返回异常结果时不记录使用', async () => {
    mocks.adapterParse.mockReturnValue('invalid json')
    const { result } = renderHook(() =>
      usePersonalityAnalysis(
        [{ id: 1, title: '默认收藏夹', media_count: 1 }],
        [{ title: 'React 架构实践' }],
      ),
    )

    await act(async () => {
      await result.current.startAnalysis()
    })

    expect(mocks.recordSuccessfulUse).not.toHaveBeenCalled()
    expect(result.current.error).toBe('AI 返回格式异常，请重试')
  })
})
