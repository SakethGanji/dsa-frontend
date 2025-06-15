"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { StepNavigation, DatasetSelector, VersionGrid, LoadingOverlay } from "@/components/shared"
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
  const getInitialStep = () => {
    if (selectedVersion) return 3 // Both dataset and version selected
    if (selectedDataset) return 2 // Only dataset selected
    return 1 // Nothing selected
  }
  
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
  }, [selectedDataset, selectedVersion])

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
    <div className="min-h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-0 lg:-mt-0">
      <div className="w-full h-full flex flex-col bg-background">
        <StepNavigation
          steps={stepInfo}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          onReset={resetFlow}
          resetLabel="New Sample"
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background">
          <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Step 1: Select Dataset */}
            <AnimatePresence>
              {shouldShowStep(1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  layout
                >
                  <DatasetSelector
                    selectedDataset={selectedDataset}
                    onDatasetSelect={handleDatasetSelect}
                    isActive={currentStep === 1}
                    isCompleted={currentStep > 1}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2: Select Version */}
            <AnimatePresence>
              {shouldShowStep(2) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  layout
                >
                  <VersionGrid
                    versions={versions}
                    selectedVersion={selectedVersion}
                    onVersionSelect={handleVersionSelect}
                    isActive={currentStep === 2}
                    isCompleted={currentStep > 2}
                    isLoading={versionsLoading}
                    datasetName={selectedDataset?.name}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Configure Multi-Round Sampling */}
            <AnimatePresence>
              {shouldShowStep(3) && selectedDataset && selectedVersion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  layout
                >
                  <Card
                    className={`transition-all duration-300 ${
                      currentStep === 3
                        ? "border-primary/50 shadow-lg dark:shadow-primary/10 bg-card"
                        : currentStep > 3
                          ? "bg-card/50 border-border/50 opacity-75"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            currentStep > 3
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : currentStep === 3
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 3 ? <Check className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold">Sampling Configuration</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Define your sampling strategy with multiple rounds
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <MultiRoundFormV3
                        datasetId={selectedDataset.id}
                        versionId={selectedVersion.id}
                        datasetColumns={datasetInfo?.columns || []}
                        onSubmit={handleMultiRoundSubmit}
                        isLoading={samplingMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 4: View Results */}
            <AnimatePresence>
              {shouldShowStep(4) && samplingResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  layout
                >
                  <Card className="border-primary/50 shadow-lg dark:shadow-primary/10 bg-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-md shadow-primary/20">
                            <Table className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold">
                              Multi-Round Sampling Results
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {samplingResponse.rounds.length} rounds completed
                            </CardDescription>
                          </div>
                        </div>
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
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <MultiRoundResults
                        results={samplingResponse}
                        isLoading={samplingMutation.isPending || isLoadingPage}
                        onPageChange={handlePageChange}
                        currentPage={currentPage}
                        totalPages={totalPages}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

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
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={samplingMutation.isPending}
        title="Sampling Data"
        description="Executing multi-round sampling..."
      />
    </div>
  )
}