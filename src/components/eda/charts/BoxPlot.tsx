import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BoxplotChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from "@/lib/utils"
import type { BoxPlotData } from "../types"
import '@/lib/echarts-theme'
import { useEChartsTheme } from "@/hooks/use-echarts-theme"

echarts.use([
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
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
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        if (params.componentType === 'series' && params.seriesType === 'boxplot') {
          const data = params.data
          return `
            <div style="font-weight: 500;">${data.name}</div>
            <div style="margin-top: 4px;">
              <div>Max: ${data.value[5].toFixed(2)}</div>
              <div>Q3: ${data.value[4].toFixed(2)}</div>
              <div>Median: ${data.value[3].toFixed(2)}</div>
              <div>Q1: ${data.value[2].toFixed(2)}</div>
              <div>Min: ${data.value[1].toFixed(2)}</div>
            </div>
          `
        } else if (params.componentType === 'series' && params.seriesType === 'scatter' && Array.isArray(params.data)) {
          return `
            <div style="font-weight: 500;">${data.categories[params.data[0]]}</div>
            <div style="margin-top: 4px;">Outlier: ${params.data[1].toFixed(2)}</div>
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
        name: 'boxplot',
        type: 'boxplot',
        data: boxplotData.map((item, index) => ({
          name: data.categories[index],
          value: item
        }))
      },
      {
        name: 'outliers',
        type: 'scatter',
        data: outliers,
        symbolSize: 8
      }
    ]
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
      <div className="text-xs text-muted-foreground">
        <p>Box shows Q1 to Q3 range, line shows median. Whiskers extend to min/max (excluding outliers).</p>
        <p>Individual dots represent outliers (values beyond 1.5 × IQR from Q1/Q3).</p>
      </div>
    </div>
  )
}