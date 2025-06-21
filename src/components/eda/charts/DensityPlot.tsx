"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { DensityPlotData } from '../types'

interface DensityPlotProps {
  data: DensityPlotData
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function DensityPlot({ 
  data, 
  title, 
  description, 
  className,
  height = 300,
  color = 'purple'
}: DensityPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.x_values.length) return

    const chart = echarts.init(chartRef.current, theme)
    
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
        name: data.label
      },
      yAxis: {
        type: 'value',
        name: 'Density'
      },
      series: [{
        name: 'Density',
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0] + 'CC' },
            { offset: 1, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1] + '20' }
          ])
        },
        lineStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0],
          width: 2
        },
        data: data.x_values.map((x, i) => [x, data.y_values[i]])
      }],
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const point = params[0]
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${data.label}</div>
              <div>Value: ${point.data[0].toFixed(3)}</div>
              <div>Density: ${point.data[1].toFixed(4)}</div>
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