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
import { Database, RefreshCw, Search } from "lucide-react"
import { useDatasetVersions } from "@/hooks"
import { cn } from "@/lib/utils"
import { DatasetSearchModal } from "@/components/dataset-search-modal"
import type { Dataset, DatasetVersion } from "@/lib/api/types"

interface DatasetVersionSelectorProps {
  selectedDataset: Dataset | null
  selectedVersion: DatasetVersion | null
  onDatasetChange: (dataset: Dataset | null) => void
  onVersionChange: (version: DatasetVersion | null) => void
  className?: string
  hideHeader?: boolean
}

export function DatasetVersionSelector({
  selectedDataset,
  selectedVersion,
  onDatasetChange,
  onVersionChange,
  className,
  hideHeader = false
}: DatasetVersionSelectorProps) {
  const [isLoadingLatest, setIsLoadingLatest] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  
  // Fetch versions for selected dataset
  const { data: versions, isLoading: versionsLoading, refetch: refetchVersions } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  
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
    <>
      {!hideHeader ? (
        <div className={cn("flex items-center gap-3 p-4 bg-muted/30 rounded-lg", className)}>
          <Database className="w-5 h-5 text-muted-foreground shrink-0" />
          
          {/* Dataset Button */}
          <Button
            variant="ghost"
            className="h-9 px-3 font-normal justify-start"
            onClick={() => setSearchModalOpen(true)}
          >
            {selectedDataset ? (
              <span className="flex items-center gap-2">
                <span className="max-w-[200px] truncate">{selectedDataset.name}</span>
                {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDataset.tags[0].name}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                Select dataset
                <Search className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>

          {selectedDataset && (
            <>
              <span className="text-muted-foreground">/</span>
              
              {/* Version Selector */}
              <Select
                value={selectedVersion?.id.toString() || "none"}
                onValueChange={handleVersionChange}
                disabled={!selectedDataset || versionsLoading || isLoadingLatest}
              >
                <SelectTrigger className="h-9 w-auto gap-1 border-0 bg-transparent hover:bg-muted px-3 font-normal">
                  {versionsLoading || isLoadingLatest ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <SelectValue placeholder="version" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select version</SelectItem>
                  <SelectItem value="latest">Latest</SelectItem>
                  {versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id.toString()}>
                      v{version.version_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto"
                onClick={() => refetchVersions()}
                disabled={versionsLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", versionsLoading && "animate-spin")} />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className={cn("flex items-center gap-2", className)}>
          <Button
            variant="outline"
            className="h-9 font-normal"
            onClick={() => setSearchModalOpen(true)}
          >
            <Database className="w-4 h-4 mr-2" />
            {selectedDataset ? selectedDataset.name : "Select dataset"}
          </Button>
          
          {selectedDataset && (
            <Select
              value={selectedVersion?.id.toString() || "none"}
              onValueChange={handleVersionChange}
              disabled={!selectedDataset || versionsLoading || isLoadingLatest}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
                {versions?.map((version) => (
                  <SelectItem key={version.id} value={version.id.toString()}>
                    v{version.version_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Dataset Search Modal */}
      <DatasetSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onDatasetSelect={(dataset) => {
          onDatasetChange(dataset)
          // Clear version to trigger auto-selection
          onVersionChange(null)
        }}
      />
    </>
  )
}