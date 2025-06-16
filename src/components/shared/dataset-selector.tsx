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
      className={`transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-primary/40 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 ring-1 ring-primary/20"
          : isCompleted
            ? "bg-card/70 border-border/50 opacity-80"
            : ""
      }`}
    >
      <CardHeader className="pb-2 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted 
                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary" 
                : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
            }`}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <Database className="w-6 h-6" />}
          </motion.div>
          <div>
            <CardTitle className="text-xl font-semibold">Select Dataset</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Choose from your available data sources
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        {selectedDataset && isCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{selectedDataset.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {selectedDataset.id}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/10 border-primary/20">
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