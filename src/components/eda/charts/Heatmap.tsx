import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { HeatmapData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"

echarts.use([
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
  CanvasRenderer,
])

interface HeatmapProps {
  data: HeatmapData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function Heatmap({ 
  data, 
  title, 
  description, 
  className, 
  height = 400 
}: HeatmapProps) {
  const echartsTheme = useEChartsTheme()
  // Validate data
  if (!data || !data.row_labels || !data.col_labels || !data.values) {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          No data available for heatmap
        </div>
      </div>
    )
  }

  // Transform data for ECharts
  const chartData: [number, number, number][] = []
  data.row_labels.forEach((_, rowIndex) => {
    data.col_labels.forEach((_, colIndex) => {
      const value = data.values[rowIndex]?.[colIndex] ?? 0
      chartData.push([colIndex, rowIndex, value])
    })
  })

  const isCorrelation = data.min_value === -1 && data.max_value === 1

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: function(params: any) {
        if (!params.value || !Array.isArray(params.value)) return ''
        const [colIndex, rowIndex, value] = params.value
        return `
          <div style="font-weight: 500;">${data.row_labels[rowIndex]} × ${data.col_labels[colIndex]}</div>
          <div style="margin-top: 4px;">
            <span>${value.toFixed(3)}</span>
          </div>
        `
      }
    },
    grid: {
      left: 90,
      right: 90,
      bottom: 80,
      top: 60,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: data.col_labels,
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: -45,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'category',
      data: data.row_labels,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontSize: 11
      }
    },
    visualMap: {
      min: data.min_value,
      max: data.max_value,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 400,
      text: [isCorrelation ? 'Correlation →' : 'Value →', ''],
      textStyle: {
        fontSize: 11
      },
      inRange: {
        color: isCorrelation
          ? ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#e0e7ff', '#a5b4fc', '#6366f1', '#4f46e5', '#4338ca']
          : ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a']
      }
    },
    series: [{
      name: 'Heatmap',
      type: 'heatmap',
      data: chartData,
      label: {
        show: true,
        fontSize: 10,
        formatter: function(params: any) {
        if (!params.value || !Array.isArray(params.value)) return ''
          return params.value[2].toFixed(2)
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  // Catch any rendering errors
  try {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <ReactEChartsCore
          key={echartsTheme}
          echarts={echarts}
          option={option}
          style={{ height: `${height}px`, width: '100%' }}
          theme={echartsTheme}
        />
      </div>
    )
  } catch (error) {
    console.error('Heatmap rendering error:', error)
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to render heatmap</p>
          <p className="text-xs mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }
}