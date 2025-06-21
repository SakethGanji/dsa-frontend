import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { HistogramData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
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
        content += `<div style="margin-top: 4px;">Count: ${param.value.toLocaleString()}</div>`
        content += `<div>Percentage: ${param.data.percentage}%</div>`
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
        borderRadius: [2, 2, 0, 0]
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