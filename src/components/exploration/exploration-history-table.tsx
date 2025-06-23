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
  BarChart3,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisRun {
  id: number
  type: string
  name: string
  created_at: string
  created_by: string
  status: 'completed' | 'failed' | 'running'
  insights_count?: number
  file_size?: number
}

interface ExplorationHistoryTableProps {
  datasetId: number
  versionId: number
  onAnalysisSelect: (analysis: AnalysisRun) => void
  className?: string
}

// Mock data for now
const mockAnalyses: AnalysisRun[] = [
  {
    id: 1,
    type: "pandas",
    name: "YData Profile",
    created_at: new Date().toISOString(),
    created_by: "user123",
    status: "completed",
    insights_count: 4
  }
]

export function ExplorationHistoryTable({
  datasetId,
  versionId,
  onAnalysisSelect,
  className
}: ExplorationHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  // For now, use mock data
  const analyses = mockAnalyses
  const isLoading = false
  
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchQuery === "" || 
      analysis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.created_by.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })
  
  if (analyses.length === 0 && !isLoading) {
    return (
      <div className={cn("text-center py-8", className)}>
        <BarChart3 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No analyses run yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Run an analysis to see results here
        </p>
      </div>
    )
  }
  
  return (
    <div className={cn("w-full", className)}>
      {/* Compact Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-9"
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filter
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Compact Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="font-medium">Analysis</TableHead>
              <TableHead className="font-medium">Type</TableHead>
              <TableHead className="font-medium text-right">Insights</TableHead>
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
            ) : filteredAnalyses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  <p className="text-sm text-muted-foreground">
                    No analyses match your filters
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAnalyses.map((analysis) => (
                <TableRow 
                  key={analysis.id}
                  className="cursor-pointer h-12"
                  onClick={() => onAnalysisSelect(analysis)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="text-sm">{analysis.name}</div>
                      <div className="text-xs text-muted-foreground">{analysis.created_by}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="text-xs">
                      {analysis.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums">
                    {analysis.insights_count || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(analysis.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="default" 
                      className="gap-1 h-6 text-xs bg-green-500/10 text-green-700 border-green-500/20"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Completed
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
                        <DropdownMenuItem onClick={() => onAnalysisSelect(analysis)}>
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-3.5 h-3.5 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}