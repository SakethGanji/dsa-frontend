"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { BulletChartData } from '../types'

interface BulletChartProps {
  data: BulletChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function BulletChart({ 
  data, 
  title, 
  description, 
  className,
  height = 120
}: BulletChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Calculate max value from ranges
    const maxValue = Math.max(...data.ranges.map(r => r.max), data.value, data.target)

    const option: echarts.EChartsOption = {
      grid: {
        left: '15%',
        right: '10%',
        top: '20%',
        bottom: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: maxValue * 1.1,
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: [data.label],
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        // Background ranges
        ...data.ranges.map((range, idx) => ({
          name: range.label,
          type: 'bar',
          stack: 'ranges',
          barWidth: 30,
          silent: true,
          itemStyle: {
            color: theme === 'dark' 
              ? ['#1f2937', '#374151', '#4b5563'][idx] 
              : ['#f3f4f6', '#e5e7eb', '#d1d5db'][idx]
          },
          data: [idx === 0 ? range.max : range.max - data.ranges[idx - 1].max],
          z: 0
        })),
        // Actual value bar
        {
          name: 'Value',
          type: 'bar',
          barWidth: 15,
          itemStyle: {
            color: theme === 'dark' ? '#3b82f6' : '#2563eb'
          },
          data: [data.value],
          z: 2
        },
        // Target marker
        {
          name: 'Target',
          type: 'scatter',
          symbol: 'rect',
          symbolSize: [3, 40],
          itemStyle: {
            color: theme === 'dark' ? '#ef4444' : '#dc2626'
          },
          data: [[data.target, 0]],
          z: 3
        }
      ],
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (params.seriesName === 'Value') {
            return `
              <div class="text-xs">
                <div class="font-semibold mb-1">${data.label}</div>
                <div>Value: ${data.value.toFixed(1)}</div>
                <div>Target: ${data.target.toFixed(1)}</div>
                <div class="mt-1">
                  ${data.ranges.map(r => 
                    `<div class="text-muted-foreground">${r.label}: ${r.min}-${r.max}</div>`
                  ).join('')}
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
  }, [data, theme])

  return (
    <Card className={cn("", className)}>
      {(title || description) && (
        <CardHeader className="pb-3">
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