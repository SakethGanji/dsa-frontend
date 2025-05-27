import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"

interface ColumnMetadata {
  columns: string[]
  column_types: Record<string, string>
  total_rows: number
  null_counts: Record<string, number>
  sample_values: Record<string, any[]>
}

export function useColumnMetadata(datasetId: number, versionId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['column-metadata', datasetId, versionId],
    queryFn: async () => {
      const response = await apiClient.get<ColumnMetadata>(
        `/api/sampling/${datasetId}/${versionId}/columns`
      )
      return response.data
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  })
}

// Transform the metadata into a format suitable for our components
export function transformColumnMetadata(metadata: ColumnMetadata | undefined) {
  if (!metadata) return { columns: [], totalRows: 0 }

  const columns = metadata.columns.map(name => ({
    name,
    type: metadata.column_types[name] || 'UNKNOWN',
    nullCount: metadata.null_counts[name] || 0,
    sampleValues: metadata.sample_values[name] || []
  }))

  return {
    columns,
    totalRows: metadata.total_rows
  }
}