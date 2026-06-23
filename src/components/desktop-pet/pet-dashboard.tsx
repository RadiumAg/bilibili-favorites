import React from 'react'
import type { PetGrowthData } from './pet-config'
import { SKIN_COLORS, STREAK_GOAL } from './pet-config'
import { PetMessageEnum } from '@/utils/pet-message'

interface PetDashboardProps {
  visible: boolean
  growth: PetGrowthData
}

const PetDashboard: React.FC<PetDashboardProps> = (props) => {
  const { visible, growth } = props
  const [favStats, setFavStats] = React.useState<{ total: number; defaultCount: number } | null>(null)

  React.useEffect(() => {
    if (!visible) return
    try {
      chrome?.runtime?.sendMessage({ type: PetMessageEnum.getFavStats }, (response: any) => {
        if (response?.total !== undefined) {
          setFavStats({ total: response.total, defaultCount: response.defaultCount ?? 0 })
        }
      })
    } catch {
      // ignore
    }
  }, [visible])

  if (!visible) return null

  const skinName = ['银灰', '樱粉', '天蓝', '薄荷', '星紫'][growth.skinLevel % SKIN_COLORS.length]
  const streakProgress = Math.min(growth.consecutiveOrganizeDays, STREAK_GOAL)

  return (
    <div className="bili-pet-dashboard">
      <div className="bili-pet-dashboard-title">📺 小电视状态</div>

      <div className="bili-pet-dashboard-grid">
        {favStats && (
          <>
            <div className="bili-pet-stat">
              <span className="bili-pet-stat-value">{favStats.total}</span>
              <span className="bili-pet-stat-label">总收藏</span>
            </div>
            <div className="bili-pet-stat">
              <span className="bili-pet-stat-value">{favStats.defaultCount}</span>
              <span className="bili-pet-stat-label">待整理</span>
            </div>
          </>
        )}
        <div className="bili-pet-stat">
          <span className="bili-pet-stat-value">{growth.totalOrganizeCount}</span>
          <span className="bili-pet-stat-label">已整理</span>
        </div>
        <div className="bili-pet-stat">
          <span className="bili-pet-stat-value">{streakProgress}/{STREAK_GOAL}</span>
          <span className="bili-pet-stat-label">连续天数</span>
        </div>
      </div>

      <div className="bili-pet-dashboard-skin">
        <span
          className="bili-pet-skin-dot"
          style={{ backgroundColor: SKIN_COLORS[growth.skinLevel % SKIN_COLORS.length].body }}
        />
        <span className="bili-pet-stat-label">当前皮肤：{skinName}</span>
      </div>
    </div>
  )
}

export { PetDashboard }
