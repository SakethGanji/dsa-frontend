"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { TreemapData } from '../types'

interface TreemapProps {
  data: TreemapData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function Treemap({ 
  data, 
  title, 
  description, 
  className,
  height = 400
}: TreemapProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.data.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const colorPalette = [
      chartGradients.blue[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.green[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.amber[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.purple[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.red[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.cyan[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.pink[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.teal[theme === 'dark' ? 'dark' : 'light'][0],
    ]

    const option: echarts.EChartsOption = {
      tooltip: {
        formatter: function(params: any) {
          const value = params.value
          const percentage = params.data.percentage
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${params.name}</div>
              <div>Value: ${value.toLocaleString()}</div>
              ${percentage ? `<div>Percentage: ${percentage}%</div>` : ''}
            </div>
          `
        }
      },
      series: [{
        name: 'Treemap',
        type: 'treemap',
        data: data.data,
        leafDepth: 2,
        visibleMin: 300,
        label: {
          show: true,
          formatter: function(params: any) {
            const name = params.name
            const value = params.value
            return `${name}\n${value.toLocaleString()}`
          },
          fontSize: 12
        },
        upperLabel: {
          show: true,
          height: 30,
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
          backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
          borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 8]
        },
        itemStyle: {
          borderColor: theme === 'dark' ? '#1f2937' : '#fff',
          borderWidth: 2,
          gapWidth: 2,
          borderRadius: 4
        },
        levels: [
          {
            itemStyle: {
              borderColor: theme === 'dark' ? '#1f2937' : '#e5e7eb',
              borderWidth: 0,
              gapWidth: 2
            },
            upperLabel: {
              show: false
            }
          },
          {
            itemStyle: {
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
              borderWidth: 3,
              gapWidth: 2
            },
            emphasis: {
              itemStyle: {
                borderColor: theme === 'dark' ? '#60a5fa' : '#3b82f6'
              }
            }
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              borderWidth: 3,
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        ],
        color: colorPalette,
        colorMappingBy: 'index',
        breadcrumb: {
          show: true,
          height: 22,
          bottom: 0,
          emptyItemWidth: 25,
          itemStyle: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6',
            borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
            borderWidth: 1,
            shadowColor: 'transparent',
            textStyle: {
              color: theme === 'dark' ? '#e5e7eb' : '#374151'
            }
          },
          emphasis: {
            itemStyle: {
              color: chartGradients.blue[theme === 'dark' ? 'dark' : 'light'][0]
            }
          }
        }
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