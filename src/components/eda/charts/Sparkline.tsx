"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { SparklineData } from '../types'

interface SparklineProps {
  data: SparklineData
  title?: string
  className?: string
  height?: number
  width?: number
  color?: keyof typeof chartGradients
}

export function Sparkline({ 
  data, 
  title,
  className,
  height = 40,
  width = 120,
  color = 'blue'
}: SparklineProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.values.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const option: echarts.EChartsOption = {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        show: false,
        data: data.values.map((_, i) => i)
      },
      yAxis: {
        type: 'value',
        show: false,
        min: Math.min(...data.values) * 0.9,
        max: Math.max(...data.values) * 1.1
      },
      series: [{
        type: 'line',
        data: data.values,
        smooth: true,
        symbol: data.show_dots ? 'circle' : 'none',
        symbolSize: 3,
        lineStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0],
          width: 1.5
        },
        areaStyle: data.show_area ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0] + '40' },
            { offset: 1, color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1] + '10' }
          ])
        } : undefined
      }],
      tooltip: {
        trigger: 'axis',
        position: function (point: number[]) {
          return [point[0] - 30, point[1] - 40]
        },
        formatter: function(params: any) {
          return `<div class="text-xs">${params[0].value.toFixed(2)}</div>`
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
    <div className={cn("inline-flex items-center gap-2", className)}>
      {title && (
        <span className="text-xs text-muted-foreground">{title}</span>
      )}
      <div 
        ref={chartRef} 
        style={{ height: `${height}px`, width: `${width}px` }}
        className="inline-block"
      />
    </div>
  )
}