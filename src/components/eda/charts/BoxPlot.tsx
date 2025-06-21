import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BoxplotChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { BoxPlotData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

echarts.use([
  BoxplotChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  LegendComponent,
  CanvasRenderer,
])

interface BoxPlotProps {
  data: BoxPlotData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function BoxPlot({ 
  data, 
  title, 
  description, 
  className, 
  height = 400 
}: BoxPlotProps) {
  const echartsTheme = useEChartsTheme()
  const boxplotData = data.data.map(stats => [
    stats.min,
    stats.q1,
    stats.median,
    stats.q3,
    stats.max
  ])

  const outliers = data.data.flatMap((stats, categoryIndex) => 
    stats.outliers.map(value => [categoryIndex, value])
  )

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'elasticOut',
    legend: {
      show: true,
      top: 10,
      right: 10,
      data: ['Distribution', 'Outliers']
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        if (params.componentType === 'series' && params.seriesType === 'boxplot') {
          const data = params.data
          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="opacity: 0.7;">Maximum:</span>
                <span style="font-weight: 500;">${data.value[5].toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="opacity: 0.7;">Q3 (75%):</span>
                <span style="font-weight: 500;">${data.value[4].toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="opacity: 0.7;">Median:</span>
                <span style="font-weight: 600; color: #3b82f6;">${data.value[3].toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="opacity: 0.7;">Q1 (25%):</span>
                <span style="font-weight: 500;">${data.value[2].toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="opacity: 0.7;">Minimum:</span>
                <span style="font-weight: 500;">${data.value[1].toFixed(2)}</span>
              </div>
            </div>
          `
        } else if (params.componentType === 'series' && params.seriesType === 'scatter' && Array.isArray(params.data)) {
          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${data.categories[params.data[0]]}</div>
            <div style="color: #ef4444; font-weight: 500;">Outlier: ${params.data[1].toFixed(2)}</div>
          `
        }
        return ''
      }
    },
    grid: {
      left: 90,
      right: 140,
      bottom: 60,
      top: 60,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      nameLocation: 'middle',
      nameGap: 50,
      name: 'Category',
      axisLabel: {
        rotate: -45,
        fontSize: 11
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      nameLocation: 'middle',
      nameGap: 70,
      axisLabel: {
        fontSize: 11
      }
    },
    series: [
      {
        name: 'Distribution',
        type: 'boxplot',
        data: boxplotData.map((item, index) => ({
          name: data.categories[index],
          value: item
        })),
        itemStyle: {
          borderColor: '#3b82f6',
          borderWidth: 2,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 0.5, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            borderColor: '#2563eb',
            borderWidth: 3,
            shadowColor: 'rgba(59, 130, 246, 0.3)',
            shadowBlur: 10,
            shadowOffsetY: 5
          }
        }
      },
      {
        name: 'Outliers',
        type: 'scatter',
        data: outliers,
        symbolSize: 10,
        itemStyle: {
          color: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1,
          shadowColor: 'rgba(239, 68, 68, 0.3)',
          shadowBlur: 4
        },
        emphasis: {
          itemStyle: {
            color: '#dc2626',
            borderColor: '#b91c1c',
            borderWidth: 2,
            shadowColor: 'rgba(239, 68, 68, 0.5)',
            shadowBlur: 10
          },
          scale: 1.5
        }
      }
    ]
  }

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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-red-500/5 rounded-lg" />
            <ReactEChartsCore
              key={echartsTheme}
              echarts={echarts}
              option={option}
              style={{ height: `${height}px`, width: '100%', position: 'relative', zIndex: 1 }}
              theme={echartsTheme}
            />
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted-foreground/10"
          >
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-medium">Box Plot Guide:</span> The box represents the interquartile range (IQR) from Q1 to Q3, with the median line inside.</p>
                <p>Whiskers extend to the minimum and maximum values within 1.5×IQR. Red dots indicate outliers beyond this range.</p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}