"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { LineChartData } from '../types'

interface LineChartProps {
  data: LineChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function LineChart({ 
  data, 
  title, 
  description, 
  className,
  height = 350
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.x_values.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const colorPalette = [
      chartGradients.blue[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.green[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.amber[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.purple[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.red[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.cyan[theme === 'dark' ? 'dark' : 'light'][0],
    ]

    const series = data.series.map((s, idx) => ({
      name: s.name,
      type: 'line' as const,
      data: s.y_values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      sampling: 'average',
      itemStyle: {
        color: colorPalette[idx % colorPalette.length]
      },
      lineStyle: {
        width: 2
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderColor: colorPalette[idx % colorPalette.length],
          borderWidth: 2
        }
      }
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
          params.forEach((item: any) => {
            html += `<div class="flex items-center justify-between gap-4">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                ${item.seriesName}:
              </span>
              <span class="font-medium">${item.value.toLocaleString()}</span>
            </div>`
          })
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