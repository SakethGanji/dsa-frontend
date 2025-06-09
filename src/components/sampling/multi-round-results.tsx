import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultsTable } from "./results-table"
import { Download, Copy, FileDown, Database } from "lucide-react"
import type { MultiRoundSamplingResponse } from "@/lib/api/types"
import { toast } from "sonner"

interface MultiRoundResultsProps {
  results: MultiRoundSamplingResponse
  isLoading?: boolean
}

export function MultiRoundResults({ results, isLoading = false }: MultiRoundResultsProps) {
  const getRoundName = (round: typeof results.rounds[0]) => `round_${round.round_number}_${round.method}`
  const [activeTab, setActiveTab] = useState(results.rounds[0] ? getRoundName(results.rounds[0]) : "round_1")

  const handleDownloadRound = (roundData: Record<string, unknown>[], outputName: string) => {
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
    a.download = `${outputName}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${outputName}.csv`)
  }

  const handleCopyToClipboard = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return
    
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text)
    toast.success("Data copied to clipboard!")
  }

  const handleDownloadAll = () => {
    // Create a zip file or multiple downloads
    results.rounds.forEach(round => {
      handleDownloadRound(round.data, round.output_name)
    })
    if (results.residual) {
      handleDownloadRound(results.residual.data, "residual")
    }
  }

  const totalSamples = results.rounds.reduce((sum, round) => sum + round.sample_size, 0)
  const totalRows = totalSamples + (results.residual?.size || 0)

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Multi-Round Sampling Results</CardTitle>
              <CardDescription>
                {results.rounds.length} rounds completed with {totalSamples} total samples
              </CardDescription>
            </div>
            <Button onClick={handleDownloadAll} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{results.rounds.length}</p>
              <p className="text-sm text-muted-foreground">Rounds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalSamples.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Samples</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{results.residual ? results.residual.size.toLocaleString() : '0'}</p>
              <p className="text-sm text-muted-foreground">Residual Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
          <CardDescription>View data from each sampling round</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6">
              <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0 py-2">
                {results.rounds.map((round) => {
                  const roundName = getRoundName(round)
                  return (
                    <TabsTrigger
                      key={roundName}
                      value={roundName}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <span>Round {round.round_number}</span>
                        <Badge variant="secondary" className="text-xs">
                          {round.sample_size.toLocaleString()} rows
                        </Badge>
                      </div>
                    </TabsTrigger>
                  )
                })}
                {results.residual && (
                  <TabsTrigger
                    value="residual"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      <span>Residual</span>
                      <Badge variant="secondary" className="text-xs">
                        {results.residual.size.toLocaleString()} rows
                      </Badge>
                    </div>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {results.rounds.map((round) => {
              const roundName = getRoundName(round)
              return (
                <TabsContent key={roundName} value={roundName} className="m-0">
                  <div className="border-b px-6 py-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Round {round.round_number}: {round.method} sampling</h4>
                      {round.summary && (
                        <p className="text-sm text-muted-foreground">
                          {round.summary.total_rows.toLocaleString()} rows • {round.summary.total_columns} columns
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(round.data)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadRound(round.data, getRoundName(round))}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
                <ResultsTable
                  data={round.data}
                  outputName={getRoundName(round)}
                  method={round.method}
                  isLoading={isLoading}
                />
                </TabsContent>
              )
            })}

            {results.residual && (
              <TabsContent value="residual" className="m-0">
                <div className="border-b px-6 py-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Residual Dataset: {results.residual.output_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Remaining data after all sampling rounds
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(results.residual!.data)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadRound(results.residual!.data, results.residual!.output_name)}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
                <ResultsTable
                  data={results.residual.data}
                  outputName="residual"
                  method="residual"
                  isLoading={isLoading}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}