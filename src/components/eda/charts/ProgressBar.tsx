"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProgressBarData } from '../types'

interface ProgressBarProps {
  data: ProgressBarData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function ProgressBar({ 
  data, 
  title, 
  description, 
  className,
  height = 60
}: ProgressBarProps) {
  const percentage = (data.value / data.max_value) * 100
  
  // Determine color based on percentage or use provided color
  const getColor = () => {
    if (data.color) return data.color
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Card className={cn("", className)}>
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{data.label}</span>
            {data.show_percentage !== false && (
              <span className="font-medium">{percentage.toFixed(1)}%</span>
            )}
          </div>
          <div 
            className="relative w-full bg-muted rounded-full overflow-hidden"
            style={{ height: '8px' }}
          >
            <div
              className={cn(
                "absolute top-0 left-0 h-full transition-all duration-500 ease-out",
                getColor()
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.value.toLocaleString()}</span>
            <span>{data.max_value.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}