"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GaugeChartData } from '../types'

interface GaugeChartProps {
  data: GaugeChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function GaugeChart({ 
  data, 
  title, 
  description, 
  className,
  height = 300
}: GaugeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Calculate percentage
    const percentage = ((data.value - data.min_value) / (data.max_value - data.min_value)) * 100

    // Determine color based on thresholds or percentage
    const getColor = () => {
      if (data.thresholds) {
        for (let i = data.thresholds.length - 1; i >= 0; i--) {
          if (data.value >= data.thresholds[i].value) {
            return data.thresholds[i].color
          }
        }
      }
      // Default color scheme
      if (percentage >= 70) return '#ef4444' // red
      if (percentage >= 30) return '#eab308' // yellow
      return '#22c55e' // green
    }

    const option: echarts.EChartsOption = {
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: data.min_value,
        max: data.max_value,
        splitNumber: 10,
        radius: '85%',
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, '#22c55e'],
              [0.7, '#eab308'],
              [1, '#ef4444']
            ]
          }
        },
        pointer: {
          width: 8,
          length: '80%',
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 10,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 15,
          lineStyle: {
            color: 'auto',
            width: 3
          }
        },
        axisLabel: {
          fontSize: 12,
          distance: -50,
          color: theme === 'dark' ? '#888' : '#666'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '25%'],
          color: getColor(),
          formatter: function(value: number) {
            return value.toFixed(0)
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '50%'],
          fontSize: 14,
          color: theme === 'dark' ? '#aaa' : '#666'
        },
        data: [{
          value: data.value,
          name: data.label
        }]
      }],
      tooltip: {
        formatter: function(params: any) {
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${data.label}</div>
              <div>Value: ${data.value.toFixed(2)}</div>
              <div>Range: ${data.min_value} - ${data.max_value}</div>
              <div>Percentage: ${percentage.toFixed(1)}%</div>
            </div>
          `
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