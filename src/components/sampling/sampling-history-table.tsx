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
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { 
  Download, 
  Eye, 
  MoreHorizontal, 
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Zap
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
  const [selectedSamples, setSelectedSamples] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
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
    const matchesUser = userFilter === "all" || sample.user_soeid === userFilter
    
    return matchesSearch && matchesStatus && matchesUser
  }) || []

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(data?.runs?.map(s => s.user_soeid) || []))

  // Toggle sample selection
  const toggleSampleSelection = (sampleId: number) => {
    const newSelection = new Set(selectedSamples)
    if (newSelection.has(sampleId)) {
      newSelection.delete(sampleId)
    } else {
      newSelection.add(sampleId)
    }
    setSelectedSamples(newSelection)
  }

  // Select all visible samples
  const toggleSelectAll = () => {
    if (selectedSamples.size === filteredSamples.length && filteredSamples.length > 0) {
      setSelectedSamples(new Set())
    } else {
      setSelectedSamples(new Set(filteredSamples.map(s => s.id)))
    }
  }

  // Get status badge variant and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed'
        }
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed'
        }
      case 'running':
        return {
          variant: 'secondary' as const,
          icon: Zap,
          label: 'Running'
        }
      case 'pending':
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: 'Pending'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: status
        }
    }
  }

  // Get sampling technique display name
  const getSamplingTechnique = (sample: SamplingRun) => {
    const rounds = sample.run_parameters?.request?.rounds || []
    if (rounds.length === 0) return 'Unknown'
    if (rounds.length === 1) return rounds[0].method || 'Unknown'
    return `${rounds[0].method} (${rounds.length} rounds)`
  }

  // Get sample name
  const getSampleName = (sample: SamplingRun) => {
    const firstRound = sample.run_parameters?.request?.rounds?.[0]
    return firstRound?.output_name || `Sample_${sample.id}`
  }

  if (error) {
    return (
      <Card className={cn("w-full p-6", className)}>
        <div className="text-center text-muted-foreground">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p>Failed to load sampling history</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-lg border bg-card overflow-hidden">
          {/* Filters */}
          <div className="p-6 bg-muted/30 border-b">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Filter Results</h3>
              <Button 
                onClick={() => refetch()} 
                variant="ghost" 
                size="sm"
                className="h-8 px-2 hover:bg-muted/60 transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                <span className="ml-1.5">Refresh</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/60 border-border/50 focus:bg-background"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-background/60 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="running">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-blue-500" />
                      Running
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-destructive" />
                      Failed
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      Pending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-background/60 border-border/50">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters Display */}
            {(searchQuery || statusFilter !== "all" || userFilter !== "all") && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchQuery}
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter}
                  </Badge>
                )}
                {userFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    User: {userFilter}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setUserFilter("all")
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="w-[50px] py-4">
                  <Checkbox
                    checked={selectedSamples.size === filteredSamples.length && filteredSamples.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-medium text-foreground">Sample Name</TableHead>
                <TableHead className="font-medium text-foreground">Technique</TableHead>
                <TableHead className="font-medium text-foreground">Version</TableHead>
                <TableHead className="font-medium text-foreground">User</TableHead>
                <TableHead className="font-medium text-foreground">Created At</TableHead>
                <TableHead className="font-medium text-foreground">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading sampling history...
                  </TableCell>
                </TableRow>
              ) : filteredSamples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery || statusFilter !== "all" || userFilter !== "all" 
                        ? "No samples match your filters" 
                        : "No sampling history found"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSamples.map((sample) => {
                  const statusBadge = getStatusBadge(sample.status)
                  const StatusIcon = statusBadge.icon
                  
                  return (
                    <TableRow 
                      key={sample.id}
                      className="cursor-pointer hover:bg-muted/30 transition-all duration-200 border-b border-border/30"
                      onClick={() => onSampleSelect(sample)}
                    >
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSamples.has(sample.id)}
                          onCheckedChange={() => toggleSampleSelection(sample.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium py-4">
                        {getSampleName(sample)}
                      </TableCell>
                      <TableCell className="py-4">{getSamplingTechnique(sample)}</TableCell>
                      <TableCell className="py-4">v{sample.version_number}</TableCell>
                      <TableCell className="py-4">{sample.user_soeid}</TableCell>
                      <TableCell className="py-4">
                        {format(new Date(sample.run_timestamp), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={statusBadge.variant} className="gap-1.5 px-2.5 py-0.5">
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSampleSelect(sample)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {sample.status === 'completed' && (
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
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
          
          {/* Footer with Actions and Pagination */}
          <div className="p-6 bg-muted/10 border-t">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedSamples.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground font-medium">
                      {selectedSamples.size} of {filteredSamples.length} selected
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <Button variant="outline" size="sm" className="h-8">
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Export
                    </Button>
                  </>
                )}
              </div>
              
              {data && data.total_count > pageSize && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={Math.ceil(data.total_count / pageSize)}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={(newSize) => {
                    // Currently pageSize is fixed, but we could make it changeable
                    console.log('Page size change requested:', newSize)
                  }}
                  totalItems={data.total_count}
                  showPageSize={false}
                />
              )}
            </div>
          </div>
      </div>
    </div>
  )
}