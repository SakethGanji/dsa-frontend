"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { ViolinPlotData } from '../types'

interface ViolinPlotProps {
  data: ViolinPlotData
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function ViolinPlot({ 
  data, 
  title, 
  description, 
  className,
  height = 400,
  color = 'blue'
}: ViolinPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.data.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    // For now, we'll use box plots as a fallback since violin plots require complex custom rendering
    // The backend should ideally provide the density data for proper violin plots
    const boxData = data.data.map(item => [
      item.min,
      item.q1,
      item.median,
      item.q3,
      item.max
    ])

    const option: echarts.EChartsOption = {
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.categories,
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        name: 'Value'
      },
      series: [{
        name: 'Distribution',
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0] + '80',
          borderColor: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1],
          borderWidth: 2
        },
        emphasis: {
          scale: false,
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        }
      }],
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const idx = params.dataIndex
          const item = data.data[idx]
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${data.categories[idx]}</div>
              <div>Min: ${item.min.toFixed(2)}</div>
              <div>Q1: ${item.q1.toFixed(2)}</div>
              <div class="font-semibold">Median: ${item.median.toFixed(2)}</div>
              <div>Q3: ${item.q3.toFixed(2)}</div>
              <div>Max: ${item.max.toFixed(2)}</div>
              ${item.values && item.values.length ? `<div class="mt-1 text-muted-foreground">n = ${item.values.length}</div>` : ''}
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