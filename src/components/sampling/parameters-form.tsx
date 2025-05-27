import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Play } from "lucide-react"
import type { 
  SamplingMethod, 
  SamplingRequest,
} from "@/lib/api/types"

interface ParametersFormProps {
  method: SamplingMethod
  datasetColumns?: string[]
  onSubmit: (request: SamplingRequest) => void
  isLoading?: boolean
}

export function ParametersForm({ 
  method, 
  datasetColumns = [],
  onSubmit,
  isLoading = false
}: ParametersFormProps) {
  const [outputName, setOutputName] = useState("")
  const [parameters, setParameters] = useState<Record<string, any>>({})

  useEffect(() => {
    // Reset parameters when method changes
    setParameters({})
    setOutputName(`${method}_sample_${Date.now()}`)
  }, [method])

  const handleSubmit = () => {
    const request: SamplingRequest = {
      method,
      parameters,
      output_name: outputName,
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