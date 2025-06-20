"use client"

import { motion } from "framer-motion"

interface NativeProfileResultsProps {
  data: any
  isLoading?: boolean
}

export function NativeProfileResults({ data, isLoading }: NativeProfileResultsProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
        <p className="text-gray-500">Analyzing your data with Native Profile...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No analysis results available</p>
      </div>
    )
  }

  // For now, display the raw JSON data in a formatted way
  // This will be replaced with proper visualizations based on the render_as types
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Metadata Section */}
      {data.metadata && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Analysis Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Rows:</span>
              <span className="ml-2 font-medium">{data.metadata.total_rows?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Columns:</span>
              <span className="ml-2 font-medium">{data.metadata.total_columns}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sample Size:</span>
              <span className="ml-2 font-medium">{data.metadata.sample_size_used?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-medium">{data.metadata.analysis_duration_seconds?.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Temporary: Display raw JSON for development */}
      <div className="bg-muted/10 rounded-lg p-4 overflow-auto max-h-[600px]">
        <h3 className="font-semibold mb-2">Analysis Results (Raw Data)</h3>
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </div>

      <div className="text-sm text-muted-foreground text-center p-4 border-t">
        <p>Full visualization components for Native Profile will be implemented based on the render_as types.</p>
      </div>
    </motion.div>
  )
}