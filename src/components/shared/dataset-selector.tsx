import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Check } from "lucide-react"
import { DatasetSearchBar } from "@/components/dataset-search"
import type { Dataset } from "@/lib/api/types"

interface DatasetSelectorProps {
  selectedDataset: Dataset | null
  onDatasetSelect: (dataset: Dataset) => void
  isActive: boolean
  isCompleted: boolean
}

export function DatasetSelector({
  selectedDataset,
  onDatasetSelect,
  isActive,
  isCompleted
}: DatasetSelectorProps) {
  return (
    <Card
      className={`transition-all duration-300 ${
        isActive
          ? "border-primary/50 shadow-lg dark:shadow-primary/10 bg-card"
          : isCompleted
            ? "bg-card/50 border-border/50 opacity-75"
            : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted 
                ? "bg-primary/10 text-primary dark:bg-primary/20" 
                : "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            }`}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <Database className="w-6 h-6" />}
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Select Dataset</CardTitle>
            <CardDescription className="text-sm mt-1">
              Choose from your available data sources
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {selectedDataset && isCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">{selectedDataset.name}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Dataset ID: {selectedDataset.id}</p>
                </div>
              </div>
              <Badge variant="secondary">
                <Check className="w-3 h-3 mr-1" />
                Selected
              </Badge>
            </div>
          </motion.div>
        ) : (
          <DatasetSearchBar onSelectDataset={onDatasetSelect} />
        )}
      </CardContent>
    </Card>
  )
}