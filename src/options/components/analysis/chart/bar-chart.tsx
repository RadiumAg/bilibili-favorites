import React from 'react'
import * as echarts from 'echarts'
import { Skeleton } from '@/components/ui/skeleton'
import { useSize } from 'ahooks'

type ChartData = {
  name: string
  value: number
}

type BarChartProps = {
  data: ChartData[]
  title: string
  loading: boolean
  horizontal?: boolean
  className?: string
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  loading,
  horizontal = false,
  className = '',
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)
  const size = useSize(chartRef)

  React.useEffect(() => {
    if (!chartRef.current || !data.length || loading) return

    chartInstance.current = echarts.init(chartRef.current)

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
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: horizontal ? '15%' : '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: horizontal ? 'value' : 'category',
        data: horizontal ? undefined : data.map((item) => item.name),
        axisLabel: {
          rotate: horizontal ? 0 : data.length > 6 ? 45 : 0,
          fontSize: 12,
        },
      },
      yAxis: {
        type: horizontal ? 'category' : 'value',
        data: horizontal ? data.map((item) => item.name) : undefined,
        axisLabel: {
          fontSize: 12,
        },
      },
      series: [
        {
          type: 'bar',
          data: data.map((item) => item.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5CC3F0' },
              { offset: 0.5, color: '#00AEEC' },
              { offset: 1, color: '#00AEEC' },
            ]),
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 4, 4],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#7DD3F7' },
                { offset: 0.7, color: '#00AEEC' },
                { offset: 1, color: '#0099D1' },
              ]),
            },
          },
        },
      ],
    }

    chartInstance.current.setOption(option)

    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [data, title, horizontal, size, loading])

  return (
    <div className={`relative w-full h-80 ${className}`}>
      <div ref={chartRef} className="w-full h-full" />
      {(loading || !data.length) && <Skeleton className="absolute inset-0 rounded-lg" />}
    </div>
  )
}
