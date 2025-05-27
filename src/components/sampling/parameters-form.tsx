import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Plus, X, Filter, Columns } from "lucide-react"
import type { 
  SamplingMethod, 
  SamplingRequest, 
  SamplingFilters,
  SamplingCondition,
  SamplingSelection
} from "@/lib/api/types"

interface ParametersFormProps {
  method: SamplingMethod
  datasetColumns?: string[]
  onSubmit: (request: SamplingRequest) => void
  isLoading?: boolean
}

const operators = [
  { value: "=", label: "Equals" },
  { value: "!=", label: "Not Equals" },
  { value: ">", label: "Greater Than" },
  { value: "<", label: "Less Than" },
  { value: ">=", label: "Greater or Equal" },
  { value: "<=", label: "Less or Equal" },
  { value: "LIKE", label: "Like" },
  { value: "ILIKE", label: "Case-Insensitive Like" },
  { value: "IN", label: "In List" },
  { value: "NOT IN", label: "Not In List" },
  { value: "IS NULL", label: "Is Null" },
  { value: "IS NOT NULL", label: "Is Not Null" },
]

export function ParametersForm({ 
  method, 
  datasetColumns = [],
  onSubmit,
  isLoading = false
}: ParametersFormProps) {
  const [outputName, setOutputName] = useState("")
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState<SamplingCondition[]>([])
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<string>("")
  const [orderDesc, setOrderDesc] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    // Reset parameters when method changes
    setParameters({})
    setOutputName(`${method}_sample_${Date.now()}`)
  }, [method])

  const handleAddFilter = () => {
    setFilters([...filters, { column: "", operator: "=", value: "" }])
  }

  const handleUpdateFilter = (index: number, field: keyof SamplingCondition, value: any) => {
    const updatedFilters = [...filters]
    updatedFilters[index] = { ...updatedFilters[index], [field]: value }
    setFilters(updatedFilters)
  }

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const request: SamplingRequest = {
      method,
      parameters,
      output_name: outputName,
    }

    // Add filters if any
    if (filters.length > 0) {
      const validFilters = filters.filter(f => f.column && f.operator && f.value !== "")
      if (validFilters.length > 0) {
        request.filters = {
          conditions: validFilters,
          logic: filterLogic,
        }
      }
    }

    // Add selection if any
    const selection: SamplingSelection = {}
    if (selectedColumns.length > 0) {
      selection.columns = selectedColumns
    }
    if (orderBy) {
      selection.order_by = orderBy
      selection.order_desc = orderDesc
    }
    if (Object.keys(selection).length > 0) {
      request.selection = selection
    }

    onSubmit(request)
  }

  const renderParameterInputs = () => {
    switch (method) {
      case "random":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sample_size">Sample Size *</Label>
              <Input
                id="sample_size"
                type="number"
                placeholder="Enter sample size"
                value={parameters.sample_size || ""}
                onChange={(e) => setParameters({ ...parameters, sample_size: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Number of rows to randomly select</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seed">Random Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                placeholder="Enter seed for reproducibility"
                value={parameters.seed || ""}
                onChange={(e) => setParameters({ ...parameters, seed: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">Set a seed for reproducible results</p>
            </div>
          </>
        )

      case "stratified":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="strata_columns">Strata Columns *</Label>
              <Select
                value={parameters.strata_columns?.join(",") || ""}
                onValueChange={(value) => setParameters({ ...parameters, strata_columns: value.split(",").filter(Boolean) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select columns for stratification" />
                </SelectTrigger>
                <SelectContent>
                  {datasetColumns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Columns to group data by</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample_size">Sample Size (Optional)</Label>
              <Input
                id="sample_size"
                type="number"
                placeholder="Total sample size"
                value={parameters.sample_size || ""}
                onChange={(e) => setParameters({ ...parameters, sample_size: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_per_stratum">Min Per Stratum (Optional)</Label>
              <Input
                id="min_per_stratum"
                type="number"
                placeholder="Minimum samples per stratum"
                value={parameters.min_per_stratum || ""}
                onChange={(e) => setParameters({ ...parameters, min_per_stratum: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
          </>
        )

      case "systematic":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="interval">Interval *</Label>
              <Input
                id="interval"
                type="number"
                placeholder="Select every nth row"
                value={parameters.interval || ""}
                onChange={(e) => setParameters({ ...parameters, interval: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Select every nth row from the dataset</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Starting Point (Optional)</Label>
              <Input
                id="start"
                type="number"
                placeholder="Starting row index"
                value={parameters.start || ""}
                onChange={(e) => setParameters({ ...parameters, start: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">Row to start sampling from (default: 0)</p>
            </div>
          </>
        )

      case "cluster":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="cluster_column">Cluster Column *</Label>
              <Select
                value={parameters.cluster_column || ""}
                onValueChange={(value) => setParameters({ ...parameters, cluster_column: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cluster column" />
                </SelectTrigger>
                <SelectContent>
                  {datasetColumns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Column that defines clusters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_clusters">Number of Clusters *</Label>
              <Input
                id="num_clusters"
                type="number"
                placeholder="Number of clusters to select"
                value={parameters.num_clusters || ""}
                onChange={(e) => setParameters({ ...parameters, num_clusters: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample_within_clusters">Samples Within Clusters (Optional)</Label>
              <Input
                id="sample_within_clusters"
                type="number"
                placeholder="Samples per cluster"
                value={parameters.sample_within_clusters || ""}
                onChange={(e) => setParameters({ ...parameters, sample_within_clusters: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
          </>
        )

      case "custom":
        return (
          <div className="space-y-2">
            <Label htmlFor="query">SQL Query *</Label>
            <Textarea
              id="query"
              placeholder="Enter your custom SQL query"
              className="min-h-[120px] font-mono text-sm"
              value={parameters.query || ""}
              onChange={(e) => setParameters({ ...parameters, query: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Write a custom SQL query for complex sampling logic</p>
          </div>
        )

      default:
        return null
    }
  }

  const isFormValid = () => {
    if (!outputName) return false

    switch (method) {
      case "random":
        return parameters.sample_size > 0
      case "stratified":
        return parameters.strata_columns?.length > 0
      case "systematic":
        return parameters.interval > 0
      case "cluster":
        return parameters.cluster_column && parameters.num_clusters > 0
      case "custom":
        return parameters.query?.trim().length > 0
      default:
        return false
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sampling Parameters</CardTitle>
          <CardDescription>Configure parameters for {method} sampling</CardDescription>
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

          <Separator />

          {renderParameterInputs()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Advanced Options</CardTitle>
              <CardDescription>Apply filters and column selection</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            {/* Filters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddFilter}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Filter
                </Button>
              </div>
              
              {filters.map((filter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <Select
                    value={filter.column}
                    onValueChange={(value) => handleUpdateFilter(index, "column", value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => handleUpdateFilter(index, "operator", value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!["IS NULL", "IS NOT NULL"].includes(filter.operator) && (
                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => handleUpdateFilter(index, "value", e.target.value)}
                      className="flex-1"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFilter(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}

              {filters.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label>Logic:</Label>
                  <Select value={filterLogic} onValueChange={(value: "AND" | "OR") => setFilterLogic(value)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Column Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Columns className="w-4 h-4" />
                Column Selection
              </Label>
              <div className="flex flex-wrap gap-2">
                {datasetColumns.map((col) => (
                  <Badge
                    key={col}
                    variant={selectedColumns.includes(col) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedColumns.includes(col)) {
                        setSelectedColumns(selectedColumns.filter(c => c !== col))
                      } else {
                        setSelectedColumns([...selectedColumns, col])
                      }
                    }}
                  >
                    {col}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedColumns.length === 0 ? "All columns selected" : `${selectedColumns.length} columns selected`}
              </p>
            </div>

            <Separator />

            {/* Ordering */}
            <div className="space-y-3">
              <Label>Data Ordering</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={orderBy}
                  onValueChange={setOrderBy}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Order by column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No ordering</SelectItem>
                    {datasetColumns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {orderBy && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrderDesc(!orderDesc)}
                  >
                    {orderDesc ? "DESC" : "ASC"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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
              Execute Sampling
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}