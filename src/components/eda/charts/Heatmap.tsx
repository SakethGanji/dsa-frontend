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
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

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
    animation: true,
    animationDuration: 1500,
    animationEasing: 'cubicOut',
    tooltip: {
      position: 'top',
      formatter: function(params: any) {
        if (!params.value || !Array.isArray(params.value)) return ''
        const [colIndex, rowIndex, value] = params.value
        const absValue = Math.abs(value)
        const strength = isCorrelation ? 
          (absValue >= 0.8 ? 'Very Strong' : 
           absValue >= 0.6 ? 'Strong' : 
           absValue >= 0.4 ? 'Moderate' : 
           absValue >= 0.2 ? 'Weak' : 'Very Weak') : ''
        
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">
            ${data.row_labels[rowIndex]} × ${data.col_labels[colIndex]}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 2px; background: ${
              isCorrelation ? 
                (value > 0 ? '#3b82f6' : '#ef4444') : 
                '#3b82f6'
            };"></div>
            <span style="font-size: 16px; font-weight: 600;">${value.toFixed(3)}</span>
            ${strength ? `<span style="font-size: 12px; opacity: 0.7;">(${strength})</span>` : ''}
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
          ? ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2', '#f3f4f6', '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb']
          : ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e']
      }
    },
    series: [{
      name: 'Heatmap',
      type: 'heatmap',
      data: chartData,
      label: {
        show: true,
        fontSize: 11,
        fontWeight: 600,
        color: function(params: any) {
          if (!params.value || !Array.isArray(params.value)) return '#000'
          const value = params.value[2]
          if (isCorrelation) {
            return Math.abs(value) > 0.5 ? '#fff' : '#000'
          }
          return value > (data.max_value - data.min_value) * 0.6 + data.min_value ? '#fff' : '#000'
        },
        formatter: function(params: any) {
          if (!params.value || !Array.isArray(params.value)) return ''
          return params.value[2].toFixed(2)
        }
      },
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          borderColor: isCorrelation ? '#1e293b' : '#3b82f6',
          borderWidth: 3
        }
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      animationDelay: function(idx: number) {
        return idx * 10
      }
    }]
  }

  // Catch any rendering errors
  try {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("space-y-4", className)}
      >
        {title && (
          <div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        )}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-lg" />
              <ReactEChartsCore
                key={echartsTheme}
                echarts={echarts}
                option={option}
                style={{ height: `${height}px`, width: '100%', position: 'relative', zIndex: 1 }}
                theme={echartsTheme}
              />
            </div>
            {isCorrelation && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium">Correlation Guide:</span> Values range from -1 (perfect negative) to +1 (perfect positive).</p>
                    <p>Blue indicates positive correlation, red indicates negative. Stronger colors mean stronger relationships.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  } catch (error) {
    console.error('Heatmap rendering error:', error)
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("space-y-4", className)}
      >
        {title && (
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
          </div>
        )}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <p>Unable to render heatmap</p>
              <p className="text-xs mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
}