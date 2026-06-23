import React from 'react'
import type { PetGrowthData } from './pet-config'
import { SKIN_COLORS, SKIN_NAMES } from './pet-config'
import { PetMessageEnum } from '@/utils/pet-message'

interface PetDashboardProps {
  visible: boolean
  growth: PetGrowthData
  onChangeSkin: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const PetDashboard: React.FC<PetDashboardProps> = (props) => {
  const { visible, growth, onChangeSkin, onMouseEnter, onMouseLeave } = props
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

  const skinName = SKIN_NAMES[growth.activeSkinLevel % SKIN_NAMES.length]

  return (
    <div
      className="bili-pet-dashboard"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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
          <span className="bili-pet-stat-value">{growth.consecutiveOrganizeDays}</span>
          <span className="bili-pet-stat-label">连续天数</span>
        </div>
      </div>

      <div className="bili-pet-dashboard-skin">
        <span
          className="bili-pet-skin-dot"
          style={{ backgroundColor: SKIN_COLORS[growth.activeSkinLevel % SKIN_COLORS.length].body }}
        />
        <span className="bili-pet-stat-label">当前皮肤：{skinName}</span>
        <button
          type="button"
          className="bili-pet-skin-button bili-pet-no-drag"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onChangeSkin()
          }}
        >
          换一换
        </button>
      </div>
    </div>
  )
}

export { PetDashboard }
