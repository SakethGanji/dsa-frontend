"use client"

import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Database, Upload, Check, Search, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { datasetsApi } from "@/lib/api"
import { mapApiResponseToDatasetInfo } from "../../../types/dataset"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface ChooseDatasetProps {
  onNext: () => void
  selectedDataset: string | null
  setSelectedDataset: Dispatch<SetStateAction<string | null>>
}

export default function ChooseDataset({ onNext, selectedDataset, setSelectedDataset }: ChooseDatasetProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch datasets from API
  const { data: datasets, isLoading, error } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const response = await datasetsApi.getDatasets({ limit: 20 })
      return response.map(d => ({
        id: d.id.toString(),
        name: d.name,
        description: d.description,
        rows: 0, // This would need to come from API
        fileType: d.file_type,
        fileSize: d.file_size,
        updated: d.updated_at,
        tags: d.tags.map(t => t.name)
      }))
    }
  })

  // Filter datasets based on search term
  const filteredDatasets = datasets?.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "unknown time ago"
    }
  }

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + ' KB'
    const mb = kb / 1024
    if (mb < 1024) return mb.toFixed(1) + ' MB'
    const gb = mb / 1024
    return gb.toFixed(1) + ' GB'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading datasets...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load datasets</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDatasets && filteredDatasets.length > 0 ? (
            filteredDatasets.map((dataset) => (
              <motion.div
                key={dataset.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDataset(dataset.id)}
              >
                <Card className={`relative cursor-pointer border transition-colors ${
                  selectedDataset === dataset.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}>
                  <CardContent className="p-4">
                    {selectedDataset === dataset.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{dataset.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {dataset.fileType.toUpperCase()} • {formatFileSize(dataset.fileSize)} • Updated {formatDate(dataset.updated)}
                        </p>
                      </div>
                    </div>
                    {dataset.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {dataset.description}
                      </p>
                    )}
                    {dataset.tags && dataset.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {dataset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {dataset.tags.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            +{dataset.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No datasets found</p>
            </div>
          )}

          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="flex cursor-pointer flex-col items-center justify-center border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 h-full">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-medium">Upload New Dataset</h3>
              <p className="mt-1 text-xs text-muted-foreground">CSV, Excel, or JSON</p>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}