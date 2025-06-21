"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { StackedBarChartData } from '../types'

interface StackedBarChartProps {
  data: StackedBarChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function StackedBarChart({ 
  data, 
  title, 
  description, 
  className,
  height = 350
}: StackedBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.categories.length) return

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
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: colorPalette[idx % colorPalette.length][0]
      },
      data: s.values
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          let html = `<div class="text-xs"><div class="font-semibold mb-1">${params[0].name}</div>`
          let total = 0
          params.forEach((item: any) => {
            total += item.value
            html += `<div class="flex justify-between gap-4">
              <span>${item.seriesName}:</span>
              <span class="font-medium">${item.value.toLocaleString()}</span>
            </div>`
          })
          html += `<div class="mt-1 pt-1 border-t">
            <div class="flex justify-between gap-4">
              <span>Total:</span>
              <span class="font-bold">${total.toLocaleString()}</span>
            </div>
          </div></div>`
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
        data: data.categories
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value: number) {
            return value.toLocaleString()
          }
        }
      },
      series: series
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