"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'

interface MiniBoxPlotProps {
  data: {
    min: number
    q1: number
    median: number
    q3: number
    max: number
    p5?: number  // 5th percentile
    p95?: number // 95th percentile
  }
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function MiniBoxPlot({ 
  data, 
  title, 
  description, 
  className,
  height = 120,
  color = 'blue'
}: MiniBoxPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Calculate values for box plot
    const boxData = [
      data.p5 ?? data.min,
      data.q1,
      data.median,
      data.q3,
      data.p95 ?? data.max
    ]

    const option: echarts.EChartsOption = {
      grid: {
        left: 10,
        right: 10,
        top: 20,
        bottom: 10,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        show: false
      },
      yAxis: {
        type: 'value',
        show: false,
        min: (data.p5 ?? data.min) * 0.9,
        max: (data.p95 ?? data.max) * 1.1
      },
      series: [{
        name: 'boxplot',
        type: 'boxplot',
        data: [boxData],
        boxWidth: [40, 60],
        itemStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0],
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
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${title || 'Distribution'}</div>
              <div>Max: ${(data.p95 ?? data.max).toLocaleString()}</div>
              <div>Q3: ${data.q3.toLocaleString()}</div>
              <div class="font-semibold">Median: ${data.median.toLocaleString()}</div>
              <div>Q1: ${data.q1.toLocaleString()}</div>
              <div>Min: ${(data.p5 ?? data.min).toLocaleString()}</div>
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
  }, [data, theme, title, color])

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-muted-foreground/80 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div 
        ref={chartRef} 
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  )
}