import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shuffle, 
  Layers, 
  Grid3x3, 
  Network, 
  Code,
  Check
} from "lucide-react"
import type { SamplingMethod } from "@/lib/api/types"

const samplingMethods = [
  {
    id: "random" as SamplingMethod,
    name: "Random Sampling",
    description: "Select a random subset of data with equal probability",
    icon: Shuffle,
    color: "from-primary to-primary/80",
    params: ["Sample Size", "Seed (optional)"],
  },
  {
    id: "stratified" as SamplingMethod,
    name: "Stratified Sampling",
    description: "Divide data into groups and sample from each proportionally",
    icon: Layers,
    color: "from-primary to-primary/70",
    params: ["Strata Columns", "Sample Size", "Min per Stratum"],
  },
  {
    id: "systematic" as SamplingMethod,
    name: "Systematic Sampling",
    description: "Select every nth element from the dataset",
    icon: Grid3x3,
    color: "from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400",
    params: ["Interval", "Starting Point"],
  },
  {
    id: "cluster" as SamplingMethod,
    name: "Cluster Sampling",
    description: "Randomly select groups and sample within them",
    icon: Network,
    color: "from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400",
    params: ["Cluster Column", "Number of Clusters", "Samples per Cluster"],
  },
  {
    id: "custom" as SamplingMethod,
    name: "Custom Query",
    description: "Write a custom SQL query for complex sampling",
    icon: Code,
    color: "from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400",
    params: ["SQL Query"],
  },
]

interface MethodSelectionProps {
  selectedMethod: SamplingMethod | null
  onSelectMethod: (method: SamplingMethod) => void
  disabled?: boolean
}

export function MethodSelection({ 
  selectedMethod, 
  onSelectMethod, 
  disabled = false 
}: MethodSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {samplingMethods.map((method, index) => {
        const Icon = method.icon
        const isSelected = selectedMethod === method.id

        return (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <Card
              className={`h-full transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 shadow-lg shadow-primary/20 dark:shadow-primary/10"
                  : disabled
                    ? "opacity-60 cursor-default bg-muted/50 dark:bg-muted/30"
                    : "cursor-pointer hover:shadow-xl hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 dark:hover:from-primary/10 dark:hover:to-primary/20 bg-card border-border"
              }`}
              onClick={!disabled ? () => onSelectMethod(method.id) : undefined}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
              <CardContent className="p-4 relative">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br ${method.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-foreground text-sm">{method.name}</h3>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="bg-green-500 rounded-full p-1 shadow-md"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {method.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {method.params.map((param) => (
                        <Badge 
                          key={param} 
                          variant="secondary" 
                          className="text-[10px] px-2 py-0.5"
                        >
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}