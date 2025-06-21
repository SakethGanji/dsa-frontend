import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { HistogramData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  MarkLineComponent,
  CanvasRenderer,
])

interface HistogramProps {
  data: HistogramData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function Histogram({ 
  data, 
  title, 
  description, 
  className, 
  height = 300 
}: HistogramProps) {
  const echartsTheme = useEChartsTheme()
  const chartData = data.bins.map((bin) => ({
    range: `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`,
    count: bin.count,
    percentage: ((bin.count / data.total_count) * 100).toFixed(1)
  }))

  // Calculate statistics for visualization
  const values = data.bins.flatMap(bin => Array(bin.count).fill((bin.min + bin.max) / 2))
  const mean = values.reduce((a, b) => a + b, 0) / values.length || 0
  const maxCount = Math.max(...data.bins.map(b => b.count))

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      formatter: function(params: any[]) {
        if (!Array.isArray(params) || params.length === 0) return ''
        const param = params[0]
        let content = `<div style="font-weight: 600; margin-bottom: 8px;">Range: ${param.name}</div>`
        content += `<div style="display: flex; flex-direction: column; gap: 4px;">`
        content += `<div style="display: flex; align-items: center; gap: 8px;">`
        content += `<div style="width: 12px; height: 12px; border-radius: 2px; background: ${param.color};"></div>`
        content += `<span style="font-size: 14px;">Count: <strong>${param.value.toLocaleString()}</strong></span>`
        content += `</div>`
        content += `<div style="font-size: 13px; opacity: 0.8;">Percentage: ${param.data.percentage}%</div>`
        content += `</div>`
        return content
      }
    },
    grid: {
      left: 60,
      right: 30,
      bottom: 60,
      top: 20,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.range),
      name: 'Value Range',
      nameLocation: 'middle',
      nameGap: 50,
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
      name: 'Count',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        fontSize: 11
      }
    },
    series: [{
      type: 'bar',
      data: chartData,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowBlur: 4,
        shadowOffsetY: 2,
        color: function(params: any) {
          // Gradient color based on frequency
          const normalizedValue = params.value / maxCount
          return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `rgba(59, 130, 246, ${0.4 + normalizedValue * 0.6})` },
            { offset: 1, color: `rgba(96, 165, 250, ${0.2 + normalizedValue * 0.5})` }
          ])
        }
      },
      emphasis: {
        itemStyle: {
          shadowColor: 'rgba(0, 0, 0, 0.15)',
          shadowBlur: 10,
          shadowOffsetY: 4
        }
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: '#ef4444',
          width: 2,
          type: 'dashed'
        },
        label: {
          position: 'end',
          formatter: 'Mean',
          color: '#ef4444'
        },
        data: [{
          xAxis: Math.floor(mean / ((data.bins[1]?.min || 1) - (data.bins[0]?.min || 0)))
        }]
      },
      animationDelay: function(idx: number) {
        return idx * 30
      }
    }]
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-lg" />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-sm" />
                  <span className="text-sm text-muted-foreground">Distribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed' }} />
                  <span className="text-sm text-muted-foreground">Mean</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{data.total_count.toLocaleString()}</span>
              </div>
            </div>
            <ReactEChartsCore
              key={echartsTheme}
              echarts={echarts}
              option={option}
              style={{ height: `${height}px`, width: '100%', position: 'relative', zIndex: 1 }}
              theme={echartsTheme}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}