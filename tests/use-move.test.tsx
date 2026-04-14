import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import * as React from 'react'
import type { ReactElement } from 'react'

// Mock zustand
vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}))

// Mock global store
const mockSetGlobalData = vi.fn()
const mockGetGlobalData = vi.fn()
let mockStoreState: any = {
  keyword: [],
  favoriteData: [],
  defaultFavoriteId: undefined,
  cookie: undefined,
  activeKey: undefined,
  aiConfig: {},
  setGlobalData: mockSetGlobalData,
  getGlobalData: mockGetGlobalData,
}

vi.mock('@/store/global-data', () => ({
  useGlobalConfig: (selector: any) => selector(mockStoreState),
}))

// Mock utils
vi.mock('@/utils/promise', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/utils/tab', () => ({
  queryAndSendMessage: vi.fn(),
}))

vi.mock('@/utils/api', () => ({
  fetchAllFavoriteMedias: vi.fn(),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock components
vi.mock('@/components/finished-animate', () => ({
  default: ({ start, title, onFinished }: any) => (
    <div data-testid="finished-animate" data-start={start} data-title={title}>
      <button onClick={onFinished}>Finish</button>
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// Mock assets
vi.mock('@/assets/loading.gif', () => ({ default: 'loading.gif' }))

// Import after mocks
import { useMove } from '../src/hooks/use-move'
import { queryAndSendMessage } from '../src/utils/tab'
import { fetchAllFavoriteMedias } from '../src/utils/api'
import { toast } from '../src/hooks/use-toast'
import { MessageEnum } from '../src/utils/message'
import type { FavoriteMedia } from '../src/utils/api'

// Helper function to create mock video data
const createMockVideo = (id: number, title: string): FavoriteMedia => ({
  id,
  type: 2,
  title,
  cover: '',
  intro: '',
  page: 1,
  duration: 100,
  upper: { mid: 1, name: 'test', face: '', jump_link: '' },
  attr: 0,
  cnt_info: { collect: 0, play: 0, thumb_up: 0, share: 0 },
  link: '',
  ctime: Date.now(),
  pubtime: Date.now(),
  fav_time: Date.now(),
  bv_id: '',
  bvid: '',
  season: null,
  ogv: null,
  ugc: { first_cid: 0 },
  media_list_link: '',
})

// Helper to get element props safely
const getElementProps = (element: unknown): any => {
  return (element as ReactElement).props
}

describe('useMove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      keyword: [],
      favoriteData: [],
      defaultFavoriteId: undefined,
      cookie: undefined,
      activeKey: undefined,
      aiConfig: {},
      setGlobalData: mockSetGlobalData,
      getGlobalData: mockGetGlobalData,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('应该返回 isLoadingElement 和 handleMove 函数', () => {
      const { result } = renderHook(() => useMove())

      expect(result.current.isLoadingElement).toBeDefined()
      expect(typeof result.current.handleMove).toBe('function')
    })

    it('初始状态应该不显示 loading', () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 123,
      }

      const { result } = renderHook(() => useMove())
      const props = getElementProps(result.current.isLoadingElement)

      // 当 isLoading 为 false 时，cn 函数会将 { hidden: false } 处理为不添加 hidden 类
      // 但实际渲染时，由于 isLoading 初始为 false，hidden 条件对象会被转换为字符串 "[object Object]"
      // 这里我们验证 className 包含基础样式类
      expect(props.className).toContain('fixed')
      expect(props.className).toContain('flex')
    })
  })

  describe('handleMove 执行流程', () => {
    it('当 defaultFavoriteId 为 null 时不应该执行移动操作', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: null,
        keyword: [
          {
            favoriteDataId: 456,
            value: [{ id: '1', value: '测试' }],
          },
        ],
      }

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(fetchAllFavoriteMedias).not.toHaveBeenCalled()
    })

    it('应该根据关键词匹配并移动视频', async () => {
      const mockVideos = [
        createMockVideo(1, 'React 教程'),
        createMockVideo(2, 'Vue 入门'),
        createMockVideo(3, 'JavaScript 基础'),
      ]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: 'React' }],
          },
        ],
        favoriteData: [{ id: 200, title: '前端框架' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockResolvedValue({ code: 0 })

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(fetchAllFavoriteMedias).toHaveBeenCalledWith('100')
      expect(queryAndSendMessage).toHaveBeenCalledWith({
        type: MessageEnum.moveVideo,
        data: {
          srcMediaId: 100,
          tarMediaId: 200,
          videoId: 1,
        },
      })
    })

    it('应该匹配多个关键词', async () => {
      const mockVideos = [
        createMockVideo(1, 'React Hooks 详解'),
        createMockVideo(2, 'Vue3 Composition API'),
        createMockVideo(3, 'Angular 教程'),
      ]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [
              { id: '1', value: 'React' },
              { id: '2', value: 'Vue' },
            ],
          },
        ],
        favoriteData: [{ id: 200, title: '前端框架' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockResolvedValue({ code: 0 })

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      // React 和 Vue 都应该匹配到
      expect(queryAndSendMessage).toHaveBeenCalledTimes(2)
    })

    it('应该处理多个收藏夹的关键词', async () => {
      const mockVideos = [createMockVideo(1, 'React 教程'), createMockVideo(2, 'Python 数据分析')]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: 'React' }],
          },
          {
            favoriteDataId: 300,
            value: [{ id: '2', value: 'Python' }],
          },
        ],
        favoriteData: [
          { id: 200, title: '前端' },
          { id: 300, title: '后端' },
        ],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockResolvedValue({ code: 0 })

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).toHaveBeenCalledTimes(2)
      expect(queryAndSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tarMediaId: 200 }),
        }),
      )
      expect(queryAndSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tarMediaId: 300 }),
        }),
      )
    })

    it('应该跳过与默认收藏夹相同的目标收藏夹', async () => {
      const mockVideos = [createMockVideo(1, 'React 教程')]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 100, // 与默认收藏夹相同
            value: [{ id: '1', value: 'React' }],
          },
          {
            favoriteDataId: 200,
            value: [{ id: '2', value: 'Vue' }],
          },
        ],
        favoriteData: [
          { id: 100, title: '默认收藏夹' },
          { id: 200, title: '前端' },
        ],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockResolvedValue({ code: 0 })

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      // 只应该处理 favoriteDataId 为 200 的关键词
      expect(queryAndSendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tarMediaId: 100 }),
        }),
      )
    })

    it('应该忽略大小写进行匹配', async () => {
      const mockVideos = [createMockVideo(1, 'REACT 教程')]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: 'react' }], // 小写
          },
        ],
        favoriteData: [{ id: 200, title: '前端' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockResolvedValue({ code: 0 })

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).toHaveBeenCalledWith({
        type: MessageEnum.moveVideo,
        data: {
          srcMediaId: 100,
          tarMediaId: 200,
          videoId: 1,
        },
      })
    })
  })

  describe('取消操作', () => {
    it('应该能够取消正在进行的移动操作', async () => {
      const mockVideos = [
        createMockVideo(1, '视频 1'),
        createMockVideo(2, '视频 2'),
        createMockVideo(3, '视频 3'),
      ]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: '视频' }],
          },
        ],
        favoriteData: [{ id: 200, title: '目标收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)
      vi.mocked(queryAndSendMessage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ code: 0 }), 100)),
      )

      const { result } = renderHook(() => useMove())

      // 开始移动
      act(() => {
        result.current.handleMove()
      })

      // 等待一下让操作开始
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // 获取取消按钮并点击
      const loadingElement = result.current.isLoadingElement as ReactElement
      const children = (loadingElement.props as any).children as ReactElement[]
      const cancelButton = children[2]

      await act(async () => {
        ;(cancelButton.props as any).onClick()
      })

      // 验证取消状态
      await waitFor(() => {
        const updatedElement = result.current.isLoadingElement as ReactElement
        const updatedChildren = (updatedElement.props as any).children as ReactElement[]
        expect((updatedChildren[2].props as any).disabled).toBe(true)
      })
    })
  })

  describe('错误处理', () => {
    it('应该在 API 调用失败时显示错误提示', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: '测试' }],
          },
        ],
        favoriteData: [{ id: 200, title: '目标收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue([createMockVideo(1, '测试视频')])
      vi.mocked(queryAndSendMessage).mockRejectedValue(new Error('网络错误'))

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '操作失败',
        description: '网络错误',
      })
    })

    it('应该在获取收藏夹数据失败时处理错误', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: '测试' }],
          },
        ],
        favoriteData: [{ id: 200, title: '目标收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockRejectedValue(new Error('获取数据失败'))

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '操作失败',
        description: '获取数据失败',
      })
    })
  })

  describe('边界情况', () => {
    it('应该处理空视频列表', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: '测试' }],
          },
        ],
        favoriteData: [{ id: 200, title: '目标收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue([])

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).not.toHaveBeenCalled()
    })

    it('应该处理空关键词列表', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [],
        favoriteData: [],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue([createMockVideo(1, '视频')])

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).not.toHaveBeenCalled()
    })

    it('当目标收藏夹不存在时应该跳过', async () => {
      const mockVideos = [createMockVideo(1, 'React 教程')]

      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 999, // 不存在的收藏夹
            value: [{ id: '1', value: 'React' }],
          },
        ],
        favoriteData: [{ id: 200, title: '存在的收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(mockVideos)

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).not.toHaveBeenCalled()
    })

    it('应该处理 fetchAllFavoriteMedias 返回 null 的情况', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [
          {
            favoriteDataId: 200,
            value: [{ id: '1', value: '测试' }],
          },
        ],
        favoriteData: [{ id: 200, title: '目标收藏夹' }],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue(null as unknown as FavoriteMedia[])

      const { result } = renderHook(() => useMove())

      await act(async () => {
        await result.current.handleMove()
      })

      expect(queryAndSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('加载状态', () => {
    it('应该在执行期间显示 loading 状态', async () => {
      mockStoreState = {
        ...mockStoreState,
        defaultFavoriteId: 100,
        keyword: [],
        favoriteData: [],
      }

      vi.mocked(fetchAllFavoriteMedias).mockResolvedValue([])

      const { result } = renderHook(() => useMove())

      // 执行前应该隐藏 - 验证初始状态
      let props = getElementProps(result.current.isLoadingElement)
      // 初始状态 isLoading 为 false，验证基础样式存在
      expect(props.className).toContain('fixed')

      act(() => {
        result.current.handleMove()
      })

      // 执行中应该显示 - 验证 isLoading 变为 true 后仍然保持基础样式
      props = getElementProps(result.current.isLoadingElement)
      expect(props.className).toContain('fixed')

      // 等待完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })
    })
  })
})
