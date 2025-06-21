"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { HorizontalBarChartData } from '../types'

interface HorizontalBarChartProps {
  data: HorizontalBarChartData
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function HorizontalBarChart({ 
  data, 
  title, 
  description, 
  className,
  height = 300,
  color = 'blue'
}: HorizontalBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.categories.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Sort data by values (descending)
    const sortedIndices = [...Array(data.values.length).keys()]
      .sort((a, b) => data.values[b] - data.values[a])
    
    const sortedCategories = sortedIndices.map(i => data.categories[i])
    const sortedValues = sortedIndices.map(i => data.values[i])

    const option: echarts.EChartsOption = {
      grid: {
        left: '25%',
        right: '10%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value: number) {
            return value.toLocaleString()
          }
        }
      },
      yAxis: {
        type: 'category',
        data: sortedCategories,
        inverse: true,
        axisLabel: {
          width: 150,
          overflow: 'truncate',
          ellipsis: '...',
          tooltip: {
            show: true
          }
        }
      },
      series: [{
        name: 'Values',
        type: 'bar',
        data: sortedValues,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0] },
            { offset: 1, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1] }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: function(params: any) {
            return params.value.toLocaleString()
          },
          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      }],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          const item = params[0]
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${item.name}</div>
              <div>Value: ${item.value.toLocaleString()}</div>
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