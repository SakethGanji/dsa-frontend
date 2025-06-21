"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { chartGradients } from '@/lib/chart-gradients'

interface DistributionShapeProps {
  skewness: number
  kurtosis: number
  title?: string
  description?: string
  className?: string
  height?: number
  color?: keyof typeof chartGradients
}

export function DistributionShape({ 
  skewness, 
  kurtosis, 
  title, 
  description, 
  className,
  height = 120,
  color = 'purple'
}: DistributionShapeProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, theme)
    
    // Generate distribution curve based on skewness and kurtosis
    const generateCurve = () => {
      const points = []
      const steps = 100
      
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * 6 - 3 // -3 to 3 range
        
        // Normal distribution as base
        let y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
        
        // Apply skewness transformation
        if (skewness !== 0) {
          const alpha = skewness / 2
          const delta = alpha / Math.sqrt(1 + alpha * alpha)
          const xi = x - delta * Math.sqrt(2 / Math.PI)
          y = 2 * y * (1 + Math.tanh(alpha * xi)) / 2
        }
        
        // Apply kurtosis transformation (simplified)
        if (kurtosis !== 0) {
          y = y * Math.pow(1 + kurtosis * (x * x - 1) / 6, 0.5)
        }
        
        points.push([x, Math.max(0, y)])
      }
      
      return points
    }

    const curveData = generateCurve()
    
    const option: echarts.EChartsOption = {
      grid: {
        left: 5,
        right: 5,
        top: 10,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'value',
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        show: false
      },
      series: [{
        name: 'Distribution',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0]
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][0] + '80'
            },
            {
              offset: 1,
              color: chartGradients[color][theme === 'dark' ? 'dark' : 'light'][1] + '10'
            }
          ])
        },
        data: curveData
      }],
      tooltip: {
        trigger: 'none'
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
  }, [skewness, kurtosis, theme, color])

  const getSkewnessDescription = () => {
    if (Math.abs(skewness) < 0.5) return "Approximately symmetric"
    if (skewness < -0.5) return "Left-skewed (negative skew)"
    return "Right-skewed (positive skew)"
  }

  const getKurtosisDescription = () => {
    if (Math.abs(kurtosis) < 0.5) return "Mesokurtic (normal)"
    if (kurtosis < -0.5) return "Platykurtic (flat)"
    return "Leptokurtic (peaked)"
  }

  return (
    <div className={cn("space-y-3", className)}>
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
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground">Skewness: <span className="font-medium">{skewness.toFixed(2)}</span></p>
          <p className="text-muted-foreground/80 mt-1">{getSkewnessDescription()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Kurtosis: <span className="font-medium">{kurtosis.toFixed(2)}</span></p>
          <p className="text-muted-foreground/80 mt-1">{getKurtosisDescription()}</p>
        </div>
      </div>
    </div>
  )
}