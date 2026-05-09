import React from 'react'
import * as echarts from 'echarts'
import { Skeleton } from '@/components/ui/skeleton'
import { useSize } from 'ahooks'

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

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, loading, className = '' }) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)
  const size = useSize(chartRef)

  React.useEffect(() => {
    if (!chartRef.current || loading) return

    if (!data.length) {
      chartInstance.current = echarts.init(chartRef.current)
      chartInstance.current.setOption({
        title: {
          text: '最近 30 天暂无收藏',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 14 },
        },
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
      })
      return
    }

    chartInstance.current = echarts.init(chartRef.current)

    // 构建 ECharts heatmap 需要的数据格式 [x, y, value]
    // x = 日期索引(0~29), y = dayOfWeek(0~6)
    const heatmapData = data.map((item, index) => [index, item.dayOfWeek, item.count])
    const dateLabels = data.map((item) => item.date)

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const date = dateLabels[params.data[0]]
          const dayName = DAY_NAMES[params.data[1]]
          return `${date} (${dayName})<br/>收藏: <b>${params.data[2]}</b>`
        },
      },
      grid: {
        left: '50',
        right: '20',
        top: '10',
        bottom: '40',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: dateLabels,
        splitArea: { show: true },
        axisLabel: {
          fontSize: 10,
          interval: 4, // 每 5 天显示一个标签
          rotate: 30,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: DAY_NAMES,
        splitArea: { show: true },
        axisLabel: { fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((d) => d.count), 1),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0',
        inRange: {
          color: ['#E8F6FC', '#5CC3F0', '#00AEEC'],
        },
        textStyle: { fontSize: 10 },
      },
      series: [
        {
          name: '收藏数量',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            fontSize: 9,
            color: '#333',
            formatter: (params: any) => (params.data[2] > 0 ? params.data[2] : ''),
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            borderRadius: 4,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [data, size, loading])

  return (
    <div className={`relative w-full h-80 ${className}`}>
      <div ref={chartRef} className="w-full h-full" />
      {(loading || !data.length) && <Skeleton className="absolute inset-0 rounded-lg" />}
    </div>
  )
}
