import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { KeyValueData } from "../types"

interface KeyValuePairsProps {
  data: KeyValueData
  title?: string
  description?: string
  className?: string
}

export function KeyValuePairs({ data, title, description, className }: KeyValuePairsProps) {
  const entries = Object.entries(data)

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {entries.map(([key, value], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <Card className="p-4 bg-card hover:bg-accent/50 border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{key}</p>
                <p className="text-xl font-semibold text-foreground font-mono">
                  {typeof value === 'number' 
                    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : value}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}