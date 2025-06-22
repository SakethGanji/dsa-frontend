import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  Copy,
  Sparkles,
  Filter,
  Columns,
  Settings2,
  FlaskConical,
  Circle,
  Layers,
  Info,
  ArrowRight,
  Package
} from "lucide-react"
import type { 
  MultiRoundSamplingRequest, 
  MultiRoundSamplingRound,
  SamplingMethod,
  RandomSamplingParams,
  StratifiedSamplingParams,
  SystematicSamplingParams,
  ClusterSamplingParams,
  DataFilters
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
  borderColor: string,
  description: string 
}> = {
  random: { 
    icon: Sparkles, 
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    borderColor: 'border-primary/20 dark:border-primary/30',
    description: 'Randomly select rows from the dataset'
  },
  stratified: { 
    icon: Layers, 
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    borderColor: 'border-primary/20 dark:border-primary/30',
    description: 'Sample proportionally from groups'
  },
  systematic: { 
    icon: Settings2, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-600/10 dark:bg-green-400/20',
    borderColor: 'border-green-600/20 dark:border-green-400/30',
    description: 'Select every nth row systematically'
  },
  cluster: { 
    icon: Circle, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-600/10 dark:bg-orange-400/20',
    borderColor: 'border-orange-600/20 dark:border-orange-400/30',
    description: 'Sample entire clusters of data'
  },
  custom: { 
    icon: FlaskConical, 
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-600/10 dark:bg-cyan-400/20',
    borderColor: 'border-cyan-600/20 dark:border-cyan-400/30',
    description: 'Custom SQL query for complex sampling'
  }
}

export function MultiRoundFormV3({
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
        if (stratParams.sample_size) {
          parts.push(`${stratParams.sample_size} samples`)
        }
        break
      }
      case 'systematic': {
        parts.push(`every ${(round.parameters as SystematicSamplingParams).interval}th row`)
        break
      }
      case 'cluster': {
        const clusterParams = round.parameters as ClusterSamplingParams
        parts.push(`${clusterParams.num_clusters} clusters`)
        break
      }
      case 'custom': {
        parts.push('custom query')
        break
      }
    }

    return parts.join(' • ')
  }

  const hasConfiguration = (round: MultiRoundSamplingRound) => {
    const hasFilters = round.filters && (
      (round.filters.conditions && round.filters.conditions.length > 0) ||
      (round.filters.groups && round.filters.groups.length > 0)
    )
    const hasColumns = round.selection?.columns && round.selection.columns.length > 0
    return hasFilters || hasColumns
  }

  const countFilters = (filters?: DataFilters): number => {
    if (!filters) return 0
    let count = 0
    if (filters.conditions) count += filters.conditions.length
    if (filters.groups) {
      filters.groups.forEach((group: DataFilters) => {
        count += countFilters(group)
      })
    }
    return count
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="mb-3">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Multi-round sampling executes sequentially. Each round samples from the residual (unsampled rows) of previous rounds, enabling progressive data refinement.
        </AlertDescription>
      </Alert>

      {/* Rounds List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {rounds.map((round, index) => {
            const isExpanded = expandedRounds.has(round.round_number)
            const methodInfo = methodConfig[round.method as keyof typeof methodConfig]
            const MethodIcon = methodInfo?.icon || Sparkles

            return (
              <motion.div
                key={round.round_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-200",
                  isExpanded && "ring-2 ring-primary/50 shadow-md",
                  methodInfo?.borderColor
                )}>
                  {/* Round Header */}
                  <CardHeader 
                    className={cn(
                      "cursor-pointer select-none",
                      methodInfo?.bgColor
                    )}
                    onClick={() => toggleRoundExpanded(round.round_number)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Round Number Badge */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center font-bold text-sm">
                            {round.round_number}
                          </div>
                          {index > 0 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>

                        {/* Method Icon and Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            methodInfo?.bgColor
                          )}>
                            <MethodIcon className={cn("w-5 h-5", methodInfo?.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{round.output_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {round.method}
                              </Badge>
                              {hasConfiguration(round) && (
                                <div className="flex items-center gap-1">
                                  {countFilters(round.filters) > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Filter className="w-3 h-3" />
                                      {countFilters(round.filters)}
                                    </Badge>
                                  )}
                                  {round.selection?.columns && round.selection.columns.length > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Columns className="w-3 h-3" />
                                      {round.selection.columns.length}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getRoundSummary(round)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveRound(round.round_number, 'up')
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveRound(round.round_number, 'down')
                          }}
                          disabled={index === rounds.length - 1}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateRound(round.round_number)
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeRound(round.round_number)
                          }}
                          disabled={rounds.length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-8 space-y-8 border-t">
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
                                  {Object.entries(methodConfig).map(([method, config]) => (
                                    <SelectItem key={method} value={method}>
                                      <div className="flex items-center gap-2">
                                        <config.icon className={cn("w-4 h-4", config.color)} />
                                        <span className="capitalize">{method}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {methodInfo?.description}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* Parameters */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Settings2 className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Parameters</h4>
                            </div>
                            <div className="rounded-lg border p-4">
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

                          {/* Filters */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Filter className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Row Filters</h4>
                              {countFilters(round.filters) > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {countFilters(round.filters)} active
                                </Badge>
                              )}
                            </div>
                            <RowFilter
                              columns={datasetColumns}
                              filters={round.filters as any}
                              onFiltersChange={(filters) => updateRound(round.round_number, { filters: filters as any })}
                            />
                          </div>

                          {/* Column Selection */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Columns className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium">Column Selection</h4>
                              {round.selection?.columns && round.selection.columns.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {round.selection.columns.length}/{datasetColumns.length} selected
                                </Badge>
                              )}
                            </div>
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
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Add Round Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={addRound}
            variant="outline"
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Round
          </Button>
        </motion.div>
      </div>

      {/* Residual Export and Execute */}
      <Card className="border-2 py-0 gap-0">
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="export-residual"
                      checked={exportResidual}
                      onCheckedChange={(checked) => setExportResidual(checked as boolean)}
                    />
                    <Label 
                      htmlFor="export-residual" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Export Residual Dataset
                    </Label>
                  </div>
                  <CardDescription className="text-xs ml-6">
                    Save remaining unsampled rows as a separate dataset
                  </CardDescription>
                </div>
              </div>
              {exportResidual && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="residual-name" className="text-sm shrink-0">Name:</Label>
                  <Input
                    id="residual-name"
                    value={residualOutputName}
                    onChange={(e) => setResidualOutputName(e.target.value)}
                    placeholder="Residual output name"
                    className="w-48"
                  />
                </div>
              )}
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ready to execute?</p>
                <p className="text-xs text-muted-foreground">
                  {rounds.length} round{rounds.length > 1 ? 's' : ''} configured
                  {exportResidual && ' + residual export'}
                </p>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || rounds.length === 0}
                size="default"
                className="min-w-[160px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Sampling
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}