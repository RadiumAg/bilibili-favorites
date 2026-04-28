import React from 'react'
import * as echarts from 'echarts'
import { Skeleton } from '@/components/ui/skeleton'
import { useSize } from 'ahooks'

type ChartData = {
  name: string
  value: number
  percentage?: number
}

type DistributionChartProps = {
  data: ChartData[]
  title: string
  loading: boolean
  type?: 'pie' | 'doughnut'
  className?: string
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  title,
  loading,
  type = 'pie',
  className = '',
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)

  const size = useSize(chartRef)

  React.useEffect(() => {
    if (!chartRef.current || !data.length || loading) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current)

    // 配置选项
    const option = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: type === 'doughnut' ? ['40%', '70%'] : '70%',
          center: ['60%', '50%'],
          data: data.map((item) => ({
            name: item.name,
            value: item.value,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            show: true,
            formatter: '{b}: {c}',
          },
        },
      ],
    }

    chartInstance.current.setOption(option)

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [data, title, type, size, loading])

  return (
    <div className={`relative w-full h-80 ${className}`}>
      <div ref={chartRef} className="w-full h-full" />
      {(loading || !data.length) && <Skeleton className="absolute inset-0 rounded-lg" />}
    </div>
  )
}
