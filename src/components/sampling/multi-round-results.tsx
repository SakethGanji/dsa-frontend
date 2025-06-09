import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Copy, 
  FileDown, 
  Database, 
  ChevronRight,
  Layers,
  BarChart3,
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
}

export function MultiRoundResults({ results, isLoading = false }: MultiRoundResultsProps) {
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

  const handleCopyToClipboard = (data: SamplingResult[]) => {
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text)
    toast.success("Data copied to clipboard!")
  }

  const handleDownloadAll = () => {
    const allData = results.rounds.flatMap(round => round.data)
    handleDownloadRound(allData, "all_rounds_combined")
  }

  const totalSamples = results.rounds.reduce((sum, round) => sum + round.sample_size, 0)
  const totalRows = totalSamples + (results.residual?.size || 0)

  return (
    <div className="space-y-6">
      {/* Summary Overview */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Sampling Summary</CardTitle>
                <CardDescription>
                  Progressive residual sampling completed
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleDownloadAll} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{results.rounds.length}</p>
              <p className="text-sm text-muted-foreground">Total Rounds</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{totalSamples.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Samples Collected</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{results.residual ? results.residual.size.toLocaleString() : '0'}</p>
              <p className="text-sm text-muted-foreground">Residual Records</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{((totalSamples / totalRows) * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Sample Coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Rounds */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Sampling Rounds
        </h3>
        
        {results.rounds.map((round, index) => {
          const isExpanded = expandedRounds.has(round.round_number)
          const isLast = index === results.rounds.length - 1
          
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
                        {round.sample_size.toLocaleString()} samples
                        {round.summary && (
                          <span className="text-muted-foreground">
                            {' '}• {round.summary.total_columns} columns
                          </span>
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
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Data Preview</h4>
                        <Badge variant="outline" className="text-xs">
                          Showing first 5 rows
                        </Badge>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[200px]">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                {round.data.length > 0 && Object.keys(round.data[0]).slice(0, 5).map((key) => (
                                  <th key={key} className="text-left p-2 font-medium">
                                    {key}
                                  </th>
                                ))}
                                {round.data.length > 0 && Object.keys(round.data[0]).length > 5 && (
                                  <th className="text-left p-2 text-muted-foreground">
                                    +{Object.keys(round.data[0]).length - 5} more
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {round.data.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="border-t">
                                  {Object.entries(row).slice(0, 5).map(([key, value]) => (
                                    <td key={key} className="p-2 text-muted-foreground">
                                      {value?.toString() || '-'}
                                    </td>
                                  ))}
                                  {Object.keys(row).length > 5 && (
                                    <td className="p-2 text-muted-foreground">...</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Round statistics */}
                    {round.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Total Rows</p>
                          <p className="text-2xl font-bold">{round.summary.total_rows.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Columns</p>
                          <p className="text-2xl font-bold">{round.summary.total_columns}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Memory Usage</p>
                          <p className="text-2xl font-bold">{round.summary.memory_usage_mb?.toFixed(2)} MB</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Sample Rate</p>
                          <p className="text-2xl font-bold">
                            {round.pagination ? 
                              `${((round.sample_size / round.pagination.total_items) * 100).toFixed(1)}%` : 
                              '100%'
                            }
                          </p>
                        </div>
                      </div>
                    )}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Residual Data Preview</h4>
                  <Badge variant="outline" className="text-xs">
                    Showing first 5 rows
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[200px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          {Object.keys(results.residual.data[0]).slice(0, 5).map((key) => (
                            <th key={key} className="text-left p-2 font-medium">
                              {key}
                            </th>
                          ))}
                          {Object.keys(results.residual.data[0]).length > 5 && (
                            <th className="text-left p-2 text-muted-foreground">
                              +{Object.keys(results.residual.data[0]).length - 5} more
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {results.residual.data.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-t">
                            {Object.entries(row).slice(0, 5).map(([key, value]) => (
                              <td key={key} className="p-2 text-muted-foreground">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                            {Object.keys(row).length > 5 && (
                              <td className="p-2 text-muted-foreground">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}