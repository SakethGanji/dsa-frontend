import { useState } from "react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Download, 
  Eye, 
  MoreHorizontal, 
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Filter
} from "lucide-react"
import { PaginationControls } from "@/components/pagination-controls"
import { useSamplingHistory } from "@/hooks/use-sampling-history"
import { cn } from "@/lib/utils"
import type { SamplingRun } from "@/lib/api/types"

interface SamplingHistoryTableProps {
  datasetId: number
  versionId?: number
  onSampleSelect: (sample: SamplingRun) => void
  className?: string
}

export function SamplingHistoryTable({
  datasetId,
  versionId,
  onSampleSelect,
  className
}: SamplingHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const pageSize = 10

  // Fetch sampling history
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useSamplingHistory({
    datasetId,
    versionId,
    page: currentPage,
    pageSize
  })

  // Filter samples based on search and filters
  const filteredSamples = data?.runs?.filter(sample => {
    const matchesSearch = searchQuery === "" || 
      sample.run_parameters?.request?.rounds?.[0]?.output_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.user_soeid?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || sample.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  // Get status badge variant and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed',
          className: 'bg-green-500/10 text-green-700 border-green-500/20'
        }
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed',
          className: ''
        }
      case 'running':
        return {
          variant: 'secondary' as const,
          icon: Zap,
          label: 'Running',
          className: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
        }
      case 'pending':
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: 'Pending',
          className: ''
        }
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: status,
          className: ''
        }
    }
  }

  // Get sampling technique display name
  const getSamplingTechnique = (sample: SamplingRun) => {
    const rounds = sample.run_parameters?.request?.rounds || []
    if (rounds.length === 0) return '-'
    if (rounds.length === 1) return rounds[0].method || '-'
    return `${rounds[0].method} +${rounds.length - 1}`
  }

  // Get sample name
  const getSampleName = (sample: SamplingRun) => {
    const firstRound = sample.run_parameters?.request?.rounds?.[0]
    return firstRound?.output_name || `Sample_${sample.id}`
  }

  // Get total samples count
  const getTotalSamples = (sample: SamplingRun) => {
    // Try to get from output_summary if available
    if (sample.output_summary?.total_samples) {
      return sample.output_summary.total_samples
    }
    // Calculate from request rounds (estimation)
    const rounds = sample.run_parameters?.request?.rounds || []
    // For now, we'll show a placeholder since we don't have the actual size in the request
    return rounds.length > 0 ? '-' : '0'
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <XCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load sampling history</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all"

  return (
    <div className={cn("w-full", className)}>
      {/* Compact Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("h-9", hasActiveFilters && "border-primary")}
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filter
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1.5 px-1 h-4 text-xs">
              {statusFilter !== "all" ? 1 : 0}
            </Badge>
          )}
        </Button>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          className="h-9"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="h-9 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Compact Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="font-medium">Sample Name</TableHead>
              <TableHead className="font-medium">Technique</TableHead>
              <TableHead className="font-medium text-right">Samples</TableHead>
              <TableHead className="font-medium">Created</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </TableCell>
              </TableRow>
            ) : filteredSamples.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "No samples match your filters" 
                      : "No sampling history found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSamples.map((sample) => {
                const statusBadge = getStatusBadge(sample.status)
                const StatusIcon = statusBadge.icon
                
                return (
                  <TableRow 
                    key={sample.id}
                    className="cursor-pointer h-12"
                    onClick={() => onSampleSelect(sample)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-sm">{getSampleName(sample)}</div>
                        <div className="text-xs text-muted-foreground">{sample.user_soeid}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getSamplingTechnique(sample)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">
                      {typeof getTotalSamples(sample) === 'number' 
                        ? getTotalSamples(sample).toLocaleString() 
                        : getTotalSamples(sample)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sample.run_timestamp), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusBadge.variant} 
                        className={cn("gap-1 h-6 text-xs", statusBadge.className)}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSampleSelect(sample)}>
                            <Eye className="w-3.5 h-3.5 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {sample.status === 'completed' && (
                            <DropdownMenuItem>
                              <Download className="w-3.5 h-3.5 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {data && data.total_count > pageSize && (
        <div className="mt-4 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(data.total_count / pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              console.log('Page size change requested:', newSize)
            }}
            totalItems={data.total_count}
            showPageSize={false}
          />
        </div>
      )}
    </div>
  )
}