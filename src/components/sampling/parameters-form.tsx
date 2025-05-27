import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Settings, Filter, TableProperties } from "lucide-react"
import { ColumnSelector } from "./column-selector"
import { RowFilter } from "./row-filter"
import { useQuery } from "@tanstack/react-query"
import type { 
  SamplingMethod, 
  SamplingRequest,
  SamplingFilters,
  SamplingSelection
} from "@/lib/api/types"

interface ParametersFormProps {
  method: SamplingMethod
  datasetId: number
  versionId: number
  datasetColumns?: string[]
  onSubmit: (request: SamplingRequest) => void
  isLoading?: boolean
}

export function ParametersForm({ 
  method, 
  datasetId,
  versionId,
  datasetColumns = [],
  onSubmit,
  isLoading = false
}: ParametersFormProps) {
  const [outputName, setOutputName] = useState("")
  const [parameters, setParameters] = useState<any>({})
  const [filters, setFilters] = useState<SamplingFilters | undefined>()
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [orderDesc, setOrderDesc] = useState(false)
  const [activeTab, setActiveTab] = useState("parameters")

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

  useEffect(() => {
    // Reset parameters when method changes
    setParameters({})
    setOutputName(`${method}_sample_${Date.now()}`)
  }, [method])

  const handleSubmit = () => {
    // Build selection object
    const selection: SamplingSelection = {
      columns: selectedColumns.length > 0 ? selectedColumns : null,
      order_by: orderBy,
      order_desc: orderDesc
    }

    const request: SamplingRequest = {
      method,
      parameters,
      output_name: outputName,
      filters,
      selection
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
              <Label>Strata Columns *</Label>
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[38px]">
                  {parameters.strata_columns?.map((col) => (
                    <Badge key={col} variant="secondary" className="gap-1">
                      {col}
                      <button
                        type="button"
                        onClick={() => setParameters({ 
                          ...parameters, 
                          strata_columns: parameters.strata_columns?.filter(c => c !== col) 
                        })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {(!parameters.strata_columns || parameters.strata_columns.length === 0) && (
                    <span className="text-muted-foreground text-sm">Select columns for stratification</span>
                  )}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const currentColumns = parameters.strata_columns || []
                    if (!currentColumns.includes(value)) {
                      setParameters({ ...parameters, strata_columns: [...currentColumns, value] })
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetColumns
                      .filter(col => !parameters.strata_columns?.includes(col))
                      .map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Select multiple columns to group data by for stratified sampling</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample_size">Sample Size (Optional)</Label>
              <Input
                id="sample_size"
                type="number"
                step="any"
                placeholder="Total sample size or percentage (e.g., 1000 or 0.1 for 10%)"
                value={parameters.sample_size || ""}
                onChange={(e) => setParameters({ ...parameters, sample_size: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">Enter a whole number for absolute size or decimal &lt; 1 for percentage</p>
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
            <div className="space-y-2">
              <Label htmlFor="seed">Random Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                placeholder="Enter seed for reproducibility"
                value={parameters.seed || ""}
                onChange={(e) => setParameters({ ...parameters, seed: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">Set a seed for reproducible stratified sampling</p>
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
                placeholder="Samples per cluster (leave empty for all)"
                value={parameters.sample_within_clusters || ""}
                onChange={(e) => setParameters({ ...parameters, sample_within_clusters: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">Number of samples to take from each cluster, or leave empty to take all</p>
            </div>
          </>
        )

      case "custom":
        return (
          <div className="space-y-2">
            <Label htmlFor="query">Custom Filter Expression *</Label>
            <Textarea
              id="query"
              placeholder="e.g., listed_in LIKE '%Action%' AND release_year >= 2015"
              className="min-h-[120px] font-mono text-sm"
              value={parameters.query || ""}
              onChange={(e) => setParameters({ ...parameters, query: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Write a WHERE clause condition for custom filtering. The expression will be applied as a filter to the dataset.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Examples:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">rating IN ('PG', 'PG-13') AND release_year &gt; 2010</code></li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">listed_in LIKE '%Comedy%' OR listed_in LIKE '%Drama%'</code></li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">CAST(REPLACE(duration, ' min', '') AS INTEGER) &gt; 90</code></li>
              </ul>
            </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="parameters">
            <Settings className="h-4 w-4 mr-2" />
            Parameters
          </TabsTrigger>
          <TabsTrigger value="columns">
            <TableProperties className="h-4 w-4 mr-2" />
            Columns
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="output">
            Output Name
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sampling Parameters</CardTitle>
              <CardDescription>Configure parameters for {method} sampling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderParameterInputs()}
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
          />
        </TabsContent>

        <TabsContent value="filters">
          <RowFilter
            columns={columnMetadata?.columns || datasetColumns}
            columnTypes={columnMetadata?.column_types || {}}
            sampleValues={columnMetadata?.sample_values || {}}
            filters={filters}
            onFiltersChange={setFilters}
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
              Execute Sampling
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}