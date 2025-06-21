"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface RangeChartProps {
  min: number
  max: number
  value?: number
  title?: string
  description?: string
  className?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
  showLabels?: boolean
  height?: number
}

export function RangeChart({ 
  min, 
  max, 
  value,
  title, 
  description, 
  className,
  color = 'blue',
  showLabels = true,
  height = 60
}: RangeChartProps) {
  const range = max - min
  const valuePosition = value ? ((value - min) / range) * 100 : null
  
  const colorMap = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/10',
      bar: 'from-blue-500 to-blue-600',
      dot: 'bg-blue-500'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/10',
      bar: 'from-green-500 to-green-600',
      dot: 'bg-green-500'
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/10',
      bar: 'from-amber-500 to-amber-600',
      dot: 'bg-amber-500'
    },
    red: {
      bg: 'from-red-500/20 to-red-600/10',
      bar: 'from-red-500 to-red-600',
      dot: 'bg-red-500'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/10',
      bar: 'from-purple-500 to-purple-600',
      dot: 'bg-purple-500'
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-600/10',
      bar: 'from-cyan-500 to-cyan-600',
      dot: 'bg-cyan-500'
    }
  }

  const colors = colorMap[color]
  
  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    }
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 })
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
      
      <div className="space-y-2">
        <div className="relative" style={{ height: `${height}px` }}>
          {/* Background track */}
          <div className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-r",
            colors.bg
          )} />
          
          {/* Range bar */}
          <motion.div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r shadow-sm",
              colors.bar
            )}
            initial={{ left: '50%', width: 0 }}
            animate={{ 
              left: '10%',
              width: '80%'
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Value indicator */}
          {valuePosition !== null && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2"
              initial={{ left: '50%', opacity: 0 }}
              animate={{ 
                left: `${10 + (valuePosition * 0.8)}%`,
                opacity: 1
              }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div className={cn(
                "w-4 h-4 rounded-full shadow-lg",
                colors.dot
              )} />
              {showLabels && value && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                  {formatValue(value)}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Min/Max labels */}
          {showLabels && (
            <>
              <div className="absolute left-[10%] -bottom-6 text-xs text-muted-foreground -translate-x-1/2">
                {formatValue(min)}
              </div>
              <div className="absolute right-[10%] -bottom-6 text-xs text-muted-foreground translate-x-1/2">
                {formatValue(max)}
              </div>
            </>
          )}
        </div>
        
        {/* Range text */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Range: <span className="font-medium">{formatValue(range)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}