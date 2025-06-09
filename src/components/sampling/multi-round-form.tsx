import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import type { 
  MultiRoundSamplingRequest, 
  MultiRoundSamplingRound,
  SamplingMethod
} from "@/lib/api/types"
import { ParametersForm } from "./parameters-form"
import { RowFilter } from "./row-filter"
import { ColumnSelector } from "./column-selector"

interface MultiRoundFormProps {
  datasetId: number
  versionId: number
  datasetColumns: string[]
  onSubmit: (request: MultiRoundSamplingRequest) => void
  isLoading: boolean
}

export function MultiRoundForm({
  datasetId,
  versionId,
  datasetColumns,
  onSubmit,
  isLoading
}: MultiRoundFormProps) {
  const [rounds, setRounds] = useState<MultiRoundSamplingRound[]>([
    {
      round_number: 1,
      method: "random",
      parameters: { sample_size: 1000 },
      output_name: "round_1_sample"
    }
  ])
  const [exportResidual, setExportResidual] = useState(false)
  const [residualOutputName, setResidualOutputName] = useState("final_residual")
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]))

  const addRound = () => {
    const newRoundNumber = rounds.length + 1
    setRounds([...rounds, {
      round_number: newRoundNumber,
      method: "random",
      parameters: { sample_size: 1000 },
      output_name: `round_${newRoundNumber}_sample`
    }])
    setExpandedRounds(new Set([...expandedRounds, newRoundNumber]))
  }

  const removeRound = (roundNumber: number) => {
    setRounds(rounds
      .filter(r => r.round_number !== roundNumber)
      .map((r, idx) => ({ ...r, round_number: idx + 1 }))
    )
  }

  const updateRound = (roundNumber: number, updates: Partial<MultiRoundSamplingRound>) => {
    setRounds(rounds.map(r => 
      r.round_number === roundNumber ? { ...r, ...updates } : r
    ))
  }

  const duplicateRound = (roundNumber: number) => {
    const roundToDuplicate = rounds.find(r => r.round_number === roundNumber)
    if (!roundToDuplicate) return

    const newRound = {
      ...roundToDuplicate,
      round_number: rounds.length + 1,
      output_name: `${roundToDuplicate.output_name}_copy`
    }
    setRounds([...rounds, newRound])
    setExpandedRounds(new Set([...expandedRounds, newRound.round_number]))
  }

  const moveRound = (roundNumber: number, direction: 'up' | 'down') => {
    const index = rounds.findIndex(r => r.round_number === roundNumber)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === rounds.length - 1)
    ) return

    const newRounds = [...rounds]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap the rounds
    const temp = newRounds[index]
    newRounds[index] = newRounds[targetIndex]
    newRounds[targetIndex] = temp
    
    // Update round numbers
    setRounds(newRounds.map((r, idx) => ({ ...r, round_number: idx + 1 })))
  }

  const toggleRoundExpanded = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber)
    } else {
      newExpanded.add(roundNumber)
    }
    setExpandedRounds(newExpanded)
  }

  const handleSubmit = () => {
    const request: MultiRoundSamplingRequest = {
      rounds,
      export_residual: exportResidual,
      ...(exportResidual && { residual_output_name: residualOutputName })
    }
    onSubmit(request)
  }

  const getMethodColor = (method: SamplingMethod) => {
    switch (method) {
      case 'random': return 'from-blue-500 to-indigo-600'
      case 'stratified': return 'from-purple-500 to-pink-600'
      case 'systematic': return 'from-green-500 to-emerald-600'
      case 'cluster': return 'from-orange-500 to-red-600'
      case 'custom': return 'from-cyan-500 to-teal-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configure Multi-Round Sampling</h3>
          <p className="text-sm text-muted-foreground">
            Each round samples from the remaining data after previous rounds
          </p>
        </div>
        <Button onClick={addRound} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Round
        </Button>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          <AnimatePresence>
            {rounds.map((round, index) => (
              <motion.div
                key={round.round_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => toggleRoundExpanded(round.round_number)}
                        >
                          {expandedRounds.has(round.round_number) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <Badge 
                          className={`bg-gradient-to-r ${getMethodColor(round.method)} text-white border-0`}
                        >
                          Round {round.round_number}
                        </Badge>
                        <span className="font-medium text-sm">{round.output_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {round.method}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveRound(round.round_number, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveRound(round.round_number, 'down')}
                          disabled={index === rounds.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => duplicateRound(round.round_number)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeRound(round.round_number)}
                          disabled={rounds.length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <Collapsible open={expandedRounds.has(round.round_number)}>
                    <CollapsibleContent>
                      <CardContent className="p-3 pt-0">
                        <Tabs defaultValue="method" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="method">Method</TabsTrigger>
                            <TabsTrigger value="parameters">Parameters</TabsTrigger>
                            <TabsTrigger value="filters">Filters</TabsTrigger>
                            <TabsTrigger value="selection">Columns</TabsTrigger>
                          </TabsList>

                          <TabsContent value="method" className="space-y-3 mt-3">
                            <div className="space-y-2">
                              <Label>Output Name</Label>
                              <Input
                                value={round.output_name}
                                onChange={(e) => updateRound(round.round_number, { output_name: e.target.value })}
                                placeholder="Enter output name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sampling Method</Label>
                              <Select
                                value={round.method}
                                onValueChange={(value) => {
                                  const method = value as Exclude<SamplingMethod, 'multi-round'>
                                  updateRound(round.round_number, { 
                                    method,
                                    parameters: method === 'random' ? { sample_size: 1000 } :
                                               method === 'stratified' ? { strata_columns: [], sample_size: 1000 } :
                                               method === 'systematic' ? { interval: 10 } :
                                               method === 'cluster' ? { cluster_column: '', num_clusters: 5 } :
                                               { query: '' }
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="random">Random</SelectItem>
                                  <SelectItem value="stratified">Stratified</SelectItem>
                                  <SelectItem value="systematic">Systematic</SelectItem>
                                  <SelectItem value="cluster">Cluster</SelectItem>
                                  <SelectItem value="custom">Custom Query</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TabsContent>

                          <TabsContent value="parameters" className="mt-3">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                              <ParametersForm
                                method={round.method}
                                datasetId={datasetId}
                                versionId={versionId}
                                datasetColumns={datasetColumns}
                                onSubmit={(request) => {
                                  updateRound(round.round_number, { parameters: request.parameters })
                                }}
                                isLoading={false}
                                hideSubmitButton
                                initialValues={round.parameters}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="filters" className="mt-3">
                            <RowFilter
                              columns={datasetColumns}
                              onFiltersChange={(filters) => updateRound(round.round_number, { filters })}
                              filters={round.filters}
                            />
                          </TabsContent>

                          <TabsContent value="selection" className="mt-3">
                            <ColumnSelector
                              columns={datasetColumns}
                              onColumnsChange={(columns) => updateRound(round.round_number, { 
                                selection: { 
                                  ...round.selection, 
                                  columns 
                                } 
                              })}
                              selectedColumns={round.selection?.columns || []}
                            />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="export-residual"
                checked={exportResidual}
                onCheckedChange={(checked) => setExportResidual(checked as boolean)}
              />
              <Label htmlFor="export-residual" className="text-sm font-medium cursor-pointer">
                Export Residual Dataset
              </Label>
            </div>
            {exportResidual && (
              <div className="flex items-center gap-2">
                <Label htmlFor="residual-name" className="text-sm">Name:</Label>
                <Input
                  id="residual-name"
                  value={residualOutputName}
                  onChange={(e) => setResidualOutputName(e.target.value)}
                  placeholder="Residual output name"
                  className="w-48 h-8"
                />
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading || rounds.length === 0}>
            <Play className="w-4 h-4 mr-2" />
            Execute Multi-Round Sampling
          </Button>
        </div>
      </Card>
    </div>
  )
}