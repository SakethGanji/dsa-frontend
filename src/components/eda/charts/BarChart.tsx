import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart as EChartsBarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { BarChartData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

echarts.use([
  EChartsBarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  CanvasRenderer,
])

interface BarChartProps {
  data: BarChartData
  title?: string
  description?: string
  className?: string
  height?: number
  layout?: 'vertical' | 'horizontal'
}

export function BarChart({ 
  data, 
  title, 
  description, 
  className, 
  height = 300,
  layout = 'vertical'
}: BarChartProps) {
  const isHorizontal = layout === 'horizontal'
  const echartsTheme = useEChartsTheme()

  const chartData = data.categories.map((category, index) => ({
    name: category,
    value: data.values[index],
    label: data.labels?.[index] || ''
  }))

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'elasticOut',
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
        let content = `<div style="font-weight: 600; margin-bottom: 8px;">${param.name}</div>`
        content += `<div style="display: flex; align-items: center; gap: 8px;">`
        content += `<div style="width: 12px; height: 12px; border-radius: 2px; background: ${param.color};"></div>`
        content += `<span style="font-size: 14px; font-weight: 500;">${param.value.toLocaleString()}</span>`
        content += `</div>`
        if (param.data.label) {
          content += `<div style="margin-top: 4px; font-size: 12px; opacity: 0.7;">${param.data.label}</div>`
        }
        return content
      }
    },
    grid: {
      left: isHorizontal ? 120 : 60,
      right: isHorizontal ? 80 : 30,
      bottom: isHorizontal ? 50 : 80,
      top: 20,
      containLabel: false
    },
    xAxis: {
      type: isHorizontal ? 'value' : 'category',
      data: isHorizontal ? undefined : data.categories,
      name: isHorizontal ? 'Value' : undefined,
      nameLocation: 'middle',
      nameGap: isHorizontal ? 40 : 70,
      axisLabel: {
        rotate: isHorizontal ? 0 : -45,
        fontSize: 11
      },
      splitLine: {
        show: isHorizontal
      }
    },
    yAxis: {
      type: isHorizontal ? 'category' : 'value',
      data: isHorizontal ? data.categories : undefined,
      name: isHorizontal ? undefined : 'Value',
      nameLocation: 'middle',
      nameGap: isHorizontal ? 100 : 50,
      axisLabel: {
        fontSize: 11
      },
      splitLine: {
        show: !isHorizontal
      }
    },
    series: [{
      type: 'bar',
      data: chartData,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 4,
        shadowOffsetY: 2,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#60a5fa' },
          { offset: 1, color: '#3b82f6' }
        ])
      },
      emphasis: {
        itemStyle: {
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 10,
          shadowOffsetY: 4,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#93c5fd' },
            { offset: 1, color: '#60a5fa' }
          ])
        }
      },
      label: {
        show: true,
        position: isHorizontal ? 'right' : 'top',
        fontSize: 12,
        fontWeight: 600,
        formatter: '{c}',
        color: '#64748b'
      },
      animationDelay: function(idx: number) {
        return idx * 50
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-lg" />
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