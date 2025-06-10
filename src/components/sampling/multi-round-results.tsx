import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  FileDown, 
  Database, 
  ChevronRight,
  ChevronLeft,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react"
import type { MultiRoundSamplingResponse, SamplingResult } from "@/lib/api/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MultiRoundResultsProps {
  results: MultiRoundSamplingResponse
  isLoading?: boolean
  onPageChange?: (page: number) => void
  currentPage?: number
  totalPages?: number
}

export function MultiRoundResults({ 
  results, 
  isLoading = false,
  onPageChange,
  currentPage = 1,
  totalPages = 1
}: MultiRoundResultsProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]))
  const [showResidual, setShowResidual] = useState(false)

  const toggleRound = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber)
    } else {
      newExpanded.add(roundNumber)
    }
    setExpandedRounds(newExpanded)
  }

  const handleDownloadRound = (roundData: SamplingResult[], fileName: string) => {
    if (!roundData || roundData.length === 0) return
    
    const csv = [
      Object.keys(roundData[0]).join(','),
      ...roundData.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${fileName}.csv`)
  }

  const handleCopyToClipboard = async (data: SamplingResult[]) => {
    try {
      const text = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(text)
      toast.success("Data copied to clipboard!")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }
  

  const handleDownloadAll = async () => {
    // For now, just download the displayed data
    // In a real implementation, this would fetch all pages from the server
    const allData = results.rounds.flatMap(round => round.data)
    handleDownloadRound(allData, "all_rounds_combined")
    
    if (totalSamples > displayedSamples) {
      toast.info("Downloaded displayed samples. For complete dataset, please use the API export endpoint.")
    }
  }

  const totalSamples = results.rounds.reduce((sum, round) => sum + (round.pagination?.total_items || round.data.length), 0)
  const displayedSamples = results.rounds.reduce((sum, round) => sum + round.data.length, 0)

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
      {/* Header with download all button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              {results.rounds.length} Sampling Rounds • {totalSamples.toLocaleString()} Total Samples
            </h3>
          </div>
          <Button onClick={handleDownloadAll} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download All Data
          </Button>
        </div>
        {totalSamples > displayedSamples && (
          <p className="text-sm text-muted-foreground">
            Viewing {displayedSamples.toLocaleString()} of {totalSamples.toLocaleString()} samples. 
            {onPageChange ? "Navigate pages below or download full dataset separately." : "Use the download button to get all samples."}
          </p>
        )}
      </div>

      {/* Sampling Rounds */}
      <div className="space-y-4">
        
        {results.rounds.map((round) => {
          const isExpanded = expandedRounds.has(round.round_number)
          
          return (
            <Card 
              key={round.round_number} 
              className={cn(
                "transition-all duration-200",
                isExpanded && "ring-2 ring-primary/20"
              )}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleRound(round.round_number)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      "bg-primary/10 text-primary font-semibold"
                    )}>
                      {round.round_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Round {round.round_number}
                        </CardTitle>
                        <Badge variant="secondary" className="capitalize">
                          {round.method}
                        </Badge>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <CardDescription className="mt-1">
                        {round.pagination ? (
                          <>
                            Viewing {round.data.length.toLocaleString()} of {round.pagination.total_items.toLocaleString()} samples
                            {round.summary && (
                              <span className="text-muted-foreground">
                                {' '}• {round.summary.total_columns} columns
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {round.data.length.toLocaleString()} samples
                            {round.summary && (
                              <span className="text-muted-foreground">
                                {' '}• {round.summary.total_columns} columns
                              </span>
                            )}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyToClipboard(round.data)
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadRound(round.data, `round_${round.round_number}_${round.method}`)
                      }}
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {/* Sample preview */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Sample Data</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {round.data.length} rows × {round.data.length > 0 ? Object.keys(round.data[0]).length : 0} columns
                          </Badge>
                          {round.pagination && (
                            <Badge variant="secondary" className="text-xs">
                              API: {round.pagination.total_items} total items
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[400px] w-full">
                          {round.data.length > 0 ? (
                            <Table>
                              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                <TableRow>
                                  {Object.keys(round.data[0]).map((key) => (
                                    <TableHead key={key} className="font-medium">
                                      {key}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {round.data.map((row, idx) => (
                                  <TableRow key={idx}>
                                    {Object.entries(row).map(([key, value]) => (
                                      <TableCell key={key} className="text-muted-foreground">
                                        {value?.toString() || '-'}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <p>No data available</p>
                            </div>
                          )}
                          <ScrollBar orientation="horizontal" />
                          <ScrollBar orientation="vertical" />
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Residual Data */}
      {results.residual && (
        <Card className="border-dashed">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setShowResidual(!showResidual)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Residual Dataset</CardTitle>
                  <CardDescription>
                    {results.residual.size.toLocaleString()} unsampled records remaining
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyToClipboard(results.residual!.data)
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadRound(results.residual!.data, "residual_data")
                  }}
                >
                  <FileDown className="w-4 h-4" />
                </Button>
                {showResidual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
          
          {showResidual && results.residual.data.length > 0 && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Residual Data</h4>
                  {results.residual.data.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {results.residual.data.length} rows × {Object.keys(results.residual.data[0]).length} columns
                    </Badge>
                  )}
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[400px] w-full">
                    {results.residual.data.length > 0 ? (
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-10">
                          <TableRow>
                            {Object.keys(results.residual.data[0]).map((key) => (
                              <TableHead key={key} className="font-medium">
                                {key}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.residual.data.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.entries(row).map(([key, value]) => (
                                <TableCell key={key} className="text-muted-foreground">
                                  {value?.toString() || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No residual data</p>
                      </div>
                    )}
                    <ScrollBar orientation="horizontal" />
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Server-side Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {displayedSamples.toLocaleString()} samples on this page
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