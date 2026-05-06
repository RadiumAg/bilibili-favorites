import React from 'react'
import { useMemoizedFn } from 'ahooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from './stats-cards'
import { DistributionChart } from './chart/distribution-chart'
import { BarChart } from './chart/bar-chart'
import { TrendChart } from './chart/trend-chart'
import { RefreshCwIcon } from 'lucide-react'
import { useAnalysisWorker } from './use-analysis-worker'
import { useAnalysisStats } from './use-analysis-stats'
import { useBeforeUnload, useFavoriteData } from '@/hooks'
import { Title } from '@/components'
import { useAnalysisDataContext } from './analysis-data-context'
import { AnalysisLoadingOverlay } from './analysis-loading-overlay'

export const OptionsAnalysisTab: React.FC = () => {
  const { favoriteData } = useFavoriteData()
  const dateRange = React.useRef<string>('30d')
  const [refreshing, setRefreshing] = React.useState(false)

  // 从共享 Context 获取分析数据
  const {
    allMedaisRef,
    loading: dataLoading,
    fetchProgress,
    fetchAllMedias,
    forceRefreshRef,
  } = useAnalysisDataContext()
  const { postMessage: postWorkerMessage } = useAnalysisWorker({
    onMessage: useMemoizedFn((type: string, data: any) => {
      console.log('[DEBUG] Message', type, data)
      switch (type) {
        case 'calculateRecentFavorites':
          // 更新最近收藏数量
          updateRecentCount(data)
          break

        case 'calculateTrend':
          // 更新趋势数据
          setTrendData(data)
          break

        default:
          console.warn('[OptionsAnalysisTab] Unknown worker message type:', type)
      }
    }),
  })

  // 数据分析进行中时，关闭窗口弹出确认提示
  useBeforeUnload(dataLoading, '当前正在数据分析，确定要离开吗？')

  // 使用统计数据 hook
  const {
    statsData,
    distributionData,
    trendData,
    generateTrendData,
    calculateStats,
    calculateDistribution,
    setTrendData,
    updateRecentCount,
  } = useAnalysisStats({
    favoriteData,
    allMedaisRef,
    dateRange,
    forceRefreshRef,
    postWorkerMessage,
  })

  // 加载数据
  const loadData = useMemoizedFn(async () => {
    const allMedias = allMedaisRef.current
    try {
      // 计算基础统计
      calculateStats()
      calculateDistribution()
      // 生成趋势数据
      generateTrendData()
      postWorkerMessage({
        type: 'calculateRecentFavorites',
        data: { medias: allMedias, days: '7' },
      })
      // 使用 Worker 计算最近收藏数量
    } catch (error) {
      toast({
        title: '数据加载失败',
        description: '无法加载分析数据，请稍后重试',
        variant: 'destructive',
      })
    }
  })

  // 强制刷新
  const handleForceRefresh = useMemoizedFn(async () => {
    setRefreshing(true)
    forceRefreshRef.current = true

    try {
      await fetchAllMedias()
      await loadData()

      toast({
        title: '刷新成功',
        description: '已获取最新数据',
      })
    } catch (error) {
      toast({
        title: '刷新失败',
        description: '无法获取最新数据，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      forceRefreshRef.current = false
      setRefreshing(false)
    }
  })

  React.useEffect(() => {
    if (favoriteData.length > 0) {
      fetchAllMedias().then(() => {
        loadData()
      })
    }
  }, [favoriteData, fetchAllMedias, loadData])

  return (
    <div className="w-full h-full relative">
      <div className="max-w-full">
        {/* 头部操作区 */}
        <div className="flex justify-between items-center mb-6">
          <Title title="收藏夹数据分析" desc="默认24小时刷新，点击刷新强制刷新" />
          <div className="flex gap-2">
            <Select
              defaultValue={dateRange.current}
              onValueChange={(value) => {
                dateRange.current = value
                generateTrendData()
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">最近7天</SelectItem>
                <SelectItem value="30d">最近30天</SelectItem>
                <SelectItem value="90d">最近90天</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleForceRefresh}
              disabled={dataLoading || refreshing}
              aria-label="刷新数据"
            >
              <RefreshCwIcon
                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              刷新
            </Button>
          </div>
        </div>

        {/* Loading 遮罩层 */}
        <AnalysisLoadingOverlay loading={dataLoading} fetchProgress={fetchProgress} />

        {/* 统计卡片 */}
        <div className="mb-8">
          <StatsCards data={statsData} loading={dataLoading} />
        </div>

        {/* 图表区域 */}
        <Tabs defaultValue="distribution" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distribution">收藏分布</TabsTrigger>
            <TabsTrigger value="trend">收藏趋势</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>收藏夹视频数量分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionChart
                    loading={dataLoading}
                    data={distributionData}
                    title="收藏夹分布"
                    type="pie"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>收藏夹视频数量排行</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    loading={dataLoading}
                    data={distributionData}
                    title="TOP 10 收藏夹"
                    horizontal={true}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>收藏趋势分析</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  loading={dataLoading}
                  data={trendData}
                  title="每日收藏趋势"
                  showCumulative={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
