import React from 'react'
import * as echarts from 'echarts'

type ChartData = {
  name: string
  value: number
}

type BarChartProps = {
  data: ChartData[]
  title: string
  horizontal?: boolean
  className?: string
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  horizontal = false,
  className = '',
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)

  React.useEffect(() => {
    if (!chartRef.current || !data.length) return

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
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' },
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
  }, [data, title, horizontal])

  return <div ref={chartRef} className={`w-full h-80 ${className}`} />
}
