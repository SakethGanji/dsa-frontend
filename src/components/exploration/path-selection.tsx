"use client"

import { motion } from "framer-motion"
import { Database, History, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

interface PathSelectionProps {
  onSelectPath: (path: "new-analysis" | "existing-run") => void
}

export default function PathSelection({ onSelectPath }: PathSelectionProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-muted-foreground">Choose how you want to proceed with your data analysis</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectPath("new-analysis")}
        >
          <Card className="relative cursor-pointer p-6 h-full transition-colors hover:border-primary">
            <div className="rounded-lg bg-primary/10 p-3 w-fit text-primary mb-4">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">New Analysis</h3>
            <p className="text-muted-foreground mb-4">
              Start a new analysis by selecting a dataset, configuring views, and generating outputs
            </p>
            <div className="flex items-center text-primary font-medium">
              Start new analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>

            <div className="absolute bottom-6 right-6 text-xs text-muted-foreground">3 steps</div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectPath("existing-run")}
        >
          <Card className="relative cursor-pointer p-6 h-full transition-colors hover:border-primary">
            <div className="rounded-lg bg-primary/10 p-3 w-fit text-primary mb-4">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">Existing Exploration</h3>
            <p className="text-muted-foreground mb-4">
              View results from a previously run analysis and explore the generated insights
            </p>
            <div className="flex items-center text-primary font-medium">
              View existing runs
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>

            <div className="absolute bottom-6 right-6 text-xs text-muted-foreground">2 steps</div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}