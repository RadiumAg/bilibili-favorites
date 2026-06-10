import React from 'react'
import { createPortal } from 'react-dom'
import { Skeleton } from '@/components/ui/skeleton'

type HeatmapData = {
  date: string
  count: number
  dayOfWeek: number
}

type HeatmapChartProps = {
  data: HeatmapData[]
  loading: boolean
  className?: string
}

const CELL_GAP = 3
const DAY_LABEL_WIDTH = 28
const CELL_SIZE = 14
const ROW_GAP = 28
const MONTH_LABEL_HEIGHT = 18
const COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const DAY_LABELS = ['', '一', '', '三', '', '五', '']

function getColor(count: number, max: number): string {
  if (count === 0) return COLORS[0]
  const ratio = count / max
  if (ratio <= 0.25) return COLORS[1]
  if (ratio <= 0.5) return COLORS[2]
  if (ratio <= 0.75) return COLORS[3]
  return COLORS[4]
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, loading, className = '' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [tooltip, setTooltip] = React.useState<{
    x: number
    y: number
    date: string
    count: number
    dayOfWeek: number
    overflowTop?: boolean
  } | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 按周分组
  const weeks: HeatmapData[][] = []
  let currentWeek: HeatmapData[] = []
  data.forEach((item) => {
    if (item.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(item)
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1

  // 根据容器宽度计算每行显示多少周（铺满）
  const availableWidth = containerWidth - DAY_LABEL_WIDTH - 10
  const weeksPerRow =
    weeks.length > 0
      ? Math.max(1, Math.min(weeks.length, Math.floor(availableWidth / (CELL_SIZE + CELL_GAP))))
      : 13

  // 拆分为多行
  const rows: HeatmapData[][][] = []
  for (let i = 0; i < weeks.length; i += weeksPerRow) {
    rows.push(weeks.slice(i, i + weeksPerRow))
  }

  const svgWidth = DAY_LABEL_WIDTH + weeksPerRow * (CELL_SIZE + CELL_GAP) + 10
  const svgHeight = rows.length * (MONTH_LABEL_HEIGHT + 7 * (CELL_SIZE + CELL_GAP) + ROW_GAP)

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {loading ? (
        <Skeleton className="w-full h-80 rounded-lg" />
      ) : data.length === 0 ? (
        <div className="w-full h-80 flex items-center justify-center">
          <span className="text-gray-400 text-sm">暂无收藏数据</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg
              width={svgWidth}
              height={svgHeight}
              className="block"
              onMouseLeave={() => setTooltip(null)}
            >
              {rows.map((rowWeeks, rowIdx) => {
                const yOffset = rowIdx * (MONTH_LABEL_HEIGHT + 7 * (CELL_SIZE + CELL_GAP) + ROW_GAP)

                // 月份标注
                const monthLabels: { weekIndex: number; label: string }[] = []
                let lastMonth = ''
                rowWeeks.forEach((week, idx) => {
                  const month = week[0]?.date.split('/')[0]
                  if (month && month !== lastMonth) {
                    monthLabels.push({ weekIndex: idx, label: `${month}月` })
                    lastMonth = month
                  }
                })

                return (
                  <g key={rowIdx}>
                    {/* 月份标注 */}
                    {monthLabels.map((m) => (
                      <text
                        key={m.weekIndex}
                        x={DAY_LABEL_WIDTH + m.weekIndex * (CELL_SIZE + CELL_GAP)}
                        y={yOffset + 12}
                        fontSize={10}
                        fill="#666"
                      >
                        {m.label}
                      </text>
                    ))}

                    {/* 星期标签 */}
                    {DAY_LABELS.map((label, i) => (
                      <text
                        key={i}
                        x={0}
                        y={yOffset + MONTH_LABEL_HEIGHT + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                        fontSize={9}
                        fill="#999"
                      >
                        {label}
                      </text>
                    ))}

                    {/* 方块 */}
                    {rowWeeks.map((week, weekIdx) =>
                      week.map((item) => (
                        <rect
                          key={`${rowIdx}-${weekIdx}-${item.dayOfWeek}`}
                          x={DAY_LABEL_WIDTH + weekIdx * (CELL_SIZE + CELL_GAP)}
                          y={yOffset + MONTH_LABEL_HEIGHT + item.dayOfWeek * (CELL_SIZE + CELL_GAP)}
                          width={CELL_SIZE}
                          height={CELL_SIZE}
                          rx={2}
                          ry={2}
                          fill={getColor(item.count, maxCount)}
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = (e.target as SVGRectElement).getBoundingClientRect()

                            // 使用视口坐标，通过 portal 渲染不受父容器 overflow 影响
                            let x = rect.left + CELL_SIZE / 2
                            const cellTop = rect.top

                            // 检测是否会溢出视口顶部（tooltip 高度约 50px）
                            const tooltipHeight = 50
                            const overflowTop = cellTop - tooltipHeight - 8 < 0

                            setTooltip({
                              x,
                              y: overflowTop ? rect.bottom + 8 : cellTop - 8,
                              date: item.date,
                              count: item.count,
                              dayOfWeek: item.dayOfWeek,
                              overflowTop,
                            })
                          }}
                        />
                      )),
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Tooltip - 使用 portal 渲染到 body，避免被父容器裁剪 */}
          {tooltip &&
            createPortal(
              <div
                className="fixed pointer-events-none bg-white border rounded-lg shadow-lg px-3 py-2 text-xs z-[9999]"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: tooltip.overflowTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
                }}
              >
                <div className="font-medium">{tooltip.date}</div>
                <div className="text-gray-500">
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][tooltip.dayOfWeek]} · 收藏:{' '}
                  {tooltip.count}
                </div>
              </div>,
              document.body,
            )}

          {/* 图例 */}
          <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-2 pr-2">
            <span>少</span>
            {COLORS.map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span>多</span>
          </div>
        </>
      )}
    </div>
  )
}
