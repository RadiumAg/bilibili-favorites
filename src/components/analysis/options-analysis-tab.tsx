import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from './StatsCards'
import { DistributionChart } from './DistributionChart'
import { BarChart } from './BarChart'
import { TrendChart } from './TrendChart'
import { useGlobalConfig } from '@/store/global-data'
import { getFavoriteList } from '@/utils/api'
import { DownloadIcon, RefreshCwIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FavoriteFolder {
  id: number
  fid: number
  title: string
  media_count: number
  ctime: number
}

interface FavoriteResource {
  id: number
  bvid: string
  title: string
  ctime: number
  duration: number
  owner: {
    name: string
  }
}

interface StatsData {
  totalFolders: number
  totalVideos: number
  recentCount: number
  mostActiveFolder?: {
    name: string
    count: number
  }
  folderGrowth?: number
  videoGrowth?: number
}

export const OptionsAnalysisTab: React.FC = () => {
  const { favoriteData, cookie } = useGlobalConfig()
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<StatsData>()
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30d')
  const { toast } = useToast()

  // 计算统计数据
  const calculateStats = async () => {
    if (!favoriteData.length) return

    const totalFolders = favoriteData.length
    const totalVideos = favoriteData.reduce((sum, folder) => sum + folder.media_count, 0)
    
    // 计算最近7天的收藏数量（这里用模拟数据，实际需要从API获取）
    const recentCount = Math.floor(totalVideos * 0.1) // 假设10%是最近7天的
    
    const mostActiveFolder = favoriteData.reduce((max, folder) => 
      folder.media_count > (max?.media_count || 0) ? folder : max, 
      favoriteData[0]
    )

    setStatsData({
      totalFolders,
      totalVideos,
      recentCount,
      mostActiveFolder: mostActiveFolder ? {
        name: mostActiveFolder.title,
        count: mostActiveFolder.media_count
      } : undefined,
      folderGrowth: 5.2, // 模拟增长数据
      videoGrowth: 8.7
    })
  }

  // 计算分布数据
  const calculateDistribution = () => {
    const data = favoriteData.map(folder => ({
      name: folder.title,
      value: folder.media_count,
      percentage: (folder.media_count / favoriteData.reduce((sum, f) => sum + f.media_count, 0) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value).slice(0, 10) // 只显示前10个

    setDistributionData(data)
  }

  // 生成趋势数据（模拟数据）
  const generateTrendData = () => {
    const days = parseInt(dateRange.replace('d', ''))
    const data: Array<{ date: string; count: number; cumulative: number }> = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      
      // 模拟收藏数据
      const count = Math.floor(Math.random() * 10) + 2
      const cumulative = i === days - 1 ? count : (data[0]?.cumulative || 0) + count
      
      data.unshift({
        date: dateStr,
        count,
        cumulative
      })
    }
    
    setTrendData(data)
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        calculateStats(),
        calculateDistribution(),
        generateTrendData()
      ])
    } catch (error) {
      toast({
        title: "数据加载失败",
        description: "无法加载分析数据，请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [favoriteData, dateRange])

  // 导出功能
  const handleExport = () => {
    const exportData = {
      stats: statsData,
      distribution: distributionData,
      trend: trendData,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bilibili-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "导出成功",
      description: "分析数据已导出"
    })
  }

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-full">
        {/* 头部操作区 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">收藏夹数据分析</h2>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">最近7天</SelectItem>
                <SelectItem value="30d">最近30天</SelectItem>
                <SelectItem value="90d">最近90天</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={handleExport}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8">
          <StatsCards data={statsData} loading={loading} />
        </div>

        {/* 图表区域 */}
        <Tabs defaultValue="distribution" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distribution">收藏分布</TabsTrigger>
            <TabsTrigger value="trend">收藏趋势</TabsTrigger>
            <TabsTrigger value="activity">活跃度分析</TabsTrigger>
            <TabsTrigger value="insights">智能洞察</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>收藏夹视频数量分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionChart 
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
                  data={trendData} 
                  title="每日收藏趋势" 
                  showCumulative={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>收藏活跃度分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">活跃度分析功能正在开发中...</h3>
                  <p className="text-sm text-gray-500 mb-4">将展示收藏时间段分析、收藏频率统计等</p>
                  <div className="flex justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-200 rounded-full mr-2"></div>
                      <span>时间段分析</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-200 rounded-full mr-2"></div>
                      <span>收藏频率</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-200 rounded-full mr-2"></div>
                      <span>活跃度排行</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>智能洞察</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">智能洞察功能正在开发中...</h3>
                  <p className="text-sm text-gray-500 mb-4">将基于AI提供收藏内容分析和建议</p>
                  <div className="flex justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-200 rounded-full mr-2"></div>
                      <span>内容分析</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-200 rounded-full mr-2"></div>
                      <span>关键词提取</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-200 rounded-full mr-2"></div>
                      <span>智能建议</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}