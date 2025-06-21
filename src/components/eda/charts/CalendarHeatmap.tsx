"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CalendarHeatmapData } from '../types'

interface CalendarHeatmapProps {
  data: CalendarHeatmapData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function CalendarHeatmap({ 
  data, 
  title, 
  description, 
  className,
  height = 200
}: CalendarHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.data.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Get year from start date
    const startYear = new Date(data.start_date).getFullYear()
    const endYear = new Date(data.end_date).getFullYear()
    
    // Calculate max value for color scaling
    const maxValue = Math.max(...data.data.map(d => d.value))

    const option: echarts.EChartsOption = {
      tooltip: {
        formatter: function(params: any) {
          const date = params.data[0]
          const value = params.data[1]
          return `
            <div class="text-xs">
              <div class="font-semibold">${date}</div>
              <div>Value: ${value.toLocaleString()}</div>
            </div>
          `
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        pieces: [
          { lte: 0, color: theme === 'dark' ? '#1f2937' : '#f3f4f6' },
          { gt: 0, lte: maxValue * 0.25, color: '#86efac' },
          { gt: maxValue * 0.25, lte: maxValue * 0.5, color: '#22c55e' },
          { gt: maxValue * 0.5, lte: maxValue * 0.75, color: '#16a34a' },
          { gt: maxValue * 0.75, color: '#15803d' }
        ],
        textStyle: {
          fontSize: 10
        }
      },
      calendar: {
        top: 30,
        left: 60,
        right: 30,
        cellSize: ['auto', 13],
        range: [data.start_date, data.end_date],
        itemStyle: {
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          borderWidth: 0.5
        },
        yearLabel: { 
          show: startYear !== endYear,
          fontSize: 12
        },
        dayLabel: {
          firstDay: 1,
          nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          fontSize: 10
        },
        monthLabel: {
          nameMap: 'en',
          fontSize: 10
        }
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data.data.map(d => [d.date, d.value])
      }]
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