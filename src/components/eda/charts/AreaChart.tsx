"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { AreaChartData } from '../types'

interface AreaChartProps {
  data: AreaChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function AreaChart({ 
  data, 
  title, 
  description, 
  className,
  height = 350
}: AreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.x_values.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const colorPalette = [
      chartGradients.blue[theme === 'dark' ? 'dark' : 'light'],
      chartGradients.green[theme === 'dark' ? 'dark' : 'light'],
      chartGradients.amber[theme === 'dark' ? 'dark' : 'light'],
      chartGradients.purple[theme === 'dark' ? 'dark' : 'light'],
      chartGradients.red[theme === 'dark' ? 'dark' : 'light'],
      chartGradients.cyan[theme === 'dark' ? 'dark' : 'light'],
    ]

    const series = data.series.map((s, idx) => ({
      name: s.name,
      type: 'line' as const,
      stack: data.stacked ? 'Total' : undefined,
      smooth: true,
      symbol: 'none',
      sampling: 'average',
      itemStyle: {
        color: colorPalette[idx % colorPalette.length][0]
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { 
            offset: 0, 
            color: colorPalette[idx % colorPalette.length][0] + (data.stacked ? 'CC' : '80')
          },
          { 
            offset: 1, 
            color: colorPalette[idx % colorPalette.length][1] + (data.stacked ? '80' : '10')
          }
        ])
      },
      lineStyle: {
        width: 2,
        color: colorPalette[idx % colorPalette.length][0]
      },
      emphasis: {
        focus: 'series'
      },
      data: s.y_values
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: theme === 'dark' ? '#374151' : '#6b7280'
          }
        },
        formatter: function(params: any) {
          let html = `<div class="text-xs"><div class="font-semibold mb-1">${params[0].name}</div>`
          let total = 0
          params.forEach((item: any) => {
            total += item.value
            html += `<div class="flex items-center justify-between gap-4">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                ${item.seriesName}:
              </span>
              <span class="font-medium">${item.value.toLocaleString()}</span>
            </div>`
          })
          if (data.stacked && params.length > 1) {
            html += `<div class="mt-1 pt-1 border-t">
              <div class="flex justify-between gap-4">
                <span>Total:</span>
                <span class="font-bold">${total.toLocaleString()}</span>
              </div>
            </div>`
          }
          html += '</div>'
          return html
        }
      },
      legend: {
        data: data.series.map(s => s.name),
        bottom: 0
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.x_values
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value: number) {
            return value.toLocaleString()
          }
        }
      },
      series: series,
      dataZoom: data.x_values.length > 20 ? [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          height: 20,
          bottom: 40
        }
      ] : undefined
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
  }, [data, theme])

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