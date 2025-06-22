import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, GitBranch, RefreshCw } from "lucide-react"
import { useDatasets, useDatasetVersions } from "@/hooks"
import { cn } from "@/lib/utils"
import type { Dataset, DatasetVersion } from "@/lib/api/types"

interface DatasetVersionSelectorProps {
  selectedDataset: Dataset | null
  selectedVersion: DatasetVersion | null
  onDatasetChange: (dataset: Dataset | null) => void
  onVersionChange: (version: DatasetVersion | null) => void
  className?: string
}

export function DatasetVersionSelector({
  selectedDataset,
  selectedVersion,
  onDatasetChange,
  onVersionChange,
  className
}: DatasetVersionSelectorProps) {
  const [isLoadingLatest, setIsLoadingLatest] = useState(false)
  
  // Fetch all datasets
  const { data: datasets, isLoading: datasetsLoading } = useDatasets()
  
  // Fetch versions for selected dataset
  const { data: versions, isLoading: versionsLoading, refetch: refetchVersions } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  
  // Handle dataset selection
  const handleDatasetChange = (datasetId: string) => {
    if (datasetId === "none") {
      onDatasetChange(null)
      onVersionChange(null)
      return
    }
    
    const dataset = datasets?.find(d => d.id.toString() === datasetId)
    if (dataset) {
      onDatasetChange(dataset)
      onVersionChange(null) // Clear version when dataset changes
    }
  }
  
  // Handle version selection
  const handleVersionChange = (versionId: string) => {
    if (versionId === "none" || !versions) {
      onVersionChange(null)
      return
    }
    
    if (versionId === "latest") {
      // Fetch latest version
      fetchLatestVersion()
      return
    }
    
    const version = versions.find(v => v.id.toString() === versionId)
    if (version) {
      onVersionChange(version)
    }
  }
  
  // Fetch latest version
  const fetchLatestVersion = async () => {
    if (!selectedDataset) return
    
    setIsLoadingLatest(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/datasets/${selectedDataset.id}/versions/latest`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch latest version')
      
      const latestVersion = await response.json()
      onVersionChange(latestVersion)
    } catch (error) {
      console.error('Error fetching latest version:', error)
    } finally {
      setIsLoadingLatest(false)
    }
  }
  
  // Auto-select latest version when versions load
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion && selectedDataset) {
      // Auto-select the first (latest) version
      const latestVersion = versions.reduce((latest, current) => 
        current.version_number > latest.version_number ? current : latest
      , versions[0])
      onVersionChange(latestVersion)
    }
  }, [versions, selectedVersion, selectedDataset, onVersionChange])
  
  return (
    <div className={cn("bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl p-6 border border-border/50", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Select Dataset & Version
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Choose the dataset and version you want to sample from</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Dataset Selector */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Dataset</label>
            <Select
            value={selectedDataset?.id.toString() || "none"}
            onValueChange={handleDatasetChange}
            disabled={datasetsLoading}
          >
            <SelectTrigger className="w-full h-12 bg-background/60 backdrop-blur-sm border-border/50 hover:border-border transition-colors">
              {datasetsLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <SelectValue placeholder="Select a dataset" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a dataset</SelectItem>
              {datasets?.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{dataset.name}</span>
                    {dataset.tags && dataset.tags.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {dataset.tags[0].name}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
          {/* Version Selector */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Version</label>
            <div className="flex gap-3">
            <Select
              value={selectedVersion?.id.toString() || "none"}
              onValueChange={handleVersionChange}
              disabled={!selectedDataset || versionsLoading || isLoadingLatest}
            >
              <SelectTrigger className="flex-1 h-12 bg-background/60 backdrop-blur-sm border-border/50 hover:border-border transition-colors">
                {versionsLoading || isLoadingLatest ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <SelectValue placeholder="Select a version" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a version</SelectItem>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <span>Latest Version</span>
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  </div>
                </SelectItem>
                {versions?.map((version) => (
                  <SelectItem key={version.id} value={version.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>v{version.version_number}</span>
                      {version.message && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {version.message}
                        </span>
                      )}
                      {version.id === selectedVersion?.id && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Refresh button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchVersions()}
              disabled={!selectedDataset || versionsLoading}
              className="h-12 w-12 bg-background/60 backdrop-blur-sm border-border/50 hover:border-border transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", versionsLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>
      
        {/* Selected Info */}
        {selectedDataset && selectedVersion && (
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="font-medium">{selectedDataset.name}</span>
                <span className="text-muted-foreground">•</span>
                <GitBranch className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">v{selectedVersion.version_number}</span>
              </div>
              {selectedVersion.message && (
                <p className="text-sm text-muted-foreground mt-1">{selectedVersion.message}</p>
              )}
            </div>
            {selectedVersion.created_at && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedVersion.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}