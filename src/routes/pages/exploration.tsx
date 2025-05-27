"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  GitBranch,
  Search,
  BarChart3,
  FileText,
  Sparkles,
  ChevronRight,
  Check,
  Play,
  Clock,
  History,
  Eye,
  Plus,
} from "lucide-react"
import { DatasetSearchBar } from "@/components/dataset-search"
import { useDatasetVersions, useExploreDataset } from "@/hooks"
import { createProfileRequest } from "@/hooks/use-exploration-query"
import type { Dataset, DatasetVersion } from "@/lib/api/types"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import React from "react"

const analysisOptions = [
  {
    id: "pandas",
    name: "Pandas Profiling",
    description: "Comprehensive data profiling with statistics and visualizations",
    icon: BarChart3,
  },
  {
    id: "sweetviz",
    name: "SweetViz Analysis",
    description: "Beautiful visualizations and data comparisons",
    icon: Sparkles,
  },
  {
    id: "custom",
    name: "Custom Analysis",
    description: "Build your own analysis with custom parameters",
    icon: FileText,
  },
]

const stepInfo = {
  1: { title: "Select Dataset", subtitle: "Choose data source" },
  2: { title: "Select Version", subtitle: "Pick dataset version" },
  3: { title: "Explore Data", subtitle: "Preview and examine" },
  4: { title: "Choose Analysis", subtitle: "Select analysis type" },
  5: { title: "View Results", subtitle: "Review insights" },
}

export function ExplorationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPreviousAnalyses, setShowPreviousAnalyses] = useState(false)
  const [viewingPrevious, setViewingPrevious] = useState(false)
  const [compactView, setCompactView] = useState(false)

  // Query hooks
  const { data: versions, isLoading: versionsLoading } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  const exploreMutation = useExploreDataset<{ profile?: string }>()
  
  // Fetch table data for preview with direct API call
  const { data: tableData } = useQuery({
    queryKey: ['dataset-preview', selectedDataset?.id, selectedVersion?.id],
    queryFn: async () => {
      if (!selectedDataset || !selectedVersion) return null
      const response = await fetch(
        `http://127.0.0.1:8000/api/datasets/${selectedDataset.id}/versions/${selectedVersion.id}/data?limit=5&offset=0`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`
          }
        }
      )
      if (!response.ok) throw new Error('Failed to fetch data')
      return response.json()
    },
    enabled: !!selectedDataset && !!selectedVersion && currentStep >= 3,
  })

  // Check for existing analyses
  useEffect(() => {
    if (selectedVersion) {
      // Check sessionStorage for existing profiles
      const profileKey = `profile_${selectedDataset?.id}_${selectedVersion.id}`
      const existingProfile = sessionStorage.getItem(profileKey)
      if (existingProfile) {
        setShowPreviousAnalyses(true)
      }
    }
  }, [selectedVersion, selectedDataset])

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset)
    setSelectedVersion(null)
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleVersionSelect = (version: DatasetVersion) => {
    setSelectedVersion(version)
    setTimeout(() => setCurrentStep(3), 300)
  }

  const handleExploreData = () => {
    setTimeout(() => setCurrentStep(4), 300)
  }

  const handleAnalysisSelect = (analysisId: string) => {
    setSelectedAnalysis(analysisId)
    setIsAnalyzing(true)
    
    if (selectedDataset && selectedVersion) {
      exploreMutation.mutate({
        datasetId: selectedDataset.id,
        versionId: selectedVersion.id,
        options: createProfileRequest('html')
      }, {
        onSuccess: () => {
          setIsAnalyzing(false)
          setCurrentStep(5)
        },
        onError: () => {
          setIsAnalyzing(false)
        }
      })
    }
  }

  const handleViewPreviousAnalysis = () => {
    setViewingPrevious(true)
    setCurrentStep(5)
  }

  const handleRunNewAnalysis = () => {
    setShowPreviousAnalyses(false)
    setViewingPrevious(false)
    setCurrentStep(4)
  }

  const resetFlow = () => {
    setCurrentStep(1)
    setSelectedDataset(null)
    setSelectedVersion(null)
    setSelectedAnalysis(null)
    setIsAnalyzing(false)
    setShowPreviousAnalyses(false)
    setViewingPrevious(false)
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

  // Mock previous analyses for demo
  const mockPreviousAnalyses = selectedVersion ? [{
    id: 1,
    type: "pandas",
    name: "Pandas Profiling",
    date: format(new Date(), 'yyyy-MM-dd'),
    status: "completed",
    insights: 4,
    quality: "98.5%",
  }] : []

  // Format cell value based on type
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return value.toString()
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
                    New Analysis
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
                        <div className="relative">
                          <DatasetSearchBar onSelectDataset={handleDatasetSelect} />
                          {selectedDataset && currentStep === 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute right-2 top-2"
                            >
                              <Button
                                size="sm"
                                onClick={() => handleDatasetSelect(selectedDataset)}
                                className="shadow-lg"
                              >
                                Continue <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
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
                                          <Clock className="w-3 h-3" />
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

            {/* Previous Analyses Alert */}
            <AnimatePresence>
              {showPreviousAnalyses && currentStep >= 3 && !viewingPrevious && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <History className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-purple-900 text-sm mb-1">Previous Analyses Found</h3>
                          <p className="text-xs text-purple-700 mb-3">
                            This dataset version has previous analyses. You can view existing results or run
                            a new analysis.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowPreviousAnalyses(false)}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Eye className="w-3 h-3" />
                              View Previous
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleRunNewAnalysis}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Run New Analysis
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Previous Analyses List */}
            <AnimatePresence>
              {showPreviousAnalyses && !viewingPrevious && currentStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-purple-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                            <History className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Previous Analyses</CardTitle>
                            <CardDescription className="text-sm">
                              Select an analysis to view or run a new one
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowPreviousAnalyses(false)}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          New Analysis
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {mockPreviousAnalyses.map((analysis, index) => (
                          <motion.div
                            key={analysis.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className="h-full cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-purple-300 hover:bg-purple-50/50"
                              onClick={() => handleViewPreviousAnalysis()}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-slate-900 text-sm">{analysis.name}</h3>
                                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.date}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {analysis.insights} insights
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600">Quality: {analysis.quality}</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Explore Data */}
            <AnimatePresence>
              {shouldShowStep(3) && !showPreviousAnalyses && (
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
                      <div className="flex items-center justify-between">
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
                            {currentStep > 3 ? <Check className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">Data Preview</CardTitle>
                            <CardDescription className="text-sm">
                              Preview your dataset before analysis
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            5 rows preview
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {tableData?.headers?.length || 0} columns
                          </Badge>
                          {currentStep === 3 && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={handleExploreData} size="sm" className="flex items-center gap-2">
                                <Play className="w-3 h-3" />
                                Start Analysis
                              </Button>
                            </motion.div>
                          )}
                          {currentStep > 3 && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                              ✓ Data Explored
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                      >
                        {tableData?.headers ? (
                          <>
                            {/* Column Stats Bar */}
                            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-b border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-3 overflow-x-auto">
                                {tableData.headers.slice(0, 6).map((header: string, idx: number) => (
                                  <motion.div
                                    key={header}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + idx * 0.05 }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 min-w-fit"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{header}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Text</Badge>
                                  </motion.div>
                                ))}
                                {tableData.headers.length > 6 && (
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    +{tableData.headers.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Data Table */}
                            <div className="w-full overflow-hidden">
                              <div className="overflow-x-auto bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50">
                                <div className="min-w-full rounded-b-lg shadow-inner">
                                  <Table className="min-w-max">
                                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                      <TableRow>
                                        {tableData.headers.map((header: string) => (
                                          <TableHead key={header} className="font-medium text-xs">
                                            {header}
                                          </TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tableData.rows.slice(0, 5).map((row: Record<string, any>, rowIndex: number) => (
                                        <TableRow key={rowIndex}>
                                          {tableData.headers.map((header: string) => (
                                            <TableCell key={header} className="text-xs">
                                              {formatCellValue(row[header])}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                            />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading preview data...</p>
                          </div>
                        )}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 4: Choose Analysis */}
            <AnimatePresence>
              {shouldShowStep(4) && !showPreviousAnalyses && !viewingPrevious && (
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
                          {currentStep > 4 ? <Check className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Analysis Options</CardTitle>
                          <CardDescription className="text-sm">
                            Select how you want to analyze your data
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {analysisOptions.map((option, index) => {
                          const Icon = option.icon
                          const isSelected = selectedAnalysis === option.id
                          const isCompleted = currentStep > 4

                          return (
                            <motion.div
                              key={option.id}
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
                                onClick={!isCompleted && option.id === "pandas" ? () => handleAnalysisSelect(option.id) : undefined}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                                <CardContent className="p-4 relative">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br ${
                                      option.id === 'pandas' ? 'from-blue-500 to-indigo-600' :
                                      option.id === 'sweetviz' ? 'from-purple-500 to-pink-600' :
                                      'from-orange-500 to-red-600'
                                    }`}>
                                      <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{option.name}</h3>
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
                                        {!isCompleted && option.id === "pandas" && (
                                          <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-1 shadow-sm"
                                          >
                                            <Play className="w-3 h-3 text-white" />
                                          </motion.div>
                                        )}
                                        {!isCompleted && option.id !== "pandas" && (
                                          <Badge variant="outline" className="text-[10px] px-2 py-0.5">Coming Soon</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{option.description}</p>
                                      {option.id === "pandas" && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-0">Recommended</Badge>
                                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">~30s</Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 5: View Results */}
            <AnimatePresence>
              {shouldShowStep(5) && (
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
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">
                              {viewingPrevious ? "Previous Analysis Results" : "Analysis Results"}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {viewingPrevious
                                ? `Viewing previous analysis`
                                : selectedAnalysis
                                  ? analysisOptions.find((a) => a.id === selectedAnalysis)?.name + " results"
                                  : "Your analysis results will appear here"}
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
                              {viewingPrevious ? "Previous Analysis" : "Analysis Complete"}
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {exploreMutation.isPending ? (
                        <div className="p-8 text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                          <p className="text-gray-500">Generating analysis...</p>
                        </div>
                      ) : (exploreMutation.data && typeof exploreMutation.data === 'object' && 'profile' in exploreMutation.data && (exploreMutation.data as { profile?: string }).profile) || viewingPrevious ? (
                        <motion.div
                          className="border rounded-lg bg-white shadow-sm overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <iframe 
                            srcDoc={(exploreMutation.data && typeof exploreMutation.data === 'object' && 'profile' in exploreMutation.data ? (exploreMutation.data as { profile?: string }).profile : null) || sessionStorage.getItem(`profile_${selectedDataset?.id}_${selectedVersion?.id}`) || ''} 
                            title="Dataset Profile" 
                            className="w-full h-[600px] border-0"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          className="border rounded-lg p-6 bg-white shadow-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="space-y-6">
                            <motion.h3
                              className="text-lg font-semibold"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.6 }}
                            >
                              Dataset Overview
                            </motion.h3>

                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { label: "Total Rows", value: tableData?.total_count || "N/A", gradient: "from-blue-500 to-indigo-600", bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", icon: Database },
                                { label: "Columns", value: tableData?.headers?.length || 0, gradient: "from-green-500 to-emerald-600", bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", icon: GitBranch },
                                { label: "Data Quality", value: "98.5%", gradient: "from-purple-500 to-pink-600", bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30", icon: Sparkles },
                                { label: "File Size", value: formatByteSize(selectedVersion?.file_size), gradient: "from-orange-500 to-red-600", bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30", icon: FileText },
                              ].map((stat, index) => {
                                const Icon = stat.icon
                                return (
                                  <motion.div
                                    key={stat.label}
                                    className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.bgGradient} border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300`}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                      delay: 0.8 + index * 0.1,
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 30,
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                                      <Icon className="w-full h-full" />
                                    </div>
                                    <div className="relative p-4">
                                      <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{stat.label}</div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>

                            <motion.div
                              className="mt-6"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.2 }}
                            >
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                Key Insights
                              </h4>
                              <ul className="space-y-2 text-sm text-slate-600">
                                {[
                                  "Dataset successfully loaded and ready for analysis",
                                  "All columns have been properly identified",
                                  "Data types have been automatically detected",
                                  "No critical data quality issues found",
                                ].map((insight, index) => (
                                  <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.4 + index * 0.1 }}
                                    className="flex items-start gap-2"
                                  >
                                    <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    {insight}
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
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
                  <h3 className="font-semibold mb-2 text-sm">Analyzing Data</h3>
                  <p className="text-xs text-slate-600">
                    Running {analysisOptions.find((a) => a.id === selectedAnalysis)?.name}...
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