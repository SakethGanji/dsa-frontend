"use client"

import { useRef } from "react"
import * as echarts from "echarts/core"
import { GraphChart } from "echarts/charts"
import { 
  TooltipComponent, 
  LegendComponent,
  GridComponent 
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import ReactEChartsCore from "echarts-for-react/lib/core"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { darkTheme } from "@/lib/echarts-theme"
import { useTheme } from "next-themes"

echarts.use([
  GraphChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
])

interface NetworkNode {
  id: string
  label: string
  group?: string
  value?: number
  [key: string]: any
}

interface NetworkEdge {
  source: string
  target: string
  weight?: number
  value?: number
  color?: string
  [key: string]: any
}

interface NetworkGraphData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

interface NetworkGraphProps {
  data: NetworkGraphData
  title?: string
  description?: string
  className?: string
}

export function NetworkGraph({ data, title, description, className }: NetworkGraphProps) {
  const { theme } = useTheme()
  const chartRef = useRef<ReactEChartsCore>(null)

  // Prepare nodes with proper formatting
  const nodes = data.nodes.map(node => ({
    id: node.id,
    name: node.label || node.id,
    category: node.group || 0,
    value: node.value || 10,
    symbolSize: Math.sqrt((node.value || 10) * 10),
    label: {
      show: true,
      fontSize: 12
    },
    ...node
  }))

  // Prepare edges with proper formatting
  const edges = data.edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    value: edge.weight || edge.value || 1,
    lineStyle: {
      width: Math.log(edge.weight || edge.value || 1) + 1,
      color: edge.color || undefined,
      opacity: 0.7
    },
    ...edge
  }))

  // Extract unique groups for categories
  const categories = Array.from(new Set(data.nodes.map(n => n.group).filter(Boolean))).map(group => ({
    name: group as string
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `${params.name}<br/>Group: ${params.data.category || 'Default'}<br/>Value: ${params.value || 'N/A'}`
        } else {
          return `${params.data.source} → ${params.data.target}<br/>Weight: ${params.value || 'N/A'}`
        }
      }
    },
    legend: categories.length > 0 ? {
      data: categories.map(c => c.name),
      orient: 'horizontal',
      left: 'center',
      top: 0
    } : undefined,
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      force: {
        repulsion: 100,
        gravity: 0.1,
        edgeLength: 100,
        layoutAnimation: true
      },
      data: nodes,
      edges: edges,
      categories: categories.length > 0 ? categories : undefined,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 3
        },
        label: {
          fontSize: 16
        }
      },
      label: {
        position: 'right',
        color: theme === 'dark' ? '#e5e5e5' : '#171717'
      },
      lineStyle: {
        curveness: 0.3,
        color: 'source'
      }
    }]
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full h-[400px]">
          <ReactEChartsCore
            ref={chartRef}
            echarts={echarts}
            option={option}
            theme={theme === 'dark' ? 'customed' : undefined}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </CardContent>
    </Card>
  )
}