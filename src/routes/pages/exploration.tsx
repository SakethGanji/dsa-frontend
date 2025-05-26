"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const timelineSteps = [
  { id: 1, title: "Select Dataset", subtitle: "Choose data source", icon: Database },
  { id: 2, title: "Select Version", subtitle: "Pick dataset version", icon: GitBranch },
  { id: 3, title: "Explore Data", subtitle: "Preview and examine", icon: Search },
  { id: 4, title: "Choose Analysis", subtitle: "Select analysis type", icon: BarChart3 },
  { id: 5, title: "View Results", subtitle: "Review insights", icon: FileText },
]

export function ExplorationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPreviousAnalyses, setShowPreviousAnalyses] = useState(false)
  const [viewingPrevious, setViewingPrevious] = useState(false)
  const [selectedPreviousAnalysis, setSelectedPreviousAnalysis] = useState<number | null>(null)

  // Query hooks
  const { data: versions, isLoading: versionsLoading } = useDatasetVersions(
    selectedDataset?.id || 0,
    { enabled: !!selectedDataset }
  )
  const exploreMutation = useExploreDataset<any>()
  
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

  const handleViewPreviousAnalysis = (analysisId: number) => {
    setSelectedPreviousAnalysis(analysisId)
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
    setSelectedPreviousAnalysis(null)
  }

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed"
    if (stepId === currentStep) return "active"
    return "pending"
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

  return (
    <div className="min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline Section - Now as a card on top or side */}
        <div className="lg:w-80 w-full">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Exploration Progress</CardTitle>
              <CardDescription className="text-sm">Follow the steps to analyze your data</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {/* Timeline Steps */}
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const status = getStepStatus(step.id)
                  const Icon = step.icon

                  return (
                    <motion.div
                      key={step.id}
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="relative flex-shrink-0">
                          <motion.div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-500 ${
                              status === "completed"
                                ? "bg-green-500 border-green-500 text-white"
                                : status === "active"
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "bg-white border-slate-300 text-slate-400"
                            }`}
                          >
                            {status === "completed" ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </motion.div>

                          {/* Connector Line */}
                          {index < timelineSteps.length - 1 && (
                            <motion.div
                              className={`absolute top-10 left-1/2 w-0.5 h-8 -translate-x-1/2 transition-colors duration-500 ${
                                status === "completed" ? "bg-green-500" : "bg-slate-200"
                              }`}
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: status === "completed" ? 1 : 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-6">
                          <h3
                            className={`font-semibold text-sm transition-colors duration-300 ${
                              status === "active"
                                ? "text-blue-600"
                                : status === "completed"
                                  ? "text-green-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{step.subtitle}</p>

                          {/* Step Summary */}
                          {status === "completed" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                              className="mt-2"
                            >
                              {step.id === 1 && selectedDataset && (
                                <div className="text-xs text-green-700 bg-green-50 rounded-md p-2">
                                  <div className="font-medium">{selectedDataset.name}</div>
                                  <div className="text-green-600">
                                    {formatByteSize(selectedDataset.file_size)} • {selectedDataset.file_type?.toUpperCase()}
                                  </div>
                                </div>
                              )}
                              {step.id === 2 && selectedVersion && (
                                <div className="text-xs text-green-700 bg-green-50 rounded-md p-2">
                                  <div className="font-medium">Version {selectedVersion.version_number}</div>
                                  <div className="text-green-600">
                                    {format(new Date(selectedVersion.ingestion_timestamp), 'MMM d, yyyy')}
                                  </div>
                                </div>
                              )}
                              {step.id === 3 && currentStep > 3 && (
                                <div className="text-xs text-green-700 bg-green-50 rounded-md p-2">
                                  <div className="font-medium">Data Explored</div>
                                  <div className="text-green-600">
                                    {tableData?.headers?.length || 0} columns
                                  </div>
                                </div>
                              )}
                              {step.id === 4 && selectedAnalysis && (
                                <div className="text-xs text-green-700 bg-green-50 rounded-md p-2">
                                  <div className="font-medium">
                                    {analysisOptions.find((a) => a.id === selectedAnalysis)?.name}
                                  </div>
                                  <div className="text-green-600">Analysis selected</div>
                                </div>
                              )}
                              {step.id === 5 && currentStep >= 5 && (
                                <div className="text-xs text-green-700 bg-green-50 rounded-md p-2">
                                  <div className="font-medium">
                                    {viewingPrevious ? "Previous Results" : "Analysis Complete"}
                                  </div>
                                  <div className="text-green-600">Ready to view</div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Reset Button */}
              {currentStep > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 pt-4 border-t border-slate-200"
                >
                  <Button variant="outline" onClick={resetFlow} className="w-full text-xs">
                    <Database className="w-3 h-3 mr-2" />
                    Start New Analysis
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {timelineSteps.find((s) => s.id === currentStep)?.title || "Data Exploration Flow"}
            </h2>
            <p className="text-slate-600">
              {timelineSteps.find((s) => s.id === currentStep)?.subtitle || "Discover insights from your datasets"}
            </p>
          </div>

          <div className="space-y-6">
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
                    className={`transition-all duration-500 ${
                      currentStep === 1
                        ? "ring-2 ring-blue-200 shadow-lg"
                        : currentStep > 1
                          ? "bg-green-50/50 border-green-200"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep > 1 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {currentStep > 1 ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Available Datasets</CardTitle>
                          <CardDescription className="text-sm">
                            Choose a dataset to begin your analysis
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="max-w-2xl mx-auto">
                        <DatasetSearchBar onSelectDataset={handleDatasetSelect} />
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Search for a dataset by name or select from the dropdown
                        </p>
                      </div>
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                  className={`h-full transition-all duration-200 ${
                                    isSelected && isCompleted
                                      ? "border-green-300 bg-green-50 shadow-md"
                                      : isSelected
                                        ? "border-blue-300 bg-blue-50 shadow-md"
                                        : isCompleted
                                          ? "opacity-50 cursor-default"
                                          : "cursor-pointer hover:shadow-md border hover:border-blue-300 hover:bg-blue-50/50"
                                  }`}
                                  onClick={!isCompleted ? () => handleVersionSelect(version) : undefined}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="text-xs">v{version.version_number}</Badge>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {format(new Date(version.ingestion_timestamp), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      {isSelected && isCompleted && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        >
                                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        </motion.div>
                                      )}
                                      {!isCompleted && (
                                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">
                                      {formatByteSize(version.file_size)} • {version.file_type?.toUpperCase()}
                                    </p>
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                              onClick={() => handleViewPreviousAnalysis(analysis.id)}
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
                            {selectedVersion?.sheets?.[0]?.columns?.length || 0} columns
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

                    <CardContent>
                      <motion.div
                        className="border rounded-lg overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {tableData?.headers ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {tableData.headers.slice(0, 5).map((header: string) => (
                                  <TableHead key={header} className="text-xs">
                                    {header}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.rows.slice(0, 5).map((row: Record<string, unknown>, index: number) => (
                                <motion.tr
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-slate-50"
                                >
                                  {tableData.headers.slice(0, 5).map((header: string) => (
                                    <TableCell key={header} className="text-xs">
                                      {row[header]?.toString() || '-'}
                                    </TableCell>
                                  ))}
                                </motion.tr>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                            Loading preview data...
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                className={`h-full transition-all duration-200 ${
                                  isSelected && isCompleted
                                    ? "border-green-300 bg-green-50 shadow-md"
                                    : isSelected
                                      ? "border-blue-300 bg-blue-50 shadow-md"
                                      : isCompleted
                                        ? "opacity-50 cursor-default"
                                        : "cursor-pointer hover:shadow-md border hover:border-blue-300 hover:bg-blue-50/50"
                                }`}
                                onClick={!isCompleted && option.id === "pandas" ? () => handleAnalysisSelect(option.id) : undefined}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-slate-900 text-sm">{option.name}</h3>
                                        {isSelected && isCompleted && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                          >
                                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                          </motion.div>
                                        )}
                                        {!isCompleted && (
                                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600">{option.description}</p>
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
                  <Card className="ring-2 ring-green-200 shadow-lg bg-green-50/30">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
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
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                            ✓ {viewingPrevious ? "Previous Analysis" : "Analysis Complete"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {exploreMutation.isPending ? (
                        <div className="p-8 text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                          <p className="text-gray-500">Generating analysis...</p>
                        </div>
                      ) : exploreMutation.data?.profile || viewingPrevious ? (
                        <motion.div
                          className="border rounded-lg bg-white shadow-sm overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <iframe 
                            srcDoc={exploreMutation.data?.profile || sessionStorage.getItem(`profile_${selectedDataset?.id}_${selectedVersion?.id}`) || ''} 
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

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { label: "Total Rows", value: tableData?.total_count || "N/A", color: "blue" },
                                { label: "Columns", value: selectedVersion?.sheets?.[0]?.columns?.length || 0, color: "green" },
                                { label: "Data Quality", value: "98.5%", color: "purple" },
                                { label: "File Size", value: formatByteSize(selectedVersion?.file_size), color: "orange" },
                              ].map((stat, index) => (
                                <motion.div
                                  key={stat.label}
                                  className={`text-center p-4 bg-${stat.color}-50 rounded-lg`}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    delay: 0.8 + index * 0.1,
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                                  <div className="text-sm text-slate-600">{stat.label}</div>
                                </motion.div>
                              ))}
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