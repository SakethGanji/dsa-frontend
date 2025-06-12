import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, Plus } from "lucide-react"

interface StepInfo {
  title: string
  subtitle: string
}

interface StepNavigationProps {
  steps: Record<string, StepInfo>
  currentStep: number
  onStepClick: (step: number) => void
  onReset?: () => void
  resetLabel?: string
}

export function StepNavigation({
  steps,
  currentStep,
  onStepClick,
  onReset,
  resetLabel = "New"
}: StepNavigationProps) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border-b px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {Object.entries(steps).map(([step, info]) => {
              const stepNum = parseInt(step)
              const isActive = stepNum === currentStep
              const isCompleted = stepNum < currentStep
              return (
                <React.Fragment key={step}>
                  <motion.button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 dark:shadow-primary/50"
                        : isCompleted
                        ? "bg-card text-foreground border border-border cursor-pointer hover:bg-accent hover:border-accent-foreground/20"
                        : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                    }`}
                    onClick={() => isCompleted && onStepClick(stepNum)}
                    whileHover={isCompleted ? { scale: 1.02 } : {}}
                    whileTap={isCompleted ? { scale: 0.98 } : {}}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {isCompleted ? "✓" : step}
                    </span>
                    <span className="hidden lg:inline">{info.title}</span>
                  </motion.button>
                  {stepNum < Object.keys(steps).length && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 dark:text-muted-foreground/20" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 1 && onReset && (
            <Button 
              variant="outline" 
              onClick={onReset} 
              size="sm" 
              className="text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              {resetLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}