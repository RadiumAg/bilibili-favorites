import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Title } from '@/components'
import { useFavoriteData } from '@/hooks'
import { useGlobalConfig } from '@/store/global-data'
import { useAnalysisData } from '../analysis/use-analysis-data'
import { usePersonalityAnalysis } from './use-personality-analysis'
import { PersonalityResultView } from './personality-result'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import loadingGif from '@/assets/loading.gif'

const PersonalityAnalysis: React.FC = () => {
  const { favoriteData } = useFavoriteData()
  const cookie = useGlobalConfig((state) => state.cookie)
  const forceRefreshRef = React.useRef(false)
  const {
    allMedias,
    loading: dataLoading,
    fetchAllMedias,
  } = useAnalysisData({
    favoriteData,
    cookie,
    forceRefreshRef,
  })

  const {
    result,
    loading: analysisLoading,
    error,
    startAnalysis,
    cancel,
  } = usePersonalityAnalysis(favoriteData, allMedias)

  const handleStart = async () => {
    // 如果还没有数据，先拉取
    if (allMedias.length === 0) {
      await fetchAllMedias()
    }
    startAnalysis()
  }

  // 数据加载中
  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <img alt="loading" src={loadingGif} className="w-20 h-20" />
        <p className="text-sm text-[#61666D]">正在加载收藏夹数据...</p>
      </div>
    )
  }

  // 有结果：展示
  if (result) {
    return (
      <div className="w-full h-full">
        <div className="max-w-2xl mx-auto">
          <PersonalityResultView
            result={result}
            onReset={() => {
              startAnalysis()
            }}
          />
        </div>
      </div>
    )
  }

  // 空态 / 待分析
  return (
    <div className="w-full h-full">
      <div className="max-w-2xl mx-auto">
        <Title title="收藏夹性格分析" desc="基于你的 B 站收藏内容，AI 为你生成专属 MBTI 性格画像" />

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00A1D6]/10">
                <Sparkles className="w-10 h-10 text-[#00A1D6]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#18191C]">发现你的收藏人格</h3>
                <p className="text-sm text-[#61666D] max-w-md mx-auto">
                  我们将分析你收藏夹中的视频标题、分类分布和高频关键词，推断你的 MBTI 性格倾向
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 justify-center text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                {analysisLoading ? (
                  <Button onClick={cancel} variant="outline" className="gap-2">
                    取消分析
                  </Button>
                ) : (
                  <Button
                    onClick={handleStart}
                    disabled={favoriteData.length === 0 || dataLoading}
                    className="gap-2 bg-[#00A1D6] hover:bg-[#00A1D6]/90"
                  >
                    <Sparkles className="w-4 h-4" />
                    开始分析
                  </Button>
                )}
              </div>

              {analysisLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#61666D]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在分析你的收藏偏好...
                </div>
              )}

              {favoriteData.length === 0 && (
                <p className="text-xs text-[#9499A0]">暂无收藏夹数据，请先登录 B 站账号</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PersonalityAnalysis
