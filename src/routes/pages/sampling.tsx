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
import { useSampling } from "@/hooks/use-sampling-query"
import { MethodSelection } from "@/components/sampling/method-selection"
import { ParametersForm } from "@/components/sampling/parameters-form"
import { ResultsTable } from "@/components/sampling/results-table"
import type { Dataset, DatasetVersion, SamplingMethod, SamplingRequest, SamplingResult } from "@/lib/api/types"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import React from "react"

const stepInfo = {
  1: { title: "Select Dataset", subtitle: "Choose data source" },
  2: { title: "Select Version", subtitle: "Pick dataset version" },
  3: { title: "Choose Method", subtitle: "Select sampling technique" },
  4: { title: "Configure", subtitle: "Set parameters" },
  5: { title: "View Results", subtitle: "Review sample" },
}

export function SamplingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<SamplingMethod | null>(null)
  const [samplingResults, setSamplingResults] = useState<SamplingResult[]>([])
  const [lastRequest, setLastRequest] = useState<SamplingRequest | null>(null)
  const [compactView, setCompactView] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalItems, setTotalItems] = useState(0)

  // Query hooks
  const { data: versions, isLoading: versionsLoading } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  
  const samplingMutation = useSampling({
    onSuccess: (data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        setSamplingResults([])
        setCurrentStep(5)
        toast.warning("Sampling completed but no results were returned")
      } else {
        setSamplingResults(data)
        setCurrentStep(5)
        // For demonstration, assume we have more data if we get a full page
        // In a real implementation, the API should return total count
        setTotalItems(data.length === pageSize ? data.length * 10 : data.length)
        toast.success(`Sampling completed successfully! ${data.length} rows returned.`)
      }
    },
    onError: (error) => {
      toast.error(`Sampling failed: ${error.message}`)
    },
  })
  
  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (!selectedDataset || !selectedVersion || !lastRequest) return
    
    setCurrentPage(newPage)
    samplingMutation.mutate({
      datasetId: selectedDataset.id,
      versionId: selectedVersion.id,
      request: lastRequest,
      page: newPage,
      pageSize: pageSize
    })
  }
  
  // Function to handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    if (!selectedDataset || !selectedVersion || !lastRequest) return
    
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page
    samplingMutation.mutate({
      datasetId: selectedDataset.id,
      versionId: selectedVersion.id,
      request: lastRequest,
      page: 1,
      pageSize: newPageSize
    })
  }

  // Fetch dataset columns for the form
  const { data: datasetInfo } = useQuery({
    queryKey: ['dataset-columns', selectedDataset?.id, selectedVersion?.id],
    queryFn: async () => {
      if (!selectedDataset || !selectedVersion) return null
      const response = await fetch(
        `http://127.0.0.1:8000/api/datasets/${selectedDataset.id}/versions/${selectedVersion.id}/data?limit=1`,
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
    setSelectedMethod(null)
    setSamplingResults([])
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleVersionSelect = (version: DatasetVersion) => {
    setSelectedVersion(version)
    setSelectedMethod(null)
    setSamplingResults([])
    setTimeout(() => setCurrentStep(3), 300)
  }

  const handleMethodSelect = (method: SamplingMethod) => {
    setSelectedMethod(method)
    setSamplingResults([])
    setTimeout(() => setCurrentStep(4), 300)
  }

  const handleSamplingSubmit = (request: SamplingRequest) => {
    if (!selectedDataset || !selectedVersion) return
    
    // Reset pagination when starting a new sampling request
    setCurrentPage(1)
    setPageSize(50)
    setTotalItems(0)
    
    setLastRequest(request)
    samplingMutation.mutate({
      datasetId: selectedDataset.id,
      versionId: selectedVersion.id,
      request,
      page: 1,
      pageSize: 50
    })
  }


  const handleDownloadResults = () => {
    if (!samplingResults || samplingResults.length === 0) return
    
    const csv = [
      Object.keys(samplingResults[0]).join(','),
      ...samplingResults.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lastRequest?.output_name || 'sample'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Sample downloaded successfully!")
  }

  const handleCopyToClipboard = () => {
    if (!samplingResults || samplingResults.length === 0) return
    
    const text = JSON.stringify(samplingResults, null, 2)
    navigator.clipboard.writeText(text)
    toast.success("Sample copied to clipboard!")
  }

  const resetFlow = () => {
    setCurrentStep(1)
    setSelectedDataset(null)
    setSelectedVersion(null)
    setSelectedMethod(null)
    setSamplingResults([])
    setLastRequest(null)
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
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-b px-4 lg:px-6 py-3">
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
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm"
                            : isCompleted
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={() => isCompleted && setCurrentStep(stepNum)}
                        whileHover={isCompleted ? { scale: 1.05 } : {}}
                        whileTap={isCompleted ? { scale: 0.95 } : {}}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400"
                        }`}>
                          {isCompleted ? "✓" : step}
                        </span>
                        <span className="hidden sm:inline">{info.title}</span>
                      </motion.button>
                      {stepNum < 5 && (
                        <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-600" />
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
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50">
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
                        ? "ring-2 ring-blue-400 shadow-xl bg-white/95 dark:bg-slate-900/95"
                        : currentStep > 1
                          ? "bg-green-50/80 border-green-300 dark:bg-green-950/50 dark:border-green-800"
                          : ""
                    } ${compactView ? 'p-0' : ''}`}
                  >
                    {!compactView && (
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/30 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              currentStep > 1 ? "bg-green-500 text-white" : "bg-blue-500 text-white"
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
                          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">{selectedDataset.name}</h4>
                                <p className="text-xs text-green-700 dark:text-green-300">Dataset ID: {selectedDataset.id}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
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
                        ? "ring-2 ring-blue-200 shadow-lg"
                        : currentStep > 2
                          ? "bg-green-50/50 border-green-200"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 2
                              ? "bg-green-100 text-green-600"
                              : currentStep === 2
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-400"
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
                                      ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg shadow-green-100/50 dark:shadow-green-900/30"
                                      : isSelected
                                        ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/30"
                                        : isCompleted
                                          ? "opacity-60 cursor-default bg-gray-50/50 dark:bg-gray-900/50"
                                          : "cursor-pointer hover:shadow-xl hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                  }`}
                                  onClick={!isCompleted ? () => handleVersionSelect(version) : undefined}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                                  <CardContent className="p-3 relative">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <Badge className="text-[10px] px-2 py-0.5 font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">v{version.version_number}</Badge>
                                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-300 dark:border-slate-600">
                                            {version.file_type?.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                          {format(new Date(version.ingestion_timestamp), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      {isSelected && isCompleted && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                          className="bg-green-500 rounded-full p-1 shadow-md"
                                        >
                                          <Check className="w-3 h-3 text-white" />
                                        </motion.div>
                                      )}
                                      {!isCompleted && (
                                        <motion.div
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-1 shadow-sm"
                                        >
                                          <ChevronRight className="w-3 h-3 text-white" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
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

            {/* Step 3: Choose Sampling Method */}
            <AnimatePresence>
              {shouldShowStep(3) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  layout
                >
                  <Card
                    className={`transition-all duration-500 ${
                      currentStep === 3
                        ? "ring-2 ring-blue-200 shadow-lg"
                        : currentStep > 3
                          ? "bg-green-50/50 border-green-200"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 3
                              ? "bg-green-100 text-green-600"
                              : currentStep === 3
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {currentStep > 3 ? <Check className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Sampling Method</CardTitle>
                          <CardDescription className="text-sm">
                            Choose how you want to sample your data
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <MethodSelection 
                        selectedMethod={selectedMethod}
                        onSelectMethod={handleMethodSelect}
                        disabled={currentStep > 3}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 4: Configure Parameters */}
            <AnimatePresence>
              {shouldShowStep(4) && selectedMethod && selectedDataset && selectedVersion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  layout
                >
                  <Card
                    className={`transition-all duration-500 ${
                      currentStep === 4
                        ? "ring-2 ring-blue-200 shadow-lg"
                        : currentStep > 4
                          ? "bg-green-50/50 border-green-200"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 4
                              ? "bg-green-100 text-green-600"
                              : currentStep === 4
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {currentStep > 4 ? <Check className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Configure Sampling</CardTitle>
                          <CardDescription className="text-sm">
                            Set parameters for {selectedMethod} sampling
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ParametersForm
                        method={selectedMethod}
                        datasetId={selectedDataset.id}
                        versionId={selectedVersion.id}
                        datasetColumns={datasetInfo?.headers || []}
                        onSubmit={handleSamplingSubmit}
                        isLoading={samplingMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 5: View Results */}
            <AnimatePresence>
              {shouldShowStep(5) && samplingResults && samplingResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  layout
                >
                  <Card className="ring-2 ring-green-400 shadow-2xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-800">
                    <CardHeader className="pb-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                            <Table className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">
                              Sampling Results
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Your {selectedMethod} sample is ready
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md">
                              <Check className="w-3 h-3 mr-1" />
                              Sampling Complete
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <ResultsTable
                        data={samplingResults}
                        outputName={lastRequest?.output_name || "sample"}
                        method={selectedMethod || ""}
                        onDownload={handleDownloadResults}
                        onCopyToClipboard={handleCopyToClipboard}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        isLoading={samplingMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Debug: Show message when on step 5 but no results */}
            {currentStep === 5 && (!samplingResults || samplingResults.length === 0) && (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Waiting for Results...
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    The sampling operation is processing. Results will appear here.
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
                    className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                  />
                  <h3 className="font-semibold mb-2 text-sm">Sampling Data</h3>
                  <p className="text-xs text-slate-600">
                    Executing {selectedMethod} sampling...
                  </p>
                  <motion.div
                    className="w-full bg-slate-200 rounded-full h-1.5 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="bg-blue-600 h-1.5 rounded-full"
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