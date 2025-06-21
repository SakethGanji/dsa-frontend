"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { RangePlotData } from '../types'

interface RangePlotProps {
  data: RangePlotData
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function RangePlot({ 
  data, 
  title, 
  description, 
  className,
  height = 200,
  color = 'blue'
}: RangePlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.categories.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const option: echarts.EChartsOption = {
      grid: {
        left: '15%',
        right: '10%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Value'
      },
      yAxis: {
        type: 'category',
        data: data.categories,
        inverse: true
      },
      series: [
        {
          name: 'Range',
          type: 'custom',
          renderItem: function(params: any, api: any) {
            const categoryIndex = api.value(0)
            const range = data.ranges[categoryIndex]
            
            const minCoord = api.coord([range.min, categoryIndex])
            const maxCoord = api.coord([range.max, categoryIndex])
            const meanCoord = api.coord([range.mean, categoryIndex])
            const medianCoord = api.coord([range.median, categoryIndex])
            
            const height = api.size([0, 1])[1] * 0.6
            
            return {
              type: 'group',
              children: [
                // Range line
                {
                  type: 'line',
                  shape: {
                    x1: minCoord[0],
                    y1: minCoord[1],
                    x2: maxCoord[0],
                    y2: maxCoord[1]
                  },
                  style: {
                    stroke: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0],
                    lineWidth: 3
                  }
                },
                // Min marker
                {
                  type: 'line',
                  shape: {
                    x1: minCoord[0],
                    y1: minCoord[1] - height / 2,
                    x2: minCoord[0],
                    y2: minCoord[1] + height / 2
                  },
                  style: {
                    stroke: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1],
                    lineWidth: 2
                  }
                },
                // Max marker
                {
                  type: 'line',
                  shape: {
                    x1: maxCoord[0],
                    y1: maxCoord[1] - height / 2,
                    x2: maxCoord[0],
                    y2: maxCoord[1] + height / 2
                  },
                  style: {
                    stroke: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1],
                    lineWidth: 2
                  }
                },
                // Mean marker (circle)
                {
                  type: 'circle',
                  shape: {
                    cx: meanCoord[0],
                    cy: meanCoord[1],
                    r: 6
                  },
                  style: {
                    fill: '#22c55e',
                    stroke: theme === 'dark' ? '#1f2937' : '#fff',
                    lineWidth: 2
                  }
                },
                // Median marker (square)
                {
                  type: 'rect',
                  shape: {
                    x: medianCoord[0] - 5,
                    y: medianCoord[1] - 5,
                    width: 10,
                    height: 10
                  },
                  style: {
                    fill: '#eab308',
                    stroke: theme === 'dark' ? '#1f2937' : '#fff',
                    lineWidth: 2
                  }
                }
              ]
            }
          },
          data: data.categories.map((_, idx) => [idx])
        }
      ],
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const idx = params.value[0]
          const range = data.ranges[idx]
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${data.categories[idx]}</div>
              <div>Min: ${range.min.toFixed(2)}</div>
              <div>Max: ${range.max.toFixed(2)}</div>
              <div class="flex items-center gap-1">
                <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                Mean: ${range.mean.toFixed(2)}
              </div>
              <div class="flex items-center gap-1">
                <span class="inline-block w-3 h-3 bg-yellow-500"></span>
                Median: ${range.median.toFixed(2)}
              </div>
              <div class="mt-1 text-muted-foreground">
                Range: ${(range.max - range.min).toFixed(2)}
              </div>
            </div>
          `
        }
      },
      legend: {
        data: [
          { name: 'Mean', icon: 'circle' },
          { name: 'Median', icon: 'rect' }
        ],
        bottom: 0,
        itemStyle: {
          color: function(params: any) {
            return params.name === 'Mean' ? '#22c55e' : '#eab308'
          }
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