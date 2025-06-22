import { useQuery } from "@tanstack/react-query"
import type { SamplingRun } from "@/lib/api/types"

interface UseSamplingHistoryOptions {
  datasetId?: number
  versionId?: number
  userId?: number
  page?: number
  pageSize?: number
}

interface SamplingHistoryResponse {
  runs: SamplingRun[]
  total_count: number
  page: number
  page_size: number
  status: string
}

export function useSamplingHistory({
  datasetId,
  versionId,
  userId,
  page = 1,
  pageSize = 10
}: UseSamplingHistoryOptions) {
  return useQuery<SamplingHistoryResponse>({
    queryKey: ['sampling-history', { datasetId, versionId, userId, page, pageSize }],
    queryFn: async () => {
      let endpoint: string
      
      if (versionId) {
        // Get samplings for specific version
        endpoint = `/api/sampling/dataset-version/${versionId}/samplings`
      } else if (datasetId) {
        // Get samplings for all versions of a dataset
        endpoint = `/api/sampling/dataset/${datasetId}/samplings`
      } else if (userId) {
        // Get samplings by user
        endpoint = `/api/sampling/user/${userId}/samplings`
      } else {
        throw new Error('Must provide either datasetId, versionId, or userId')
      }

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${endpoint}?${params}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch sampling history: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: !!(datasetId || versionId || userId),
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

// Hook to get sampling run details
export function useSamplingRunDetails(runId: number) {
  return useQuery({
    queryKey: ['sampling-run', runId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/sampling/runs/${runId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch sampling run details: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: !!runId,
  })
}