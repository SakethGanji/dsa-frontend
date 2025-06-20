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
import { useMultiRoundSampling } from "@/hooks/use-multi-round-sampling"
import { MultiRoundFormV3 } from "@/components/sampling/multi-round-form-v3"
import { MultiRoundResults } from "@/components/sampling/multi-round-results"
import { 
  StepWorkflowLayout,
  AnimatedStep,
  StepCard,
  DatasetSelector,
  VersionGrid
} from "@/components/shared"
import type { Dataset, DatasetVersion, MultiRoundSamplingRequest, MultiRoundSamplingResponse } from "@/lib/api/types"
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
  const [samplingResponse, setSamplingResponse] = useState<MultiRoundSamplingResponse | null>(null)
  const [lastRequest, setLastRequest] = useState<MultiRoundSamplingRequest | null>(null)
  
  // Pagination state for server-side pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(100) // Fixed page size for consistency
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  
  // Update step when global selections change (e.g., from another tab)
  useEffect(() => {
    const newStep = getInitialStep()
    setCurrentStep(newStep)
    // Clear sampling response when dataset/version changes
    setSamplingResponse(null)
  }, [selectedDataset, selectedVersion, getInitialStep])

  // Query hooks
  const { data: versions, isLoading: versionsLoading } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  
  // Use the multi-round sampling hook
  const samplingMutation = useMultiRoundSampling({
    onSuccess: (data) => {
      if (!data) {
        setSamplingResponse(null)
        setCurrentStep(4)
        toast.warning("Sampling completed but no results were returned")
      } else {
        setSamplingResponse(data)
        setCurrentStep(4)
        // Calculate total pages based on first round's pagination info
        if (data.rounds?.[0]?.pagination) {
          setTotalPages(data.rounds[0].pagination.total_pages)
        }
        const totalRows = data.rounds?.reduce((acc: number, round) => acc + (round.pagination?.total_items || round.data.length), 0) || 0
        toast.success(`Multi-round sampling completed! ${data.rounds?.length || 0} rounds processed with ${totalRows.toLocaleString()} total rows.`)
      }
    },
    onError: (error) => {
      toast.error(`Sampling failed: ${error.message}`)
    },
  })
  
  // Handle page change for server-side pagination
  const handlePageChange = async (newPage: number) => {
    if (!selectedDataset || !selectedVersion || !lastRequest) return
    
    setIsLoadingPage(true)
    setCurrentPage(newPage)
    
    try {
      const data = await fetchPage(newPage)
      if (data) {
        setSamplingResponse(data)
      }
    } catch {
      toast.error("Failed to load page")
    } finally {
      setIsLoadingPage(false)
    }
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
    setSamplingResponse(null)
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleVersionSelect = (version: DatasetVersion) => {
    setSelectedVersion(version)
    setSamplingResponse(null)
    setTimeout(() => setCurrentStep(3), 300)
  }

  const handleMultiRoundSubmit = (request: MultiRoundSamplingRequest) => {
    if (!selectedDataset || !selectedVersion) return
    
    setLastRequest(request)
    setCurrentPage(1) // Reset to first page
    samplingMutation.mutate({
      datasetId: selectedDataset.id,
      versionId: selectedVersion.id,
      request: request,
      page: 1,
      pageSize: pageSize
    })
  }

  // Function to fetch a specific page of data
  const fetchPage = async (page: number) => {
    if (!selectedDataset || !selectedVersion || !lastRequest) return null
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/sampling/${selectedDataset.id}/${selectedVersion.id}/multi-round/execute?page=${page}&page_size=${pageSize}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          },
          body: JSON.stringify(lastRequest)
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        // Update total pages if pagination info is available
        if (data.rounds?.[0]?.pagination) {
          setTotalPages(data.rounds[0].pagination.total_pages)
        }
        return data
      }
    } catch {
      console.error(`Failed to fetch page ${page}`)
    }
    return null
  }


  // Download and copy handlers - removed as MultiRoundResults handles internally
  // const handleDownloadResults = ...
  // const handleCopyToClipboard = ...

  const resetFlow = () => {
    setCurrentStep(1)
    setSelectedDataset(null)
    setSelectedVersion(null)
    setSamplingResponse(null)
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
        isLoading: samplingMutation.isPending,
        title: "Sampling Data",
        description: "Executing multi-round sampling..."
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
                        datasetId={selectedDataset.id}
                        versionId={selectedVersion.id}
                        datasetColumns={datasetInfo?.columns || []}
                        onSubmit={handleMultiRoundSubmit}
                        isLoading={samplingMutation.isPending}
                      />
                  </StepCard>
                </AnimatedStep>

      {/* Step 4: View Results */}
      <AnimatedStep show={shouldShowStep(4) && !!samplingResponse} delay={0.3}>
        <StepCard
          isActive={true}
          isCompleted={false}
          icon={Table}
          title="Multi-Round Sampling Results"
          description={samplingResponse ? `${samplingResponse.rounds.length} rounds completed` : ""}
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
                      <MultiRoundResults
                        results={samplingResponse}
                        isLoading={samplingMutation.isPending || isLoadingPage}
                        onPageChange={handlePageChange}
                        currentPage={currentPage}
                        totalPages={totalPages}
                      />
                    </div>
                  </StepCard>
                </AnimatedStep>

            {/* Debug: Show message when on step 4 but no results */}
            {currentStep === 4 && !samplingResponse && (
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