"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { QQPlotData } from '../types'

interface QQPlotProps {
  data: QQPlotData
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function QQPlot({ 
  data, 
  title, 
  description, 
  className,
  height = 350,
  color = 'blue'
}: QQPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.theoretical_quantiles.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Calculate min and max for axis range
    const allValues = [...data.theoretical_quantiles, ...data.sample_quantiles]
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const padding = (maxVal - minVal) * 0.1

    // Generate reference line points
    const refLineX = [minVal - padding, maxVal + padding]
    const refLineY = refLineX.map(x => data.reference_line.slope * x + data.reference_line.intercept)

    const option: echarts.EChartsOption = {
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Theoretical Quantiles',
        min: minVal - padding,
        max: maxVal + padding
      },
      yAxis: {
        type: 'value',
        name: 'Sample Quantiles',
        min: minVal - padding,
        max: maxVal + padding
      },
      series: [
        {
          name: 'Reference Line',
          type: 'line',
          data: refLineX.map((x, i) => [x, refLineY[i]]),
          symbol: 'none',
          lineStyle: {
            color: theme === 'dark' ? '#666' : '#999',
            type: 'dashed',
            width: 2
          },
          z: 1
        },
        {
          name: 'Q-Q Points',
          type: 'scatter',
          data: data.theoretical_quantiles.map((t, i) => [t, data.sample_quantiles[i]]),
          symbolSize: 8,
          itemStyle: {
            color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0]
          },
          emphasis: {
            scale: 1.5,
            itemStyle: {
              borderColor: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1],
              borderWidth: 2
            }
          },
          z: 2
        }
      ],
      tooltip: {
        trigger: 'point',
        formatter: function(params: any) {
          if (params.seriesName === 'Q-Q Points') {
            return `
              <div class="text-xs">
                <div class="font-semibold mb-1">Q-Q Plot Point</div>
                <div>Theoretical: ${params.data[0].toFixed(3)}</div>
                <div>Sample: ${params.data[1].toFixed(3)}</div>
                <div class="mt-1 text-muted-foreground">
                  ${Math.abs(params.data[1] - (data.reference_line.slope * params.data[0] + data.reference_line.intercept)) < 0.1 
                    ? 'Close to normal' 
                    : 'Deviates from normal'}
                </div>
              </div>
            `
          }
          return ''
        }
      }
    }

    chart.setOption(option)

    const handleResize = () => {
      chart.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      chart.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [data, theme, color])

  return (
    <Card className={cn("", className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div 
          ref={chartRef} 
          style={{ height: `${height}px` }}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}