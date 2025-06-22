import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Copy, 
  Database, 
  ChevronRight,
  ChevronLeft,
  Layers,
  CheckCircle2,
  FlaskConical,
  FileDown,
  Activity,
  Timer,
  BarChart3,
  Eye
} from "lucide-react"
import type { JobStatusResponse, MergedSampleResponse } from "@/lib/api/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const tableRef = useRef<HTMLDivElement>(null)

  // Scroll to table when page changes
  useEffect(() => {
    // Skip on initial mount
    if (!tableRef.current) return
    
    // Small delay to ensure content has rendered
    const timeoutId = setTimeout(() => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect()
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight
        
        // Only scroll if table is not fully visible
        if (!isInViewport) {
          tableRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest' 
          })
        }
      }
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [currentPage])

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
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-6">
            <FlaskConical className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-base">No sampling results available</p>
        </div>
      </div>
    )
  }
  
  // Show loading state while fetching merged data
  if (!mergedSampleData && isLoading) {
    return (
      <div className="space-y-8">
        {/* Show job summary while loading data */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {jobData.completed_rounds} Sampling Rounds Completed
              </h3>
              {jobData.execution_time_ms && (
                <p className="text-sm text-muted-foreground">
                  Completed in {(jobData.execution_time_ms / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center p-20">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary/30 border-r-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sample data...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // If we have job data but no merged sample data and not loading, show error
  if (!mergedSampleData) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <FlaskConical className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-muted-foreground text-base">Failed to load sample data</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-3 bg-background/90 px-6 py-4 rounded-lg shadow-lg border">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary/30 border-r-primary"></div>
            <span className="text-sm font-medium">Loading data...</span>
          </div>
        </div>
      )}
      
      {/* Overview Section */}
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-lg">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rounds</p>
                  <p className="text-2xl font-bold">{jobData.completed_rounds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Samples</p>
                  <p className="text-2xl font-bold">{totalSamples.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                  <Timer className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Execution Time</p>
                  <p className="text-2xl font-bold">
                    {jobData.execution_time_ms ? `${(jobData.execution_time_ms / 1000).toFixed(1)}s` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 rounded-lg">
                  <Database className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Residual Rows</p>
                  <p className="text-2xl font-bold">{totalResidual.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Round Details */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              Round Details
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobData.round_results.map((round) => {
              const duration = round.completed_at && round.started_at
                ? (new Date(round.completed_at).getTime() - new Date(round.started_at).getTime()) / 1000
                : null
                
              return (
                <Card key={round.round_number} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary/20 font-bold">
                          {round.round_number}
                        </div>
                        <div>
                          <CardTitle className="text-base">Round {round.round_number}</CardTitle>
                          <Badge variant="secondary" className="capitalize mt-1">
                            {round.method}
                          </Badge>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Samples</p>
                        <p className="font-semibold">{round.sample_size.toLocaleString()}</p>
                      </div>
                      {duration && (
                        <div>
                          <p className="text-muted-foreground mb-1">Duration</p>
                          <p className="font-semibold">{duration.toFixed(1)}s</p>
                        </div>
                      )}
                    </div>
                    {round.summary && (
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Columns:</span>
                          <span className="font-medium">{round.summary.total_columns}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Rows:</span>
                          <span className="font-medium">{round.summary.total_rows.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      <div ref={tableRef}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              Data Preview
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {mergedSampleData.pagination 
                ? `Showing ${mergedSampleData.data.length} of ${mergedSampleData.pagination.total_items.toLocaleString()} total rows`
                : `Showing ${mergedSampleData.data.length} rows`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyToClipboard} size="sm" variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
            <Button onClick={handleDownloadAll} size="sm" variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] w-full">
              {mergedSampleData.data.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b">
                    <TableRow>
                      <TableHead className="w-12 font-medium text-muted-foreground">#</TableHead>
                      {mergedSampleData.columns.map((column) => (
                        <TableHead key={column} className="font-medium min-w-[120px]">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedSampleData.data.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {(currentPage - 1) * 100 + idx + 1}
                        </TableCell>
                        {mergedSampleData.columns.map((column) => (
                          <TableCell key={column} className="font-mono text-sm">
                            {row[column]?.toString() || <span className="text-muted-foreground/50">-</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground p-20">
                  <div className="text-center">
                    <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No data available for this page</p>
                  </div>
                </div>
              )}
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-6 border border-border/50">
          <div>
            <p className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mergedSampleData.data.length} samples on this page
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
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
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page as number)}
                        disabled={isLoading}
                        className={cn(
                          "w-10 h-10",
                          currentPage === page && "pointer-events-none"
                        )}
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  )
                })
              })()}
              
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="gap-1.5"
                >
                  Next
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