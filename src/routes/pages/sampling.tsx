"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  GitBranch,
  ChevronRight,
  Check,
  Plus,
  Eye,
  FlaskConical,
  Table,
} from "lucide-react"
import { DatasetSearchBar } from "@/components/dataset-search"
import { useDatasetVersions } from "@/hooks"
import { useMultiRoundSampling } from "@/hooks/use-multi-round-sampling"
import { MultiRoundFormV3 } from "@/components/sampling/multi-round-form-v3"
import { MultiRoundResults } from "@/components/sampling/multi-round-results"
import type { Dataset, DatasetVersion, MultiRoundSamplingRequest, MultiRoundSamplingResponse } from "@/lib/api/types"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import React from "react"

const stepInfo = {
  1: { title: "Select Dataset", subtitle: "Choose data source" },
  2: { title: "Select Version", subtitle: "Pick dataset version" },
  3: { title: "Configure Rounds", subtitle: "Set up multi-round sampling" },
  4: { title: "View Results", subtitle: "Review samples" },
}

export function SamplingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null)
  const [samplingResponse, setSamplingResponse] = useState<MultiRoundSamplingResponse | null>(null)
  const [compactView, setCompactView] = useState(false)
  const [lastRequest, setLastRequest] = useState<MultiRoundSamplingRequest | null>(null)
  
  // Pagination state for server-side pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(100) // Fixed page size for consistency
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingPage, setIsLoadingPage] = useState(false)

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
    setSelectedVersion(null)
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

  const formatByteSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown"
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-0 lg:-mt-0">
      <div className="w-full h-full flex flex-col">
        {/* Compact Header Bar */}
        <div className="bg-gradient-to-r from-background to-accent/10 border-b px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {Object.entries(stepInfo).map(([step, info]) => {
                  const stepNum = parseInt(step)
                  const isActive = stepNum === currentStep
                  const isCompleted = stepNum < currentStep
                  return (
                    <React.Fragment key={step}>
                      <motion.button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? "bg-primary/20 text-primary shadow-sm"
                            : isCompleted
                            ? "bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                        onClick={() => isCompleted && setCurrentStep(stepNum)}
                        whileHover={isCompleted ? { scale: 1.05 } : {}}
                        whileTap={isCompleted ? { scale: 0.95 } : {}}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-primary/80 text-primary-foreground"
                            : "bg-muted-foreground/30 text-muted-foreground"
                        }`}>
                          {isCompleted ? "✓" : step}
                        </span>
                        <span className="hidden sm:inline">{info.title}</span>
                      </motion.button>
                      {stepNum < 4 && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompactView(!compactView)}
                className="text-xs"
              >
                {compactView ? <Eye className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {compactView ? "Expand" : "Compact"}
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={resetFlow} size="sm" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  New Sample
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/50">
          <div className={`${compactView ? 'p-3' : 'p-4 lg:p-6'} ${compactView ? 'space-y-3' : 'space-y-4'} max-w-7xl mx-auto`}>
            {/* Step 1: Select Dataset */}
            <AnimatePresence>
              {shouldShowStep(1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  layout
                >
                  <Card
                    className={`transition-all duration-500 backdrop-blur-sm ${
                      currentStep === 1
                        ? "ring-2 ring-primary/50 shadow-xl bg-card/95"
                        : currentStep > 1
                          ? "bg-muted/50 border-muted-foreground/20"
                          : ""
                    } ${compactView ? 'p-0' : ''}`}
                  >
                    {!compactView && (
                      <CardHeader className="pb-3 bg-gradient-to-r from-accent/20 to-transparent rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              currentStep > 1 ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {currentStep > 1 ? <Check className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-xl">Select Dataset</CardTitle>
                            <CardDescription className="text-sm">
                              Choose from your available data sources
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    )}

                    <CardContent className={compactView ? "p-3" : "pt-4"}>
                      {selectedDataset && currentStep > 1 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                                <Database className="w-5 h-5 text-accent-foreground" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">{selectedDataset.name}</h4>
                                <p className="text-xs text-muted-foreground">Dataset ID: {selectedDataset.id}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          </div>
                        </motion.div>
                      ) : (
                        <DatasetSearchBar onSelectDataset={handleDatasetSelect} />
                      )}
                    </CardContent>
                  </Card>
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
                  <Card
                    className={`transition-all duration-500 ${
                      currentStep === 2
                        ? "ring-2 ring-primary/30 shadow-lg"
                        : currentStep > 2
                          ? "bg-muted/50 border-muted-foreground/20"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 2
                              ? "bg-accent text-accent-foreground"
                              : currentStep === 2
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 2 ? <Check className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Dataset Versions</CardTitle>
                          <CardDescription className="text-sm">
                            Choose a version of {selectedDataset?.name || "your dataset"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {versionsLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                          {versions?.map((version, index) => {
                            const isSelected = selectedVersion?.id === version.id
                            const isCompleted = currentStep > 2

                            return (
                              <motion.div
                                key={version.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={!isCompleted ? { scale: 1.02 } : {}}
                                whileTap={!isCompleted ? { scale: 0.98 } : {}}
                              >
                                <Card
                                  className={`h-full transition-all duration-300 relative overflow-hidden group ${
                                    isSelected && isCompleted
                                      ? "border-primary/50 bg-gradient-to-br from-accent/20 to-accent/10 shadow-lg"
                                      : isSelected
                                        ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
                                        : isCompleted
                                          ? "opacity-60 cursor-default bg-muted/50"
                                          : "cursor-pointer hover:shadow-xl hover:border-primary/50 hover:bg-gradient-to-br hover:from-accent/10 hover:to-accent/5 bg-card border-border"
                                  }`}
                                  onClick={!isCompleted ? () => handleVersionSelect(version) : undefined}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                                  <CardContent className="p-3 relative">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <Badge className="text-[10px] px-2 py-0.5 font-semibold" variant="default">v{version.version_number}</Badge>
                                          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                            {version.file_type?.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                          {format(new Date(version.ingestion_timestamp), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      {isSelected && isCompleted && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                          className="bg-primary rounded-full p-1 shadow-md"
                                        >
                                          <Check className="w-3 h-3 text-white" />
                                        </motion.div>
                                      )}
                                      {!isCompleted && (
                                        <motion.div
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                          className="bg-primary/80 rounded-full p-1 shadow-sm"
                                        >
                                          <ChevronRight className="w-3 h-3 text-white" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border">
                                      <p className="text-[11px] font-medium text-foreground">
                                        {formatByteSize(version.file_size)}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                    className={`transition-all duration-500 ${
                      currentStep === 3
                        ? "ring-2 ring-primary/30 shadow-lg"
                        : currentStep > 3
                          ? "bg-muted/50 border-muted-foreground/20"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 3
                              ? "bg-accent text-accent-foreground"
                              : currentStep === 3
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 3 ? <Check className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Sampling Configuration</CardTitle>
                          <CardDescription className="text-sm">
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
                  <Card className="ring-2 ring-primary/50 shadow-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent">
                    <CardHeader className="pb-4 bg-gradient-to-r from-accent/20 to-accent/10 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg">
                            <Table className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-foreground">
                              Multi-Round Sampling Results
                            </CardTitle>
                            <CardDescription className="text-sm">
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
                            <Badge className="text-xs px-3 py-1" variant="default">
                              <Check className="w-3 h-3 mr-1" />
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
              <Card className="border-2 border-dashed border-border">
                <CardContent className="p-12 text-center">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Waiting for Results...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The multi-round sampling operation is processing. Results will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {samplingMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Card className="w-80">
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"
                  />
                  <h3 className="font-semibold mb-2 text-sm">Sampling Data</h3>
                  <p className="text-xs text-muted-foreground">
                    Executing multi-round sampling...
                  </p>
                  <motion.div
                    className="w-full bg-muted rounded-full h-1.5 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}