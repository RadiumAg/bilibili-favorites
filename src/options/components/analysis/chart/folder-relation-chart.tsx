import React from 'react'
import * as echarts from 'echarts'
import { Skeleton } from '@/components/ui/skeleton'
import { useSize } from 'ahooks'

type RelationNode = { name: string; value: number }
type RelationLink = {
  source: string
  target: string
  value: number
  commonUppers: Array<{ mid: number; name: string }>
}

type FolderRelationChartProps = {
  data: {
    nodes: RelationNode[]
    links: RelationLink[]
  }
  loading: boolean
  className?: string
  onEdgeClick?: (edge: { source: string; target: string; commonUppers: Array<{ mid: number; name: string }> }) => void
}

export const FolderRelationChart: React.FC<FolderRelationChartProps> = ({
  data,
  loading,
  className = '',
  onEdgeClick,
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<any>(null)
  const size = useSize(chartRef)

  React.useEffect(() => {
    if (!chartRef.current || loading) return

    if (!data.nodes.length) {
      chartInstance.current = echarts.init(chartRef.current)
      chartInstance.current.setOption({
        title: {
          text: '暂无收藏夹数据',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 14 },
        },
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
      })
      return
    }

    chartInstance.current = echarts.init(chartRef.current)

    // 计算节点大小映射
    const values = data.nodes.map((n) => n.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    const nodes = data.nodes.map((node) => ({
      name: node.name,
      value: node.value,
      symbolSize: 20 + ((node.value - minVal) / range) * 40, // 20~60px
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#5CC3F0' },
          { offset: 1, color: '#00AEEC' },
        ]),
      },
      label: {
        show: true,
        fontSize: 11,
        color: '#333',
        formatter: '{b}\n{c}',
      },
    }))

    const links = data.links.map((link) => ({
      source: link.source,
      target: link.target,
      value: link.value,
      commonUppers: link.commonUppers,
      lineStyle: {
        width: Math.max(1, Math.min(link.value * 2, 8)), // 1~8px
        curveness: 0.2,
        color: 'rgba(0, 174, 236, 0.4)',
      },
      label: {
        show: true,
        fontSize: 9,
        color: '#666',
        formatter: '{c}',
      },
    }))

    const option: Record<string, any> = {
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `<b>${params.name}</b><br/>视频数: ${params.value}`
          }
          if (params.dataType === 'edge') {
            const uppers = params.data.commonUppers as Array<{ mid: number; name: string }> | undefined
            let html = `${params.data.source} ↔ ${params.data.target}<br/>共同 UP 主: <b>${params.data.value}</b>`
            if (uppers && uppers.length > 0) {
              const displayList = uppers.slice(0, 10)
              const remaining = uppers.length - displayList.length
              html += '<br/>' + displayList.map((u) => u.name).join('、')
              if (remaining > 0) {
                html += ` 等${remaining}人`
              }
              html += '<br/><span style="color:#999;font-size:11px">点击查看详情</span>'
            }
            return html
          }
          return ''
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          roam: true,
          draggable: true,
          force: {
            repulsion: 300,
            edgeLength: 120,
            gravity: 0.1,
            layoutAnimation: true,
          },
          label: {
            position: 'right',
            formatter: '{b}',
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
        },
      ],
    }

    // 如果没有边，显示提示
    if (!links.length) {
      option.graphic = [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '收藏夹之间暂无共同 UP 主',
            fill: '#999',
            fontSize: 14,
          },
        },
      ]
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    const handleClick = (params: any) => {
      if (params.dataType === 'edge' && onEdgeClick) {
        onEdgeClick({
          source: params.data.source,
          target: params.data.target,
          commonUppers: params.data.commonUppers ?? [],
        })
      }
    }
    chartInstance.current.on('click', handleClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.off('click', handleClick)
      chartInstance.current?.dispose()
    }
  }, [data, size, loading, onEdgeClick])

  return (
    <div className={`relative w-full h-80 ${className}`}>
      <div ref={chartRef} className="w-full h-full" />
      {(loading || !data.nodes.length) && <Skeleton className="absolute inset-0 rounded-lg" />}
    </div>
  )
}
