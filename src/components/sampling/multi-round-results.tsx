import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { 
  Download, 
  Copy, 
  Database, 
  ChevronRight,
  ChevronLeft,
  Layers,
  CheckCircle2,
  FlaskConical
} from "lucide-react"
import type { JobStatusResponse, MergedSampleResponse } from "@/lib/api/types"
import { toast } from "sonner"

interface MultiRoundResultsProps {
  jobData: JobStatusResponse | null
  mergedSampleData?: MergedSampleResponse
  isLoading?: boolean
  onPageChange?: (page: number) => void
  currentPage?: number
  totalPages?: number
}

export function MultiRoundResults({ 
  jobData, 
  mergedSampleData,
  isLoading = false,
  onPageChange,
  currentPage = 1,
  totalPages = 1
}: MultiRoundResultsProps) {

  const handleDownloadAll = async () => {
    if (!mergedSampleData) return
    
    const csv = [
      mergedSampleData.columns.join(','),
      ...mergedSampleData.data.map(row => 
        mergedSampleData.columns.map(col => {
          const val = row[col]
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sampling_results_page_${currentPage}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded sampling_results_page_${currentPage}.csv`)
  }

  const handleCopyToClipboard = async () => {
    if (!mergedSampleData) return
    
    try {
      const text = JSON.stringify(mergedSampleData.data, null, 2)
      await navigator.clipboard.writeText(text)
      toast.success("Data copied to clipboard!")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }
  
  // Calculate totals from job data
  const totalSamples = jobData?.round_results.reduce((sum, round) => sum + round.sample_size, 0) || 0
  const totalResidual = jobData?.residual_size || 0

  if (!jobData) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No sampling results available</p>
        </div>
      </div>
    )
  }
  
  // Show loading state while fetching merged data
  if (!mergedSampleData && isLoading) {
    return (
      <div className="space-y-6">
        {/* Show job summary while loading data */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              {jobData.completed_rounds} Sampling Rounds Completed
            </h3>
          </div>
          {jobData.execution_time_ms && (
            <p className="text-sm text-muted-foreground">
              Completed in {(jobData.execution_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center p-16">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sample data...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // If we have job data but no merged sample data and not loading, show error
  if (!mergedSampleData) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Failed to load sample data. Please try refreshing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <span className="text-sm font-medium">Loading data...</span>
          </div>
        </div>
      )}
      {/* Header with download all button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              {jobData.completed_rounds} Sampling Rounds • {totalSamples.toLocaleString()} Total Samples
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyToClipboard} size="sm" variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Data
            </Button>
            <Button onClick={handleDownloadAll} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Page
            </Button>
          </div>
        </div>
        {jobData.execution_time_ms && (
          <p className="text-sm text-muted-foreground">
            Completed in {(jobData.execution_time_ms / 1000).toFixed(1)}s
            {totalResidual > 0 && ` • ${totalResidual.toLocaleString()} unsampled rows remaining`}
          </p>
        )}
      </div>

      {/* Round Summary Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {jobData.round_results.map((round) => (
          <Card key={round.round_number} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {round.round_number}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {round.method}
                  </Badge>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Samples:</span>
                  <span className="font-medium">{round.sample_size.toLocaleString()}</span>
                </div>
                {round.summary && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Columns:</span>
                      <span className="font-medium">{round.summary.total_columns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="font-medium">{round.summary.total_rows.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {round.completed_at && round.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {(
                        (new Date(round.completed_at).getTime() - new Date(round.started_at).getTime()) / 1000
                      ).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Merged Sample Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Merged Sample Data</CardTitle>
              <CardDescription>
                Combined results from all sampling rounds
                {mergedSampleData.pagination && (
                  <> • Showing {mergedSampleData.data.length} of {mergedSampleData.pagination.total_items.toLocaleString()} total rows</>
                )}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {mergedSampleData.columns.length} columns
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-[500px] w-full">
              {mergedSampleData.data.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 z-10">
                    <TableRow>
                      {mergedSampleData.columns.map((column) => (
                        <TableHead key={column} className="font-medium">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedSampleData.data.map((row, idx) => (
                      <TableRow key={idx}>
                        {mergedSampleData.columns.map((column) => (
                          <TableCell key={column} className="text-muted-foreground">
                            {row[column]?.toString() || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                  <p>No data available for this page</p>
                </div>
              )}
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Residual Info */}
      {jobData.residual_size && jobData.residual_size > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Database className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-base">Residual Dataset</CardTitle>
                <CardDescription>
                  {jobData.residual_size.toLocaleString()} unsampled records
                  {jobData.residual_summary && (
                    <> • {jobData.residual_summary.total_columns} columns</>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Server-side Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {mergedSampleData.data.length} samples on this page
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="gap-1 pl-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              </PaginationItem>
              
              {(() => {
                const pages = []
                const maxPagesToShow = 7
                const halfRange = Math.floor(maxPagesToShow / 2)
                
                let startPage = Math.max(1, currentPage - halfRange)
                let endPage = Math.min(totalPages, currentPage + halfRange)
                
                // Adjust if we're near the beginning or end
                if (currentPage <= halfRange) {
                  endPage = Math.min(totalPages, maxPagesToShow)
                } else if (currentPage >= totalPages - halfRange) {
                  startPage = Math.max(1, totalPages - maxPagesToShow + 1)
                }
                
                // Always show first page
                if (startPage > 1) {
                  pages.push(1)
                  if (startPage > 2) pages.push('...')
                }
                
                // Show page range
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i)
                }
                
                // Always show last page
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) pages.push('...')
                  pages.push(totalPages)
                }
                
                return pages.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <Button
                        variant={currentPage === page ? "outline" : "ghost"}
                        size="icon"
                        onClick={() => onPageChange(page as number)}
                        disabled={isLoading}
                        className="w-9 h-9"
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  )
                })
              })()}
              
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="gap-1 pr-2.5"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}