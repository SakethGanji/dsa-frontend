import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { MultiRoundResults } from "./multi-round-results"
import { useMergedSampleData } from "@/hooks/use-multi-round-job"
import type { JobStatusResponse } from "@/lib/api/types"

interface InlineJobResultsProps {
  job: JobStatusResponse
  isExpanded?: boolean
  onToggleExpand: () => void
}

export function InlineJobResults({ job, isExpanded = true, onToggleExpand }: InlineJobResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Fetch merged sample data when expanded
  const { 
    data: mergedSampleData, 
    isLoading: isLoadingMergedData,
    error: mergedDataError
  } = useMergedSampleData(
    job.id,
    currentPage,
    pageSize,
    isExpanded && !!job.id
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Total samples: {job.round_results.reduce((sum, r) => sum + r.sample_size, 0).toLocaleString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Results
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              View Results
            </>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Separator className="my-4" />
            <div className="space-y-4">
              {mergedDataError ? (
                <div className="p-8 text-center bg-muted/30 rounded-lg">
                  <div className="text-destructive mb-2">Failed to load sampling data</div>
                  <div className="text-sm text-muted-foreground">{String(mergedDataError) || 'Unknown error'}</div>
                </div>
              ) : (
                <MultiRoundResults
                  jobData={job}
                  mergedSampleData={mergedSampleData}
                  isLoading={isLoadingMergedData}
                  onPageChange={setCurrentPage}
                  currentPage={currentPage}
                  totalPages={mergedSampleData?.pagination.total_pages || 1}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}