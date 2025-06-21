"use client"

import { useRef } from "react"
import * as echarts from "echarts/core"
import { ParallelChart } from "echarts/charts"
import { 
  TooltipComponent, 
  LegendComponent,
  ParallelComponent,
  VisualMapComponent
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import ReactEChartsCore from "echarts-for-react/lib/core"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { darkTheme } from "@/lib/echarts-theme"
import { useTheme } from "next-themes"

echarts.use([
  ParallelChart,
  TooltipComponent,
  LegendComponent,
  ParallelComponent,
  VisualMapComponent,
  CanvasRenderer
])

interface Dimension {
  label: string
  min: number
  max: number
  unit?: string
}

interface ParallelCoordinatesData {
  dimensions: Dimension[]
  data: Record<string, number>[]
}

interface ParallelCoordinatesProps {
  data: ParallelCoordinatesData
  title?: string
  description?: string
  className?: string
}

export function ParallelCoordinates({ data, title, description, className }: ParallelCoordinatesProps) {
  const { theme } = useTheme()
  const chartRef = useRef<ReactEChartsCore>(null)

  // Prepare dimensions for ECharts
  const dimensions = data.dimensions.map((dim, index) => ({
    dim: index,
    name: dim.label,
    min: dim.min,
    max: dim.max,
    nameTextStyle: {
      fontSize: 14,
      color: theme === 'dark' ? '#e5e5e5' : '#171717'
    },
    axisLabel: {
      formatter: (value: number) => {
        if (dim.unit) {
          return `${value}${dim.unit}`
        }
        return value.toLocaleString()
      }
    }
  }))

  // Transform data to array format for ECharts
  const seriesData = data.data.map(item => {
    return data.dimensions.map(dim => item[dim.label] || 0)
  })

  // Calculate visual map range based on first dimension
  const firstDimValues = seriesData.map(row => row[0])
  const visualMapMin = Math.min(...firstDimValues)
  const visualMapMax = Math.max(...firstDimValues)

  const option = {
    backgroundColor: 'transparent',
    parallelAxis: dimensions,
    visualMap: {
      show: true,
      min: visualMapMin,
      max: visualMapMax,
      dimension: 0,
      inRange: {
        color: ['#50a3ba', '#eac736', '#d94e5d']
      },
      textStyle: {
        color: theme === 'dark' ? '#e5e5e5' : '#171717'
      }
    },
    parallel: {
      left: '5%',
      right: '13%',
      bottom: '10%',
      top: '15%',
      parallelAxisDefault: {
        type: 'value',
        name: '',
        nameLocation: 'end',
        nameGap: 20,
        nameTextStyle: {
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#4a4a4a' : '#d1d1d1'
          }
        },
        axisTick: {
          lineStyle: {
            color: theme === 'dark' ? '#4a4a4a' : '#d1d1d1'
          }
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          color: theme === 'dark' ? '#a0a0a0' : '#666',
          fontSize: 11
        }
      }
    },
    series: {
      type: 'parallel',
      lineStyle: {
        width: 2,
        opacity: 0.7
      },
      smooth: true,
      data: seriesData
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const dataIndex = params.dataIndex
        const originalData = data.data[dataIndex]
        let tooltipContent = '<div style="padding: 8px;">'
        
        data.dimensions.forEach((dim, index) => {
          const value = params.value[index]
          tooltipContent += `<div style="margin: 4px 0;">
            <strong>${dim.label}:</strong> ${value.toLocaleString()}${dim.unit || ''}
          </div>`
        })
        
        tooltipContent += '</div>'
        return tooltipContent
      }
    }
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