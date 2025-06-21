import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { KeyValueData } from "../types"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KeyValuePairsProps {
  data: KeyValueData
  title?: string
  description?: string
  className?: string
}

export function KeyValuePairs({ data, title, description, className }: KeyValuePairsProps) {
  const entries = Object.entries(data)

  // Generate visual properties for each metric
  const getMetricVisuals = (key: string, value: string | number, index: number) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    const isPercentage = key.toLowerCase().includes('percent') || key.includes('%')
    const isCount = key.toLowerCase().includes('count') || key.toLowerCase().includes('total')
    const isMissing = key.toLowerCase().includes('missing') || key.toLowerCase().includes('null')
    const isUnique = key.toLowerCase().includes('unique')
    const isAverage = key.toLowerCase().includes('mean') || key.toLowerCase().includes('avg')
    
    // Color schemes based on metric type
    if (isMissing) {
      return {
        gradient: "from-red-500/10 to-red-600/5",
        iconColor: "text-red-500",
        valueColor: "from-red-600 to-red-400",
        bgPattern: "bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5",
        trend: numValue > 0 ? "warning" : "good"
      }
    } else if (isUnique) {
      return {
        gradient: "from-purple-500/10 to-purple-600/5",
        iconColor: "text-purple-500",
        valueColor: "from-purple-600 to-purple-400",
        bgPattern: "bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5",
        trend: "neutral"
      }
    } else if (isPercentage) {
      return {
        gradient: "from-blue-500/10 to-blue-600/5",
        iconColor: "text-blue-500",
        valueColor: "from-blue-600 to-blue-400",
        bgPattern: "bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5",
        trend: numValue > 50 ? "up" : "down"
      }
    } else if (isCount) {
      return {
        gradient: "from-green-500/10 to-green-600/5",
        iconColor: "text-green-500",
        valueColor: "from-green-600 to-green-400",
        bgPattern: "bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5",
        trend: "up"
      }
    } else if (isAverage) {
      return {
        gradient: "from-amber-500/10 to-amber-600/5",
        iconColor: "text-amber-500",
        valueColor: "from-amber-600 to-amber-400",
        bgPattern: "bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5",
        trend: "neutral"
      }
    } else {
      // Default colors
      const colors = [
        { gradient: "from-cyan-500/10 to-cyan-600/5", iconColor: "text-cyan-500", valueColor: "from-cyan-600 to-cyan-400", bgPattern: "bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5" },
        { gradient: "from-pink-500/10 to-pink-600/5", iconColor: "text-pink-500", valueColor: "from-pink-600 to-pink-400", bgPattern: "bg-gradient-to-br from-pink-500/5 via-transparent to-pink-500/5" },
        { gradient: "from-indigo-500/10 to-indigo-600/5", iconColor: "text-indigo-500", valueColor: "from-indigo-600 to-indigo-400", bgPattern: "bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/5" },
      ]
      const colorSet = colors[index % colors.length]
      return { ...colorSet, trend: "neutral" }
    }
  }

  // Format value with appropriate display
  const formatValue = (key: string, value: string | number) => {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('percent') || key.includes('%')) {
        return `${value.toFixed(1)}%`
      }
      if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      }
      if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
    return value
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {entries.map(([key, value], index) => {
          const visuals = getMetricVisuals(key, value, index)
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300",
                "bg-gradient-to-br", visuals.gradient,
                "group"
              )}>
                <div className={cn("absolute inset-0", visuals.bgPattern, "opacity-50")} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground/80 leading-tight">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {typeof value === 'number' && (
                      <div className={cn("opacity-60 group-hover:opacity-100 transition-opacity", visuals.iconColor)}>
                        {visuals.trend === "up" && <TrendingUp className="h-4 w-4" />}
                        {visuals.trend === "down" && <TrendingDown className="h-4 w-4" />}
                        {visuals.trend === "neutral" && <Minus className="h-4 w-4" />}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className={cn(
                      "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                      visuals.valueColor
                    )}>
                      {formatValue(key, value)}
                    </p>
                    
                    {/* Visual indicator bar */}
                    {typeof value === 'number' && key.toLowerCase().includes('percent') && (
                      <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full bg-gradient-to-r", visuals.valueColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                          transition={{ delay: index * 0.05 + 0.3, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}