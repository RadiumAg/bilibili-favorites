import React from 'react'
import { FolderIcon, VideoIcon, ClockIcon, TrendingUpIcon } from 'lucide-react'

type StatsCardProps = {
  title: string
  value: number | string
  icon: React.ReactNode
  subtitle?: string
  loading?: boolean
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, subtitle, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        <div className="text-blue-500">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}

type StatsData = {
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

type StatsCardsProps = {
  data?: StatsData
  loading?: boolean
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data, loading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="总收藏夹数量"
        value={data?.totalFolders || 0}
        icon={<FolderIcon className="w-5 h-5" />}
        loading={loading}
      />
      <StatsCard
        title="总视频数量"
        value={data?.totalVideos || 0}
        icon={<VideoIcon className="w-5 h-5" />}
        loading={loading}
      />
      <StatsCard
        title="最近收藏"
        value={data?.recentCount || 0}
        icon={<ClockIcon className="w-5 h-5" />}
        subtitle="最近7天"
        loading={loading}
      />
      <StatsCard
        title="最活跃收藏夹"
        value={data?.mostActiveFolder?.name || '-'}
        icon={<TrendingUpIcon className="w-5 h-5" />}
        subtitle={data?.mostActiveFolder ? `${data.mostActiveFolder.count} 个视频` : undefined}
        loading={loading}
      />
    </div>
  )
}
