import { useState, useCallback, useRef, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/index"
import type { 
  MultiRoundSamplingRequest, 
  JobStatusResponse, 
  MergedSampleResponse,
  JobStatus 
} from "@/lib/api/types"

interface UseMultiRoundJobOptions {
  onJobComplete?: (jobId: string, jobData: JobStatusResponse) => void
  onJobFailed?: (error: string) => void
  onJobProgress?: (completedRounds: number, totalRounds: number) => void
  pollingInterval?: number // milliseconds, default 2000
}

interface UseMultiRoundJobReturn {
  // Job control
  startJob: (datasetId: number, versionId: number, request: MultiRoundSamplingRequest) => Promise<void>
  cancelPolling: () => void
  
  // Job state
  jobId: string | null
  jobStatus: JobStatus | null
  jobData: JobStatusResponse | null
  isPolling: boolean
  
  // Progress
  completedRounds: number
  totalRounds: number
  currentRound: number | null
  executionTime: number | null
  
  // Error state
  error: string | null
  
  // Loading states
  isStartingJob: boolean
  isCheckingStatus: boolean
}

export function useMultiRoundJob(options?: UseMultiRoundJobOptions): UseMultiRoundJobReturn {
  const {
    onJobComplete,
    onJobFailed,
    onJobProgress,
    pollingInterval = 2000
  } = options || {}

  // State
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [jobData, setJobData] = useState<JobStatusResponse | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasCompletedRef = useRef(false)

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async ({ 
      datasetId, 
      versionId, 
      request 
    }: { 
      datasetId: number; 
      versionId: number; 
      request: MultiRoundSamplingRequest 
    }) => {
      return api.sampling.startMultiRoundJob(datasetId, versionId, request)
    },
    onSuccess: async (data) => {
      console.log('Start job response:', data)
      const jobIdStr = data.run_id.toString()
      console.log('Extracted jobIdStr:', jobIdStr, 'from run_id:', data.run_id)
      setJobId(jobIdStr)
      setJobStatus(data.status)
      setError(null)
      
      // Check if job is already completed (synchronous execution)
      if (data.status === 'completed') {
        // If the response includes full job data, use it directly
        if (data.round_results && data.round_results.length > 0) {
          // Transform StartJobResponse to JobStatusResponse format
          const jobDetails: JobStatusResponse = {
            id: jobIdStr,
            dataset_id: 0, // These will be filled from the actual job status
            version_id: 0,
            user_id: 0,
            status: data.status,
            created_at: data.created_at || new Date().toISOString(),
            total_rounds: data.total_rounds || data.round_results.length,
            completed_rounds: data.completed_rounds || data.round_results.length,
            current_round: null,
            round_results: data.round_results,
            request: { rounds: [] } as any, // Will be filled from actual job status
            execution_time_ms: data.completed_at && data.started_at ? 
              new Date(data.completed_at).getTime() - new Date(data.started_at).getTime() : 
              1000, // Default to 1 second if not available
            error_message: data.error_message || null,
            residual_uri: data.residual_uri || null,
            residual_size: data.residual_size || null,
            residual_summary: data.residual_summary || null,
          }
          console.log('Created jobDetails with id:', jobDetails.id, 'from jobIdStr:', jobIdStr)
          setJobData(jobDetails)
          setIsPolling(false)
          
          // Still fetch the full job details to get complete information
          try {
            const fullJobDetails = await api.sampling.getJobStatus(jobIdStr)
            setJobData(fullJobDetails)
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true
              console.log('Calling onJobComplete with fullJobDetails:', fullJobDetails)
              onJobComplete?.(jobIdStr, fullJobDetails)
            }
          } catch (err) {
            // If we can't get full details, use what we have but make sure to use raw data
            // The backend seems to be returning the data directly without proper JobStatusResponse format
            console.warn('Failed to fetch full job details, using initial response data')
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true
              // Ensure the data has an id field and proper structure
              const jobDataWithId: JobStatusResponse = {
                ...jobDetails,
                ...data,
                id: jobIdStr,
                execution_time_ms: jobDetails.execution_time_ms || 1000
              } as any
              onJobComplete?.(jobIdStr, jobDataWithId)
            }
          }
        } else {
          // Fetch the full job details
          try {
            const jobDetails = await api.sampling.getJobStatus(jobIdStr)
            setJobData(jobDetails)
            setIsPolling(false)
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true
              onJobComplete?.(jobIdStr, jobDetails)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job details'
            setError(errorMessage)
          }
        }
      } else {
        // Start polling for incomplete jobs
        setIsPolling(true)
      }
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start job'
      setError(errorMessage)
      onJobFailed?.(errorMessage)
    }
  })

  // Polling query
  const { data: polledJobData, refetch: checkJobStatus } = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('No job ID')
      return api.sampling.getJobStatus(jobId)
    },
    enabled: false, // Manual control
  })
  
  // Handle polled job data
  useEffect(() => {
    if (polledJobData) {
      setJobData(prevJobData => {
        // Update progress if rounds have changed
        if (prevJobData?.completed_rounds !== polledJobData.completed_rounds) {
          onJobProgress?.(polledJobData.completed_rounds, polledJobData.total_rounds)
        }
        return polledJobData
      })
      setJobStatus(polledJobData.status)
      
      // Check if job is complete
      if (polledJobData.status === 'completed' && !hasCompletedRef.current) {
        hasCompletedRef.current = true
        setIsPolling(false)
        onJobComplete?.(jobId!, polledJobData)
      } else if (polledJobData.status === 'failed' && !hasCompletedRef.current) {
        hasCompletedRef.current = true
        setIsPolling(false)
        setError(polledJobData.error_message || 'Job failed')
        onJobFailed?.(polledJobData.error_message || 'Job failed')
      }
    }
  }, [polledJobData, jobId, onJobComplete, onJobFailed, onJobProgress])

  // Set up polling
  useEffect(() => {
    if (isPolling && jobId && jobStatus !== 'completed' && jobStatus !== 'failed') {
      // Set up interval
      const intervalId = setInterval(() => {
        checkJobStatus()
      }, pollingInterval)
      
      pollingIntervalRef.current = intervalId
      
      // Initial check after a short delay to avoid immediate re-render
      setTimeout(() => {
        checkJobStatus()
      }, 100)
      
      return () => {
        clearInterval(intervalId)
      }
    } else {
      // Clean up interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [isPolling, jobId, jobStatus, pollingInterval, checkJobStatus])

  // Start job function
  const startJob = useCallback(async (
    datasetId: number, 
    versionId: number, 
    request: MultiRoundSamplingRequest
  ) => {
    // Reset state
    setJobId(null)
    setJobStatus(null)
    setJobData(null)
    setError(null)
    hasCompletedRef.current = false
    
    // Start the job
    await startJobMutation.mutateAsync({ datasetId, versionId, request })
  }, [startJobMutation])

  // Cancel polling
  const cancelPolling = useCallback(() => {
    setIsPolling(false)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  return {
    // Job control
    startJob,
    cancelPolling,
    
    // Job state
    jobId,
    jobStatus,
    jobData,
    isPolling,
    
    // Progress
    completedRounds: jobData?.completed_rounds || 0,
    totalRounds: jobData?.total_rounds || 0,
    currentRound: jobData?.current_round || null,
    executionTime: jobData?.execution_time_ms || null,
    
    // Error state
    error,
    
    // Loading states
    isStartingJob: startJobMutation.isPending,
    isCheckingStatus: isPolling && jobStatus === 'running'
  }
}

// Hook to fetch merged sample data
export function useMergedSampleData(
  jobId: string | null,
  page: number = 1,
  pageSize: number = 100,
  enabled: boolean = true
) {
  console.log('useMergedSampleData called with:', { jobId, page, pageSize, enabled })
  
  const query = useQuery({
    queryKey: ['mergedSample', jobId, page, pageSize],
    queryFn: async () => {
      console.log('queryFn executing for job:', jobId)
      if (!jobId) throw new Error('No job ID')
      
      try {
        console.log('Calling getMergedSample API...')
        const response = await api.sampling.getMergedSample(jobId, {
          page,
          page_size: pageSize
        })
        
        console.log('API response:', response)
        
        // Type guard to ensure we have the paginated response
        if ('data' in response && 'pagination' in response) {
          return response as MergedSampleResponse
        }
        
        throw new Error('Invalid response format')
      } catch (error) {
        console.error('Error in queryFn:', error)
        throw error
      }
    },
    enabled: enabled && !!jobId,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  })
  
  console.log('useQuery result:', { data: query.data, isLoading: query.isLoading, error: query.error })
  
  return query
}