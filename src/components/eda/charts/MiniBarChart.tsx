"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { MiniBarChartData } from '../types'

interface MiniBarChartProps {
  data: MiniBarChartData
  title?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function MiniBarChart({ 
  data, 
  title,
  className,
  height = 100,
  color = 'blue'
}: MiniBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.values.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Limit bars if max_bars is specified
    const maxBars = data.max_bars || data.values.length
    const displayData = data.values.slice(0, maxBars)
    const displayLabels = data.labels.slice(0, maxBars)

    const option: echarts.EChartsOption = {
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '20%',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: displayLabels,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          fontSize: 10,
          color: theme === 'dark' ? '#6b7280' : '#9ca3af',
          interval: 0,
          rotate: displayLabels.some(l => l.length > 3) ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        show: false
      },
      series: [{
        type: 'bar',
        data: displayData,
        itemStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0],
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: function(params: any) {
            return params.value >= 1000 
              ? (params.value / 1000).toFixed(1) + 'k'
              : params.value.toString()
          },
          fontSize: 9,
          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      }],
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          return `
            <div class="text-xs">
              <div>${params.name}: ${params.value.toLocaleString()}</div>
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
    <div className={cn("space-y-2", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">
          {title}
        </h4>
      )}
      <div 
        ref={chartRef} 
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  )
}