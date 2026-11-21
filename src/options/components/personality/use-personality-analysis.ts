import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import { fetchPersonalityAnalysis, type PersonalitySummary } from '@/utils/api'
import { useGlobalConfig } from '@/store/global-data'
import { quickExtractKeywords } from '@/utils/keyword-extractor'
import { createStreamAdapter } from '@/hooks/use-create-keyword-by-ai/ai-stream-parser'
import dbManager from '@/utils/indexed-db'
import { parseAIJSON } from '@/utils/parse-ai-json'
import { notifyAiAnalysisDone } from '@/utils/pet-message'
import { useStarInvitation } from '@/hooks/use-star-invitation'
import { requestOriginPermission } from '@/utils/origin-permission'

/** MBTI 维度结果 */
type DimensionResult = {
  tendency: string
  score: number
  reason: string
}

type PersonalityMedia = {
  title: string
}

/** MBTI 性格分析结果 */
export type PersonalityResult = {
  type: string
  title: string
  description: string
  dimensions: {
    EI: DimensionResult
    SN: DimensionResult
    TF: DimensionResult
    JP: DimensionResult
  }
  interests: string[]
  suggestions: string[]
}

const CACHE_KEY = 'personality-analysis'

/**
 * 从收藏夹数据生成摘要（压缩 token 消耗）
 */
const buildSummary = (
  favoriteData: Array<{ title: string; media_count: number }>,
  allMedias: Array<{ title: string; upper?: { mid: number } }>,
): PersonalitySummary => {
  // 按收藏夹聚合关键词
  const folders = favoriteData.map((fav) => {
    // 从 allMedias 中找该收藏夹的视频（简化：用全部视频做全局关键词）
    const topKeywords = quickExtractKeywords(
      allMedias.map((m) => m.title),
      5,
    )
    return {
      title: fav.title,
      count: fav.media_count,
      topKeywords,
    }
  })

  // 全局 TOP 30 关键词
  const globalTopKeywords = quickExtractKeywords(
    allMedias.map((m) => m.title),
    30,
  )

  return {
    totalCount: allMedias.length,
    folders,
    globalTopKeywords,
  }
}

export const usePersonalityAnalysis = (
  favoriteData: Array<{ id: number; title: string; media_count: number }>,
  allMedias: PersonalityMedia[],
) => {
  const aiConfig = useGlobalConfig(useShallow((state) => state.aiConfig))
  const [result, setResult] = React.useState<PersonalityResult | null>(null)
  const [analyzedAt, setAnalyzedAt] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const streamRef = React.useRef<{ cancel: () => void } | null>(null)
  const { recordSuccessfulUse, resetStarInvitation, showStarInvitationAfterClose } =
    useStarInvitation('options')

  // 加载缓存
  React.useEffect(() => {
    const loadCache = async () => {
      const cached = await dbManager.get(CACHE_KEY)
      if (cached?.data) {
        setResult(cached.data)
        setAnalyzedAt(cached.timestamp)
      }
    }
    loadCache()
  }, [])

  const startAnalysis = useMemoizedFn(async (medias = allMedias) => {
    resetStarInvitation()
    if (!aiConfig.key || !aiConfig.baseUrl || !aiConfig.model) {
      setError('请先在「配置」页设置 AI 模型')
      return
    }

    try {
      const granted = await requestOriginPermission(aiConfig.baseUrl)
      if (!granted) {
        setError('未获得当前 AI 服务商的站点访问权限')
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Base URL 无效')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const summary = buildSummary(favoriteData, medias)
      const config = {
        apiKey: aiConfig.key || '',
        baseURL: aiConfig.baseUrl || '',
        model: aiConfig.model,
        extraParams: aiConfig.extraParams,
      }

      const stream = await fetchPersonalityAnalysis(summary, config)
      streamRef.current = stream

      // 累积流式文本
      let fullContent = ''
      const reader = stream.toReadableStream().getReader()
      const adapter = createStreamAdapter(aiConfig.adapter)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = adapter.parse(value)
        if (text) {
          fullContent += text
        }
      }

      // 解析 JSON
      const parsed = parsePersonalityJSON(fullContent)
      if (parsed) {
        const completedAt = Date.now()
        setResult(parsed)
        setAnalyzedAt(completedAt)
        await dbManager.set(CACHE_KEY, parsed)
        await recordSuccessfulUse()
        notifyAiAnalysisDone(parsed.title)
      } else {
        setError('AI 返回格式异常，请重试')
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('用户取消')) return
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setLoading(false)
      streamRef.current = null
    }
  })

  const cancel = useMemoizedFn(() => {
    streamRef.current?.cancel()
    setLoading(false)
  })

  return {
    result,
    analyzedAt,
    loading,
    error,
    startAnalysis,
    cancel,
    showStarInvitationAfterClose,
  }
}

/**
 * 健壮地解析 LLM 返回的 JSON
 * 处理 markdown 代码块包裹、多余文本等情况
 */
const parsePersonalityJSON = (text: string): PersonalityResult | null => {
  try {
    // 尝试提取 ```json ... ``` 包裹的内容
    const parsed = parseAIJSON(text)

    // 基本校验
    if (parsed.type && parsed.dimensions && parsed.description) {
      return parsed as PersonalityResult
    }
    return null
  } catch {
    return null
  }
}
