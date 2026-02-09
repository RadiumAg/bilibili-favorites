import React from 'react'
import * as echarts from 'echarts'

interface TrendData {
  date: string
  count: number
  cumulative?: number
}

interface TrendChartProps {
  data: TrendData[]
  title: string
  showCumulative?: boolean
  className?: string
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  showCumulative = false,
  className = '',
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)

  React.useEffect(() => {
    if (!chartRef.current || !data.length) return

    chartInstance.current = echarts.init(chartRef.current)

    const series: any[] = [
      {
        name: '每日收藏',
        type: 'line',
        data: data.map((item) => item.count),
        smooth: true,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: 'rgba(131, 191, 246, 0.1)' },
          ]),
        },
        itemStyle: {
          color: '#1890ff',
        },
      },
    ]

    if (showCumulative) {
      series.push({
        name: '累计收藏',
        type: 'line',
        data: data.map((item) => item.cumulative || 0),
        smooth: true,
        itemStyle: {
          color: '#52c41a',
        },
      })
    }

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
          type: 'cross',
        },
      },
      legend: {
        data: series.map((s) => s.name),
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date),
        axisLabel: {
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
        },
      },
      series,
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
  }, [data, title, showCumulative])

  return <div ref={chartRef} className={`w-full h-80 ${className}`} />
}
