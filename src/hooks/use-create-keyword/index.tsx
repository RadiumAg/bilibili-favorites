import React from 'react'
import { toast } from '../use-toast'
import { AIError } from '@/utils/error'
import { useGlobalConfig } from '@/store/global-data'
import { useShallow } from 'zustand/react/shallow'
import { quickExtractKeywords } from '@/utils/keyword-extractor'
import { fetchChatGpt, fetchAllFavoriteMedias } from '@/utils/api'
import {
  createAIStreamParser,
  createStreamAdapter,
} from '../use-create-keyword-by-ai/ai-stream-parser'
import { useMemoizedFn } from 'ahooks'
import { requestOriginPermission } from '@/utils/origin-permission'

export type ExtractionMode = 'local' | 'ai' | 'manual'

export type CreateKeywordProgress = {
  /** 当前处理的收藏夹序号 */
  current: number
  /** 收藏夹总数 */
  total: number
  /** 当前收藏夹名称 */
  currentTitle: string
  /** 已加载/分析的视频数量 */
  videoLoaded: number
  /** 当前收藏夹视频总数 */
  videoTotal: number
  /** 当前正在处理的视频标题 */
  currentVideoTitle: string
  /** 当前阶段：加载视频列表 / AI或本地分析 */
  phase: 'idle' | 'loading' | 'analyzing'
}

const INITIAL_PROGRESS: CreateKeywordProgress = {
  current: 0,
  total: 0,
  currentTitle: '',
  videoLoaded: 0,
  videoTotal: 0,
  currentVideoTitle: '',
  phase: 'idle',
}

type UseCreateKeywordProps = {
  mode?: ExtractionMode
}

const useCreateKeyword = (props: UseCreateKeywordProps = {}) => {
  const { mode: defaultMode = 'local' } = props

  const dataProvideData = useGlobalConfig(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      activeKey: state.activeKey,
      favoriteData: state.favoriteData,
      keyword: state.keyword,
      setGlobalData: state.setGlobalData,
      getGlobalData: state.getGlobalData,
      aiTagFailures: state.aiTagFailures,
    })),
  )

  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState<CreateKeywordProgress>(INITIAL_PROGRESS)
  const [currentMode, setCurrentMode] = React.useState<ExtractionMode>(defaultMode)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const fetchMediasWithProgress = useMemoizedFn(
    async (
      favKey: string,
      folderProgress: Pick<CreateKeywordProgress, 'current' | 'total' | 'currentTitle'>,
    ) => {
      const mediaCount = dataProvideData.favoriteData?.find(
        (f) => f.id === Number(favKey),
      )?.media_count

      setProgress((prev) => ({
        ...prev,
        ...folderProgress,
        videoLoaded: 0,
        videoTotal: mediaCount ?? 0,
        currentVideoTitle: '',
        phase: 'loading',
      }))

      const allVideos = await fetchAllFavoriteMedias(favKey, {
        mediaCount,
        onProgress: ({ loaded, total, currentVideoTitle }) => {
          setProgress((prev) => ({
            ...prev,
            videoLoaded: loaded,
            videoTotal: total ?? prev.videoTotal,
            currentVideoTitle: currentVideoTitle ?? '',
            phase: 'loading',
          }))
        },
      })

      setProgress((prev) => ({
        ...prev,
        videoLoaded: allVideos.length,
        videoTotal: allVideos.length || prev.videoTotal,
        currentVideoTitle: '',
        phase: 'analyzing',
      }))

      return allVideos
    },
  )

  /**
   * 使用本地算法提取关键词
   */
  const extractWithLocal = useMemoizedFn(
    async (
      favKey: string,
      folderProgress: Pick<CreateKeywordProgress, 'current' | 'total' | 'currentTitle'>,
    ) => {
      const allDefaultFavoriteVideo = await fetchMediasWithProgress(favKey, folderProgress)
      const titleArray = allDefaultFavoriteVideo?.map((item) => item.title)

      if (titleArray == null || titleArray.length === 0) {
        throw new Error('没有找到视频标题')
      }

      // 使用本地 TF-IDF 算法提取关键词
      const keywords = quickExtractKeywords(titleArray, 10)

      if (keywords.length === 0) {
        throw new Error('未能提取到关键词')
      }
      const currentData = dataProvideData.getGlobalData()
      const existingKeywordIndex = currentData.keyword.findIndex(
        (item) => item.favoriteDataId === Number(favKey),
      )
      const normalize = (value: string) => value.trim().normalize('NFKC').toLocaleLowerCase()
      const existingValues =
        existingKeywordIndex === -1 ? [] : currentData.keyword[existingKeywordIndex].value
      const existingNormalized = new Set(existingValues.map((item) => normalize(item.value)))
      const seen = new Set(existingNormalized)
      const newKeywordValues = keywords
        .map((keyword, index) => ({ id: `${favKey}-${index}-${Date.now()}`, value: keyword.trim() }))
        .filter((item) => {
          const normalized = normalize(item.value)
          if (!item.value || seen.has(normalized)) return false
          seen.add(normalized)
          return true
        })

      const nextKeyword = currentData.keyword.map((row) =>
        row.favoriteDataId === Number(favKey)
          ? { ...row, value: [...row.value, ...newKeywordValues] }
          : row,
      )
      if (existingKeywordIndex === -1 && newKeywordValues.length > 0) {
        nextKeyword.push({ favoriteDataId: Number(favKey), value: newKeywordValues })
      }

      dataProvideData.setGlobalData({ keyword: nextKeyword })

      return newKeywordValues.map((item) => item.value)
    },
  )

  /**
   * 使用 AI 提取关键词
   * 使用用户配置的自定义 AI
   */
  const extractWithAI = useMemoizedFn(
    async (
      favKey: string,
      folderProgress: Pick<CreateKeywordProgress, 'current' | 'total' | 'currentTitle'>,
    ) => {
      const aiConfig = dataProvideData.aiConfig || {}

      const allDefaultFavoriteVideo = await fetchMediasWithProgress(favKey, folderProgress)
      const titleArray = allDefaultFavoriteVideo?.map((item) => item.title)

      if (titleArray == null || titleArray.length === 0) {
        throw new Error('没有找到视频标题')
      }

      if (!aiConfig.key || !aiConfig.model) {
        throw new Error('请先在配置页完成自定义 AI 配置')
      }

      // 使用自定义模型
      const gptResult = await fetchChatGpt(
        titleArray,
        {
          baseURL: aiConfig.baseUrl,
          apiKey: aiConfig.key!,
          model: aiConfig.model!,
          extraParams: aiConfig?.extraParams,
        },
      )
      const reader = gptResult.toReadableStream().getReader()
      const adapter = createStreamAdapter(aiConfig.adapter)
      const parser = createAIStreamParser({
        favKey,
        getGlobalData: () => dataProvideData.getGlobalData(),
        setGlobalData: (data) => dataProvideData.setGlobalData(data),
        onKeywordExtracted: (keyword) => {
          console.log('[DEBUG] AI extracted keyword:', keyword)
        },
        adapter,
      })

      try {
        while (true) {
          if (abortControllerRef.current?.signal.aborted) {
            await reader.cancel()
            throw new DOMException('用户取消操作', 'AbortError')
          }

          const { value, done } = await reader.read()

          if (done) {
            parser.flush()
            parser.commit()
            break
          }

          parser.processChunk(value)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        if (error instanceof AIError) {
          throw new AIError(`AI 提取关键词失败: ${error.message}`, error.detail)
        }
        if (error instanceof Error) {
          throw new AIError(`AI 提取关键词失败: ${error.message}`)
        }
        throw new AIError('AI 提取关键词失败')
      }
    },
  )

  /**
   * 处理单个收藏夹
   */
  const processSingleFavorite = useMemoizedFn(
    async (
      favKey: string,
      mode: ExtractionMode,
      folderProgress: Pick<CreateKeywordProgress, 'current' | 'total' | 'currentTitle'>,
    ) => {
      switch (mode) {
        case 'local':
          return await extractWithLocal(favKey, folderProgress)
        case 'ai':
          return await extractWithAI(favKey, folderProgress)
        case 'manual':
          // 手动模式不自动提取，由用户手动输入
          return []
        default:
          throw new Error(`不支持的提取模式: ${mode}`)
      }
    },
  )

  const updateFailure = useMemoizedFn((favoriteId: number, error?: unknown) => {
    const current = dataProvideData.getGlobalData()
    const next = { ...(current.aiTagFailures || {}) }
    if (error == null) {
      delete next[String(favoriteId)]
    } else {
      next[String(favoriteId)] = error instanceof Error ? error.message : String(error)
    }
    dataProvideData.setGlobalData({ aiTagFailures: next })
  })

  const clearFailures = useMemoizedFn(() => {
    const current = dataProvideData.getGlobalData().aiTagFailures || {}
    const count = Object.keys(current).length
    if (count === 0) {
      toast({ title: '无需清除', description: '当前没有标签创建失败标识' })
      return
    }
    dataProvideData.setGlobalData({ aiTagFailures: {} })
    toast({ title: '已清除失败标识', description: `已清除 ${count} 个收藏夹的失败标识` })
  })

  const clearAllTags = useMemoizedFn(() => {
    const current = dataProvideData.getGlobalData()
    const count = current.keyword.reduce((sum, row) => sum + row.value.length, 0)
    if (count === 0) {
      toast({ title: '无需清除', description: '当前没有标签' })
      return
    }
    if (!window.confirm(`确定清除全部 ${count} 个标签吗？此操作不可撤销。`)) return
    dataProvideData.setGlobalData({ keyword: [] })
    toast({ title: '已清除所有标签', description: `已清除 ${count} 个标签` })
  })

  const clearSelectedTags = useMemoizedFn(() => {
    const current = dataProvideData.getGlobalData()
    if (current.activeKey == null) {
      toast({ variant: 'destructive', title: '操作失败', description: '请先选择一个收藏夹' })
      return
    }
    const target = current.keyword.find((row) => row.favoriteDataId === current.activeKey)
    const count = target?.value.length ?? 0
    if (count === 0) {
      toast({ title: '无需清除', description: '所选收藏夹当前没有标签' })
      return
    }
    if (!window.confirm(`确定清除所选收藏夹的 ${count} 个标签吗？此操作不可撤销。`)) return
    dataProvideData.setGlobalData({
      keyword: current.keyword.filter((row) => row.favoriteDataId !== current.activeKey),
    })
    toast({ title: '已清除所选标签', description: `已清除所选收藏夹的 ${count} 个标签` })
  })

  /**
   * 创建关键词
   */
  const handleCreate = useMemoizedFn(
    async (type: 'select' | 'all', mode: ExtractionMode = currentMode) => {
      if (mode === 'ai') {
        const aiConfig = dataProvideData.getGlobalData().aiConfig
        if (!aiConfig.key || !aiConfig.model || !aiConfig.baseUrl) {
          toast({
            variant: 'destructive',
            title: '未配置 AI',
            description: '请先在配置页完成自定义 AI 配置',
          })
          return
        }
        try {
          const granted = await requestOriginPermission(aiConfig.baseUrl)
          if (!granted) {
            toast({
              variant: 'destructive',
              title: '缺少 AI 服务站点权限',
              description: '请允许插件访问当前 AI 服务商后再创建标签',
            })
            return
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'AI Base URL 无效',
            description: error instanceof Error ? error.message : '无法解析服务地址',
          })
          return
        }
      }

      setIsLoading(true)
      setProgress({ ...INITIAL_PROGRESS, phase: 'loading' })
      abortControllerRef.current = new AbortController()

      try {
        switch (type) {
          case 'select': {
            if (dataProvideData.activeKey == null) {
              toast({
                variant: 'destructive',
                title: '操作失败',
                description: '请先选择一个收藏夹',
              })
              return
            }

            const activeFav = dataProvideData.favoriteData?.find(
              (f) => f.id === dataProvideData.activeKey,
            )
            const folderProgress = {
              current: 1,
              total: 1,
              currentTitle: activeFav?.title ?? '',
            }
            setProgress({
              ...folderProgress,
              videoLoaded: 0,
              videoTotal: activeFav?.media_count ?? 0,
              currentVideoTitle: '',
              phase: 'loading',
            })

            const selectedFavoriteId = dataProvideData.activeKey
            try {
              const keywords = await processSingleFavorite(
                selectedFavoriteId.toString(),
                mode,
                folderProgress,
              )
              updateFailure(selectedFavoriteId)

              if (mode === 'local' && keywords && keywords.length > 0) {
                toast({
                  title: '提取成功',
                  description: `已提取 ${keywords.length} 个关键词`,
                })
              }
            } catch (error) {
              if (!(error instanceof DOMException && error.name === 'AbortError')) {
                updateFailure(selectedFavoriteId, error)
              }
              throw error
            }
            break
          }

          case 'all': {
            if (dataProvideData.favoriteData == null || dataProvideData.favoriteData.length === 0) {
              toast({
                variant: 'destructive',
                title: '操作失败',
                description: '还没有任何收藏夹',
              })
              return
            }

            // 批量处理时记录成功和失败，并在结束后恢复用户原先选中的收藏夹。
            let successCount = 0
            let failCount = 0
            const total = dataProvideData.favoriteData.length
            const originalActiveKey = dataProvideData.getGlobalData().activeKey

            try {
              for (let i = 0; i < total; i++) {
                const fav = dataProvideData.favoriteData[i]
                if (abortControllerRef.current.signal?.aborted) return

                const folderProgress = {
                  current: i + 1,
                  total,
                  currentTitle: fav.title,
                }

                setProgress({
                  ...folderProgress,
                  videoLoaded: 0,
                  videoTotal: fav.media_count ?? 0,
                  currentVideoTitle: '',
                  phase: 'loading',
                })

                try {
                  const activeKey = fav.id
                  dataProvideData.setGlobalData({ activeKey })
                  await processSingleFavorite(activeKey.toString(), mode, folderProgress)
                  updateFailure(activeKey)
                  successCount++
                } catch (error) {
                  if (error instanceof DOMException && error.name === 'AbortError') {
                    throw error
                  }
                  console.error(`处理收藏夹 ${fav.id} 失败:`, error)
                  updateFailure(fav.id, error)
                  failCount++
                }
              }
            } finally {
              dataProvideData.setGlobalData({ activeKey: originalActiveKey })
            }

            if (failCount > 0) {
              toast({
                variant: 'destructive',
                title: '部分完成',
                description: `成功 ${successCount} 个，失败 ${failCount} 个`,
              })
            } else {
              toast({
                title: '全部完成',
                description: `成功处理 ${successCount} 个收藏夹`,
              })
            }
            break
          }
          default:
            break
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          toast({
            title: '已取消',
            description: '操作已取消',
          })
          return
        }
        if (error instanceof AIError) {
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: error.message,
            detail: error.detail,
          })
        } else if (error instanceof Error) {
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: error.message,
          })
        }
      } finally {
        abortControllerRef.current = null
        setIsLoading(false)
        setProgress(INITIAL_PROGRESS)
      }
    },
  )

  const cancelCreate = useMemoizedFn(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  })

  return {
    isLoading,
    progress,
    currentMode,
    extractWithLocal,
    extractWithAI,
    handleCreate,
    cancelCreate,
    clearFailures,
    clearAllTags,
    clearSelectedTags,
    setCurrentMode,
  }
}

export { useCreateKeyword }
