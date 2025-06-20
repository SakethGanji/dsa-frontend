import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Database,
  Filter,
  Columns,
  Settings2,
  Eye,
  EyeOff,
  FlaskConical,
  Circle
} from "lucide-react"
import type { 
  MultiRoundSamplingRequest, 
  MultiRoundSamplingRound,
  SamplingMethod,
  RandomSamplingParams,
  StratifiedSamplingParams,
  SystematicSamplingParams,
  ClusterSamplingParams
} from "@/lib/api/types"
import { ParametersForm } from "./parameters-form"
import { RowFilter } from "./row-filter"
import { ColumnSelector } from "./column-selector"
import { cn } from "@/lib/utils"

interface MultiRoundFormProps {
  datasetId: number
  versionId: number
  datasetColumns: string[]
  onSubmit: (request: MultiRoundSamplingRequest) => void
  isLoading: boolean
}

const methodConfig: Record<Exclude<SamplingMethod, 'multi-round'>, { 
  icon: typeof Sparkles, 
  color: string, 
  bgColor: string,
  description: string 
}> = {
  random: { 
    icon: Sparkles, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    description: 'Randomly select rows'
  },
  stratified: { 
    icon: Database, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    description: 'Sample by groups'
  },
  systematic: { 
    icon: Settings2, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
    description: 'Select every nth row'
  },
  cluster: { 
    icon: Circle, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    description: 'Sample by clusters'
  },
  custom: { 
    icon: FlaskConical, 
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
    description: 'Custom SQL query'
  }
}

export function MultiRoundFormV2({
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
  const [showAllDetails, setShowAllDetails] = useState(false)

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
    
    const temp = newRounds[index]
    newRounds[index] = newRounds[targetIndex]
    newRounds[targetIndex] = temp
    
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

  const getRoundSummary = (round: MultiRoundSamplingRound) => {
    const parts = []
    
    // Method-specific summary
    switch (round.method) {
      case 'random': {
        parts.push(`${(round.parameters as RandomSamplingParams).sample_size} rows`)
        break
      }
      case 'stratified': {
        const stratParams = round.parameters as StratifiedSamplingParams
        if (stratParams.strata_columns?.length) {
          parts.push(`by ${stratParams.strata_columns.join(', ')}`)
        }
        break
      }
      case 'systematic': {
        parts.push(`every ${(round.parameters as SystematicSamplingParams).interval}th row`)
        break
      }
      case 'cluster': {
        const clusterParams = round.parameters as ClusterSamplingParams
        parts.push(`${clusterParams.num_clusters} clusters from ${clusterParams.cluster_column}`)
        break
      }
      case 'custom': {
        parts.push('custom query')
        break
      }
    }

    // Add filters/columns info
    const filterConditions = round.filters?.conditions
    if (filterConditions && filterConditions.length > 0) {
      parts.push(`${filterConditions.length} filters`)
    }
    if (round.selection?.columns && round.selection.columns.length > 0) {
      parts.push(`${round.selection.columns.length} columns`)
    }

    return parts.join(' • ')
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAllDetails(!showAllDetails)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {showAllDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showAllDetails ? 'Hide' : 'Show'} All Details
          </Button>
        </div>
        <Button onClick={addRound} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Round
        </Button>
      </div>

      {/* Rounds Timeline */}
      <div className="relative">
        <ScrollArea className="w-full pb-4">
          <div className="flex items-center gap-2 min-w-max px-1">
            {rounds.map((round, index) => (
              <React.Fragment key={round.round_number}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Button
                    variant={expandedRounds.has(round.round_number) ? "default" : "outline"}
                    size="sm"
                    className="relative"
                    onClick={() => toggleRoundExpanded(round.round_number)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        expandedRounds.has(round.round_number) 
                          ? "bg-white/20" 
                          : "bg-primary/10"
                      )}>
                        {round.round_number}
                      </div>
                      <span className="font-medium">{round.output_name}</span>
                    </div>
                  </Button>
                  {(round.filters?.conditions?.length || round.selection?.columns?.length) ? (
                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                      {round.filters?.conditions && round.filters.conditions.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                      {round.selection?.columns && round.selection.columns.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  ) : null}
                </motion.div>
                {index < rounds.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
            {exportResidual && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                  {residualOutputName}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Rounds Configuration */}
      <div className="space-y-3">
        <AnimatePresence>
          {rounds.map((round, index) => {
            const isExpanded = expandedRounds.has(round.round_number)
            const MethodIcon = methodConfig[round.method as keyof typeof methodConfig]?.icon || Sparkles
            const methodInfo = methodConfig[round.method as keyof typeof methodConfig]

            return (
              <motion.div
                key={round.round_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-200",
                  isExpanded && "ring-2 ring-primary shadow-lg"
                )}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => toggleRoundExpanded(round.round_number)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          methodInfo?.bgColor
                        )}>
                          <MethodIcon className={cn("w-5 h-5", methodInfo?.color)} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Round {round.round_number}</span>
                            <Badge variant="secondary" className="text-xs">
                              {round.method}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getRoundSummary(round)}
                          </p>
                        </div>
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

                  <AnimatePresence>
                    {(isExpanded || showAllDetails) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-4 pt-0 space-y-4">
                          <Separator />
                          
                          {/* Basic Configuration */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`output_${round.round_number}`}>Output Name</Label>
                              <Input
                                id={`output_${round.round_number}`}
                                value={round.output_name}
                                onChange={(e) => updateRound(round.round_number, { output_name: e.target.value })}
                                placeholder="Enter output name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`method_${round.round_number}`}>Sampling Method</Label>
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
                                <SelectTrigger id={`method_${round.round_number}`}>
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
                          </div>

                          {/* Parameters Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Settings2 className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Parameters</h4>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
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
                                showOnlyParameters
                                initialValues={{ parameters: round.parameters }}
                              />
                            </div>
                          </div>

                          {/* Filters Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Filters</h4>
                              {round.filters?.conditions && round.filters.conditions.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {round.filters.conditions.length} active
                                </Badge>
                              ) : null}
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                              <RowFilter
                                columns={datasetColumns}
                                onFiltersChange={(filters) => updateRound(round.round_number, { 
                                  filters: filters ? {
                                    conditions: filters.conditions || [],
                                    groups: [],
                                    logic: 'AND' as const
                                  } : undefined 
                                })}
                                filters={round.filters?.conditions ? {
                                  conditions: round.filters.conditions,
                                  logic: 'AND' as const
                                } : undefined}
                              />
                            </div>
                          </div>

                          {/* Column Selection */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Columns className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Column Selection</h4>
                              {round.selection?.columns?.length ? (
                                <Badge variant="secondary" className="text-xs">
                                  {round.selection.columns.length} selected
                                </Badge>
                              ) : null}
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
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
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Residual Export Option */}
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
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || rounds.length === 0}
            size="lg"
            className="min-w-[200px]"
          >
            <Play className="w-4 h-4 mr-2" />
            Execute {rounds.length} Round{rounds.length > 1 ? 's' : ''}
          </Button>
        </div>
      </Card>
    </div>
  )
}