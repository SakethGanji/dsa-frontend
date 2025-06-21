"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'
import type { DonutChartData } from '../types'

interface DonutChartProps {
  data: DonutChartData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function DonutChart({ 
  data, 
  title, 
  description, 
  className,
  height = 300
}: DonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !data.labels.length) return

    const chart = echarts.init(chartRef.current, theme)
    
    const colors = [
      chartGradients.blue[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.green[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.amber[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.red[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.purple[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.cyan[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.pink[theme === 'dark' ? 'dark' : 'light'][0],
      chartGradients.teal[theme === 'dark' ? 'dark' : 'light'][0],
    ]

    const total = data.values.reduce((a, b) => a + b, 0)

    const option: echarts.EChartsOption = {
      color: colors,
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const percentage = ((params.value / total) * 100).toFixed(1)
          return `
            <div class="text-xs">
              <div class="font-semibold mb-1">${params.name}</div>
              <div>Count: ${params.value.toLocaleString()}</div>
              <div>Percentage: ${percentage}%</div>
            </div>
          `
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        formatter: function(name: string) {
          const idx = data.labels.indexOf(name)
          const value = data.values[idx]
          const percentage = ((value / total) * 100).toFixed(1)
          return `${name}: ${percentage}%`
        },
        textStyle: {
          fontSize: 12
        }
      },
      series: [{
        name: 'Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: theme === 'dark' ? '#1f2937' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: data.labels.map((label, idx) => ({
          value: data.values[idx],
          name: label
        }))
      }],
      graphic: data.center_text ? [{
        type: 'text',
        left: '40%',
        top: 'center',
        style: {
          text: data.center_text,
          textAlign: 'center',
          fill: theme === 'dark' ? '#e5e7eb' : '#374151',
          fontSize: 20,
          fontWeight: 'bold'
        }
      }] : []
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