import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Plus, X, Filter, Shuffle, Layers, Grid3x3, Network, ArrowDown, ArrowUp, TableProperties } from "lucide-react"
import { ColumnSelector } from "./column-selector"
import { useQuery } from "@tanstack/react-query"
import type { 
  PipelineStep,
  PipelineSamplingRequest,
  SamplingSelection,
  SamplingCondition
} from "@/lib/api/types"
import { motion, AnimatePresence } from "framer-motion"

interface PipelineFormProps {
  datasetId: number
  versionId: number
  datasetColumns?: string[]
  onSubmit: (request: PipelineSamplingRequest) => void
  isLoading?: boolean
}

type StepType = 'filter' | 'random_sample' | 'stratified_sample' | 'systematic_sample' | 'cluster_sample' | 'consecutive_sample'

const stepTypes = [
  { id: 'filter' as StepType, name: 'Filter', icon: Filter, color: 'from-gray-500 to-gray-600' },
  { id: 'random_sample' as StepType, name: 'Random Sample', icon: Shuffle, color: 'from-blue-500 to-indigo-600' },
  { id: 'stratified_sample' as StepType, name: 'Stratified Sample', icon: Layers, color: 'from-purple-500 to-pink-600' },
  { id: 'systematic_sample' as StepType, name: 'Systematic Sample', icon: Grid3x3, color: 'from-green-500 to-emerald-600' },
  { id: 'cluster_sample' as StepType, name: 'Cluster Sample', icon: Network, color: 'from-orange-500 to-red-600' },
  { id: 'consecutive_sample' as StepType, name: 'Consecutive Sample', icon: ArrowDown, color: 'from-cyan-500 to-teal-600' },
]

export function PipelineForm({ 
  datasetId,
  versionId,
  datasetColumns = [],
  onSubmit,
  isLoading = false
}: PipelineFormProps) {
  const [outputName, setOutputName] = useState(`pipeline_sample_${Date.now()}`)
  const [pipeline, setPipeline] = useState<PipelineStep[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [orderDesc, setOrderDesc] = useState(false)
  const [limit, setLimit] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("pipeline")
  const [editingStep, setEditingStep] = useState<number | null>(null)

  // Fetch column metadata
  const { data: columnMetadata } = useQuery({
    queryKey: ['sampling-columns', datasetId, versionId],
    queryFn: async () => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/sampling/${datasetId}/${versionId}/columns`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )
      if (!response.ok) throw new Error('Failed to fetch column metadata')
      return response.json()
    },
    enabled: !!datasetId && !!versionId,
  })

  const handleAddStep = (type: StepType) => {
    const newStep: PipelineStep = createEmptyStep(type)
    setPipeline([...pipeline, newStep])
    setEditingStep(pipeline.length)
  }

  const createEmptyStep = (type: StepType): PipelineStep => {
    switch (type) {
      case 'filter':
        return { step: 'filter', parameters: { conditions: [], logic: 'AND' } }
      case 'random_sample':
        return { step: 'random_sample', parameters: { sample_size: 1000 } }
      case 'stratified_sample':
        return { step: 'stratified_sample', parameters: { strata_columns: [] } }
      case 'systematic_sample':
        return { step: 'systematic_sample', parameters: { interval: 10 } }
      case 'cluster_sample':
        return { step: 'cluster_sample', parameters: { cluster_column: '', num_clusters: 10 } }
      case 'consecutive_sample':
        return { step: 'consecutive_sample', parameters: { interval: 5 } }
    }
  }

  const handleRemoveStep = (index: number) => {
    setPipeline(pipeline.filter((_, i) => i !== index))
    if (editingStep === index) {
      setEditingStep(null)
    } else if (editingStep !== null && editingStep > index) {
      setEditingStep(editingStep - 1)
    }
  }

  const handleUpdateStep = (index: number, updatedStep: PipelineStep) => {
    const newPipeline = [...pipeline]
    newPipeline[index] = updatedStep
    setPipeline(newPipeline)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === pipeline.length - 1)
    ) {
      return
    }

    const newPipeline = [...pipeline]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newPipeline[index], newPipeline[targetIndex]] = [newPipeline[targetIndex], newPipeline[index]]
    setPipeline(newPipeline)

    // Update editing step if needed
    if (editingStep === index) {
      setEditingStep(targetIndex)
    } else if (editingStep === targetIndex) {
      setEditingStep(index)
    }
  }

  const handleSubmit = () => {
    // Build selection object
    const selection: SamplingSelection = {
      columns: selectedColumns.length > 0 ? selectedColumns : undefined,
      order_by: orderBy || undefined,
      order_desc: orderDesc,
      limit: limit || undefined
    }

    const request: PipelineSamplingRequest = {
      pipeline,
      output_name: outputName,
      selection
    }

    onSubmit(request)
  }

  const renderStepEditor = (step: PipelineStep, index: number) => {
    switch (step.step) {
      case 'filter':
        return <FilterEditor step={step} index={index} columns={datasetColumns} onUpdate={handleUpdateStep} />
      case 'random_sample':
        return <RandomSampleEditor step={step} index={index} onUpdate={handleUpdateStep} />
      case 'stratified_sample':
        return <StratifiedSampleEditor step={step} index={index} columns={datasetColumns} onUpdate={handleUpdateStep} />
      case 'systematic_sample':
        return <SystematicSampleEditor step={step} index={index} onUpdate={handleUpdateStep} />
      case 'cluster_sample':
        return <ClusterSampleEditor step={step} index={index} columns={datasetColumns} onUpdate={handleUpdateStep} />
      case 'consecutive_sample':
        return <ConsecutiveSampleEditor step={step} index={index} onUpdate={handleUpdateStep} />
    }
  }

  const isFormValid = () => {
    return outputName && pipeline.length > 0
  }

  const getStepIcon = (stepType: StepType) => {
    const stepDef = stepTypes.find(s => s.id === stepType)
    return stepDef?.icon || Filter
  }

  const getStepColor = (stepType: StepType) => {
    const stepDef = stepTypes.find(s => s.id === stepType)
    return stepDef?.color || 'from-gray-500 to-gray-600'
  }

  const getStepName = (stepType: StepType) => {
    const stepDef = stepTypes.find(s => s.id === stepType)
    return stepDef?.name || 'Unknown'
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline">
            <ArrowDown className="h-4 w-4 mr-2" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="columns">
            <TableProperties className="h-4 w-4 mr-2" />
            Output Columns
          </TabsTrigger>
          <TabsTrigger value="output">
            Output Name
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sampling Pipeline</CardTitle>
              <CardDescription>Build your sampling pipeline by adding and configuring steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Step Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {stepTypes.map((stepType) => {
                  const Icon = stepType.icon
                  return (
                    <Button
                      key={stepType.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddStep(stepType.id)}
                      className="justify-start"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="text-xs">{stepType.name}</span>
                    </Button>
                  )
                })}
              </div>

              {/* Pipeline Steps */}
              <div className="space-y-3">
                <AnimatePresence>
                  {pipeline.map((step, index) => {
                    const StepIcon = getStepIcon(step.step)
                    const isEditing = editingStep === index
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className={`${isEditing ? 'ring-2 ring-blue-400' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${getStepColor(step.step)}`}>
                                  <StepIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    Step {index + 1}: {getStepName(step.step)}
                                    <Badge variant="secondary" className="text-[10px]">
                                      {step.step}
                                    </Badge>
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveStep(index, 'up')}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveStep(index, 'down')}
                                  disabled={index === pipeline.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingStep(isEditing ? null : index)}
                                  className="h-8 px-2"
                                >
                                  {isEditing ? 'Collapse' : 'Edit'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStep(index)}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          {isEditing && (
                            <CardContent className="border-t pt-4">
                              {renderStepEditor(step, index)}
                            </CardContent>
                          )}
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {pipeline.length === 0 && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-8 text-center">
                      <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No Steps Added
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click on the buttons above to add sampling steps to your pipeline
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns">
          <ColumnSelector
            columns={columnMetadata?.columns || datasetColumns}
            columnTypes={columnMetadata?.column_types || {}}
            nullCounts={columnMetadata?.null_counts || {}}
            sampleValues={columnMetadata?.sample_values || {}}
            totalRows={columnMetadata?.total_rows || 0}
            selectedColumns={selectedColumns}
            onColumnsChange={setSelectedColumns}
            orderBy={orderBy}
            orderDesc={orderDesc}
            onOrderChange={(col, desc) => {
              setOrderBy(col)
              setOrderDesc(desc)
            }}
            limit={limit}
            onLimitChange={setLimit}
          />
        </TabsContent>

        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Output Configuration</CardTitle>
              <CardDescription>Name your sampled dataset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="output_name">Output Name *</Label>
                <Input
                  id="output_name"
                  placeholder="Enter a name for the sampled dataset"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">A unique name to identify this sample</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sampling...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Execute Pipeline
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}

// Individual step editors
interface StepEditorProps<T extends PipelineStep> {
  step: T
  index: number
  onUpdate: (index: number, step: T) => void
}

function FilterEditor({ step, index, columns, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'filter' }>> & { columns: string[] }) {
  const handleAddCondition = () => {
    const newCondition: SamplingCondition = {
      column: columns[0] || '',
      operator: '=',
      value: ''
    }
    onUpdate(index, {
      ...step,
      parameters: {
        ...step.parameters,
        conditions: [...step.parameters.conditions, newCondition]
      }
    })
  }

  const handleUpdateCondition = (condIndex: number, condition: SamplingCondition) => {
    const newConditions = [...step.parameters.conditions]
    newConditions[condIndex] = condition
    onUpdate(index, {
      ...step,
      parameters: {
        ...step.parameters,
        conditions: newConditions
      }
    })
  }

  const handleRemoveCondition = (condIndex: number) => {
    onUpdate(index, {
      ...step,
      parameters: {
        ...step.parameters,
        conditions: step.parameters.conditions.filter((_, i) => i !== condIndex)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Filter Logic</Label>
        <Select
          value={step.parameters.logic}
          onValueChange={(value: 'AND' | 'OR') => 
            onUpdate(index, {
              ...step,
              parameters: { ...step.parameters, logic: value }
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Conditions</Label>
          <Button variant="outline" size="sm" onClick={handleAddCondition}>
            <Plus className="w-3 h-3 mr-1" />
            Add Condition
          </Button>
        </div>
        
        <div className="space-y-2">
          {step.parameters.conditions.map((condition, condIndex) => (
            <div key={condIndex} className="flex items-center gap-2 p-2 border rounded-md">
              <Select
                value={condition.column}
                onValueChange={(value) => 
                  handleUpdateCondition(condIndex, { ...condition, column: value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(value) => 
                  handleUpdateCondition(condIndex, { ...condition, operator: value as SamplingCondition['operator'] })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="=">=</SelectItem>
                  <SelectItem value="!=">!=</SelectItem>
                  <SelectItem value=">">{'>'}</SelectItem>
                  <SelectItem value="<">{'<'}</SelectItem>
                  <SelectItem value=">=">{'>='}</SelectItem>
                  <SelectItem value="<=">{'<='}</SelectItem>
                  <SelectItem value="IN">IN</SelectItem>
                  <SelectItem value="NOT IN">NOT IN</SelectItem>
                  <SelectItem value="LIKE">LIKE</SelectItem>
                  <SelectItem value="IS NULL">IS NULL</SelectItem>
                  <SelectItem value="IS NOT NULL">IS NOT NULL</SelectItem>
                </SelectContent>
              </Select>

              {condition.operator !== 'IS NULL' && condition.operator !== 'IS NOT NULL' && (
                <Input
                  value={String(condition.value || '')}
                  onChange={(e) => {
                    let value: string | number | string[] | number[] = e.target.value
                    // Try to parse as array for IN/NOT IN operators
                    if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
                      try {
                        value = JSON.parse(e.target.value)
                      } catch {
                        // Keep as string if not valid JSON
                      }
                    }
                    handleUpdateCondition(condIndex, { ...condition, value })
                  }}
                  placeholder={condition.operator === 'IN' || condition.operator === 'NOT IN' ? '[1, 2, 3]' : 'Value'}
                  className="flex-1"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCondition(condIndex)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RandomSampleEditor({ step, index, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'random_sample' }>>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`sample_size_${index}`}>Sample Size *</Label>
        <Input
          id={`sample_size_${index}`}
          type="number"
          placeholder="Enter sample size"
          value={step.parameters.sample_size || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, sample_size: parseInt(e.target.value) || 0 }
          })}
        />
        <p className="text-xs text-muted-foreground">Number of rows to randomly select</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`seed_${index}`}>Random Seed (Optional)</Label>
        <Input
          id={`seed_${index}`}
          type="number"
          placeholder="Enter seed for reproducibility"
          value={step.parameters.seed || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, seed: e.target.value ? parseInt(e.target.value) : undefined }
          })}
        />
        <p className="text-xs text-muted-foreground">Set a seed for reproducible results</p>
      </div>
    </div>
  )
}

function StratifiedSampleEditor({ step, index, columns, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'stratified_sample' }>> & { columns: string[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Strata Columns *</Label>
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex flex-wrap gap-2 min-h-[38px]">
            {step.parameters.strata_columns?.map((col) => (
              <Badge key={col} variant="secondary" className="gap-1">
                {col}
                <button
                  type="button"
                  onClick={() => onUpdate(index, { 
                    ...step, 
                    parameters: {
                      ...step.parameters,
                      strata_columns: step.parameters.strata_columns?.filter(c => c !== col) || []
                    }
                  })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {(!step.parameters.strata_columns || step.parameters.strata_columns.length === 0) && (
              <span className="text-muted-foreground text-sm">Select columns for stratification</span>
            )}
          </div>
          <Select
            value=""
            onValueChange={(value) => {
              const currentColumns = step.parameters.strata_columns || []
              if (!currentColumns.includes(value)) {
                onUpdate(index, {
                  ...step,
                  parameters: {
                    ...step.parameters,
                    strata_columns: [...currentColumns, value]
                  }
                })
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add column..." />
            </SelectTrigger>
            <SelectContent>
              {columns
                .filter(col => !step.parameters.strata_columns?.includes(col))
                .map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`sample_size_${index}`}>Sample Size (Optional)</Label>
        <Input
          id={`sample_size_${index}`}
          type="number"
          step="any"
          placeholder="Total sample size or percentage (e.g., 1000 or 0.1 for 10%)"
          value={step.parameters.sample_size || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, sample_size: e.target.value ? parseFloat(e.target.value) : undefined }
          })}
        />
        <p className="text-xs text-muted-foreground">Enter a whole number for absolute size or decimal {'<'} 1 for percentage</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`seed_${index}`}>Random Seed (Optional)</Label>
        <Input
          id={`seed_${index}`}
          type="number"
          placeholder="Enter seed for reproducibility"
          value={step.parameters.seed || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, seed: e.target.value ? parseInt(e.target.value) : undefined }
          })}
        />
      </div>
    </div>
  )
}

function SystematicSampleEditor({ step, index, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'systematic_sample' }>>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`interval_${index}`}>Interval *</Label>
        <Input
          id={`interval_${index}`}
          type="number"
          placeholder="Select every nth row"
          value={step.parameters.interval || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, interval: parseInt(e.target.value) || 0 }
          })}
        />
        <p className="text-xs text-muted-foreground">Select every nth row from the dataset</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`start_${index}`}>Starting Point (Optional)</Label>
        <Input
          id={`start_${index}`}
          type="number"
          placeholder="Starting row index"
          value={step.parameters.start || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, start: e.target.value ? parseInt(e.target.value) : undefined }
          })}
        />
        <p className="text-xs text-muted-foreground">Row to start sampling from (default: 0)</p>
      </div>
    </div>
  )
}

function ClusterSampleEditor({ step, index, columns, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'cluster_sample' }>> & { columns: string[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`cluster_column_${index}`}>Cluster Column *</Label>
        <Select
          value={step.parameters.cluster_column || ""}
          onValueChange={(value) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, cluster_column: value }
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select cluster column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Column that defines clusters</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`num_clusters_${index}`}>Number of Clusters *</Label>
        <Input
          id={`num_clusters_${index}`}
          type="number"
          placeholder="Number of clusters to select"
          value={step.parameters.num_clusters || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, num_clusters: parseInt(e.target.value) || 0 }
          })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`sample_within_${index}`}>Sample Within Clusters</Label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`sample_within_${index}`}
            checked={step.parameters.sample_within_clusters || false}
            onChange={(e) => onUpdate(index, {
              ...step,
              parameters: { ...step.parameters, sample_within_clusters: e.target.checked }
            })}
            className="w-4 h-4 rounded border-gray-300"
          />
          <Label htmlFor={`sample_within_${index}`} className="text-sm font-normal">
            Sample within selected clusters
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">If checked, will sample data within each selected cluster</p>
      </div>
    </div>
  )
}

function ConsecutiveSampleEditor({ step, index, onUpdate }: StepEditorProps<Extract<PipelineStep, { step: 'consecutive_sample' }>>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`interval_${index}`}>Interval *</Label>
        <Input
          id={`interval_${index}`}
          type="number"
          placeholder="Select every nth consecutive row"
          value={step.parameters.interval || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, interval: parseInt(e.target.value) || 0 }
          })}
        />
        <p className="text-xs text-muted-foreground">Select every nth consecutive row from the dataset</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`start_${index}`}>Starting Point (Optional)</Label>
        <Input
          id={`start_${index}`}
          type="number"
          placeholder="Starting row index"
          value={step.parameters.start || ""}
          onChange={(e) => onUpdate(index, {
            ...step,
            parameters: { ...step.parameters, start: e.target.value ? parseInt(e.target.value) : undefined }
          })}
        />
        <p className="text-xs text-muted-foreground">Row to start sampling from (default: 0)</p>
      </div>
    </div>
  )
}