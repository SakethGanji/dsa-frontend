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
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any[]) {
        if (!Array.isArray(params) || params.length === 0) return ''
        const param = params[0]
        let content = `<div style="font-weight: 500;">${param.name}</div>`
        content += `<div style="margin-top: 4px;">Value: ${param.value.toLocaleString()}</div>`
        if (param.data.label) {
          content += `<div style="margin-top: 2px; font-size: 11px;">${param.data.label}</div>`
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
        borderRadius: 2
      },
      label: {
        show: true,
        position: isHorizontal ? 'right' : 'top',
        fontSize: 11,
        formatter: '{c}'
      }
    }]
  }

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
}