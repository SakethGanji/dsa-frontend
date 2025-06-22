"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  FlaskConical,
  Table,
} from "lucide-react"
import { useDatasetVersions } from "@/hooks"
import { useMultiRoundJob, useMergedSampleData } from "@/hooks/use-multi-round-job"
import { MultiRoundFormV3 } from "@/components/sampling/multi-round-form-v3"
import { MultiRoundResults } from "@/components/sampling/multi-round-results"
import { JobProgress } from "@/components/sampling/job-progress"
import { 
  StepWorkflowLayout,
  AnimatedStep,
  StepCard,
  DatasetSelector,
  VersionGrid
} from "@/components/shared"
import type { Dataset, DatasetVersion, MultiRoundSamplingRequest, JobStatusResponse } from "@/lib/api/types"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useDatasetContext } from "@/contexts/DatasetContext"

const stepInfo = {
  1: { title: "Select Dataset", subtitle: "Choose data source" },
  2: { title: "Select Version", subtitle: "Pick dataset version" },
  3: { title: "Configure Rounds", subtitle: "Set up multi-round sampling" },
  4: { title: "View Results", subtitle: "Review samples" },
}

export function SamplingPage() {
  // Use global dataset context
  const { selectedDataset, setSelectedDataset, selectedVersion, setSelectedVersion } = useDatasetContext()
  
  // Calculate initial step based on existing selections
  const getInitialStep = useCallback(() => {
    if (selectedVersion) return 3 // Both dataset and version selected
    if (selectedDataset) return 2 // Only dataset selected
    return 1 // Nothing selected
  }, [selectedDataset, selectedVersion])
  
  const [currentStep, setCurrentStep] = useState(getInitialStep())
  const [completedJobData, setCompletedJobData] = useState<JobStatusResponse | null>(null)
  
  // Pagination state for server-side pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(100) // Fixed page size for consistency
  
  // Update step when global selections change (e.g., from another tab)
  useEffect(() => {
    const newStep = getInitialStep()
    setCurrentStep(newStep)
    // Clear job data when dataset/version changes
    setCompletedJobData(null)
  }, [selectedDataset, selectedVersion, getInitialStep])

  // Query hooks
  const { data: versions, isLoading: versionsLoading } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  
  // Use the async multi-round job hook
  const {
    startJob,
    cancelPolling,
    jobId,
    jobStatus,
    jobData,
    isPolling,
    completedRounds,
    totalRounds,
    currentRound,
    executionTime,
    error: jobError,
    isStartingJob,
    isCheckingStatus
  } = useMultiRoundJob({
    onJobComplete: (jobId, data) => {
      console.log('Job completed with job ID:', jobId)
      console.log('Job completed with data:', data)
      console.log('Data has id field?:', 'id' in data)
      console.log('Data id value:', data.id)
      setCompletedJobData(data)
      setCurrentStep(4)
      const totalSamples = data.round_results.reduce((sum, round) => sum + round.sample_size, 0)
      toast.success(`Multi-round sampling completed! ${data.completed_rounds} rounds processed with ${totalSamples.toLocaleString()} total samples.`)
    },
    onJobFailed: (error) => {
      toast.error(`Sampling job failed: ${error}`)
    },
    onJobProgress: () => {
      // Progress updates are handled by the UI reactively
    },
    pollingInterval: 2000 // Check every 2 seconds
  })
  
  // Extract job ID from completed job data
  const extractedJobId = completedJobData ? 
    (completedJobData.id || (completedJobData as any).run_id ? String((completedJobData as any).run_id) : null) : 
    null;
  
  // Fetch merged sample data when job is complete
  console.log('Completed job data state:', completedJobData)
  console.log('Job ID for merged data:', extractedJobId)
  console.log('Job status:', completedJobData?.status)
  
  const { data: mergedSampleData, isLoading: isLoadingMergedData, error: mergedDataError } = useMergedSampleData(
    extractedJobId,
    currentPage,
    pageSize,
    !!completedJobData && completedJobData.status === 'completed'
  )
  
  console.log('Merged sample data result:', { mergedSampleData, isLoadingMergedData, error: mergedDataError })
  
  
  // Handle page change for server-side pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // The useMergedSampleData hook will automatically refetch with the new page
  }

  // Fetch dataset columns for the form
  const { data: datasetInfo } = useQuery({
    queryKey: ['sampling-columns', selectedDataset?.id, selectedVersion?.id],
    queryFn: async () => {
      if (!selectedDataset || !selectedVersion) return null
      const response = await fetch(
        `http://127.0.0.1:8000/api/sampling/${selectedDataset.id}/${selectedVersion.id}/columns`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )
      if (!response.ok) throw new Error('Failed to fetch columns')
      return response.json()
    },
    enabled: !!selectedDataset && !!selectedVersion && currentStep >= 3,
  })

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset)
    // Version is automatically cleared by context when dataset changes
    setCompletedJobData(null)
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleVersionSelect = (version: DatasetVersion) => {
    setSelectedVersion(version)
    setCompletedJobData(null)
    setTimeout(() => setCurrentStep(3), 300)
  }

  const handleMultiRoundSubmit = async (request: MultiRoundSamplingRequest) => {
    if (!selectedDataset || !selectedVersion) return
    
    setCurrentPage(1) // Reset to first page
    
    try {
      await startJob(selectedDataset.id, selectedVersion.id, request)
    } catch {
      toast.error('Failed to start sampling job')
    }
  }

  // Calculate job progress percentage
  const progressPercentage = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0


  // Download and copy handlers - removed as MultiRoundResults handles internally
  // const handleDownloadResults = ...
  // const handleCopyToClipboard = ...

  const resetFlow = () => {
    setCurrentStep(1)
    setSelectedDataset(null)
    setSelectedVersion(null)
    setCompletedJobData(null)
    cancelPolling() // Stop any ongoing polling
  }

  const shouldShowStep = (stepId: number) => {
    return stepId <= currentStep
  }


  return (
    <StepWorkflowLayout
      stepInfo={stepInfo}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onReset={resetFlow}
      resetLabel="New Sample"
      loadingOverlay={{
        isLoading: isStartingJob || (isPolling && jobStatus === 'running'),
        title: jobStatus === 'running' ? "Processing Sampling Job" : "Starting Sampling Job",
        description: jobStatus === 'running' 
          ? `Round ${currentRound || 0} of ${totalRounds} (${progressPercentage}% complete)`
          : "Initializing multi-round sampling..."
      }}
    >
      {/* Step 1: Select Dataset */}
      <AnimatedStep show={shouldShowStep(1)}>
        <DatasetSelector
          selectedDataset={selectedDataset}
          onDatasetSelect={handleDatasetSelect}
          isActive={currentStep === 1}
          isCompleted={currentStep > 1}
        />
      </AnimatedStep>

      {/* Step 2: Select Version */}
      <AnimatedStep show={shouldShowStep(2)} delay={0.1}>
        <VersionGrid
          versions={versions}
          selectedVersion={selectedVersion}
          onVersionSelect={handleVersionSelect}
          isActive={currentStep === 2}
          isCompleted={currentStep > 2}
          isLoading={versionsLoading}
          datasetName={selectedDataset?.name}
        />
      </AnimatedStep>

      {/* Step 3: Configure Multi-Round Sampling */}
      <AnimatedStep show={shouldShowStep(3) && !!selectedDataset && !!selectedVersion} delay={0.2}>
        <StepCard
          isActive={currentStep === 3}
          isCompleted={currentStep > 3}
          icon={FlaskConical}
          title="Sampling Configuration"
          description="Define your sampling strategy with multiple rounds"
        >
                      <MultiRoundFormV3
                        datasetId={selectedDataset?.id || 0}
                        versionId={selectedVersion?.id || 0}
                        datasetColumns={datasetInfo?.columns || []}
                        onSubmit={handleMultiRoundSubmit}
                        isLoading={isStartingJob}
                      />
                  </StepCard>
                </AnimatedStep>

      {/* Step 4: View Results */}
      <AnimatedStep show={shouldShowStep(4) && !!completedJobData} delay={0.3}>
        <StepCard
          isActive={true}
          isCompleted={false}
          icon={Table}
          title="Multi-Round Sampling Results"
          description={completedJobData ? `${completedJobData.completed_rounds} rounds completed` : ""}
          headerContent={
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge className="text-sm px-3 py-1.5 font-medium" variant="default">
                  <Check className="w-4 h-4 mr-1.5" />
                  Sampling Complete
                </Badge>
              </motion.div>
            </div>
          }
        >
          <div className="pt-0 p-4 -m-6 mt-0">
                      {mergedDataError && (
                        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                          <p className="font-medium">Error loading sample data:</p>
                          <p className="text-sm">{mergedDataError.message}</p>
                        </div>
                      )}
                      <MultiRoundResults
                        jobData={completedJobData}
                        mergedSampleData={mergedSampleData}
                        isLoading={isLoadingMergedData}
                        onPageChange={handlePageChange}
                        currentPage={currentPage}
                        totalPages={mergedSampleData?.pagination.total_pages || 1}
                      />
                    </div>
                  </StepCard>
                </AnimatedStep>

            {/* Debug: Show message when on step 4 but no results */}
            {/* Show job progress when job is running */}
            {jobStatus && (jobStatus === 'pending' || jobStatus === 'running') && (
              <AnimatedStep show={true} delay={0.3}>
                <JobProgress
                  jobId={jobId}
                  jobStatus={jobStatus}
                  jobData={jobData}
                  completedRounds={completedRounds}
                  totalRounds={totalRounds}
                  currentRound={currentRound}
                  executionTime={executionTime}
                  error={jobError}
                  isPolling={isPolling}
                  onCancel={cancelPolling}
                />
              </AnimatedStep>
            )}
            
            {/* Show waiting message if on step 4 but no results */}
            {currentStep === 4 && !completedJobData && !jobStatus && (
              <Card className="border-2 border-dashed border-muted-foreground/20 bg-card/50">
                <CardContent className="p-16 text-center">
                  <FlaskConical className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium mb-3">
                    Waiting for Results...
                  </h3>
                  <p className="text-base text-muted-foreground max-w-md mx-auto">
                    The multi-round sampling operation is processing. Results will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
    </StepWorkflowLayout>
  )
}