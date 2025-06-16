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
  History,
  Eye,
  Plus,
} from "lucide-react"
import { useDatasetVersions, useExploreDataset } from "@/hooks"
import { createProfileRequest } from "@/hooks/use-exploration-query"
import { StepNavigation, DatasetSelector, VersionGrid, LoadingOverlay } from "@/components/shared"
import type { Dataset, DatasetVersion } from "@/lib/api/types"
import { formatByteSize } from "@/lib/utils"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { useDatasetContext } from "@/contexts/DatasetContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  // Use global dataset context
  const { selectedDataset, setSelectedDataset, selectedVersion, setSelectedVersion } = useDatasetContext()
  
  // Calculate initial step based on existing selections
  const getInitialStep = () => {
    if (selectedVersion) return 3 // Both dataset and version selected
    if (selectedDataset) return 2 // Only dataset selected
    return 1 // Nothing selected
  }
  
  const [currentStep, setCurrentStep] = useState(getInitialStep())
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPreviousAnalyses, setShowPreviousAnalyses] = useState(false)
  const [viewingPrevious, setViewingPrevious] = useState(false)
  
  // Update step when global selections change (e.g., from another tab)
  useEffect(() => {
    const newStep = getInitialStep()
    setCurrentStep(newStep)
  }, [selectedDataset, selectedVersion])

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
    // Version is automatically cleared by context when dataset changes
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
  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-0 lg:-mt-0">
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
        <StepNavigation
          steps={stepInfo}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          onReset={resetFlow}
          resetLabel="New Analysis"
        />

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-3 lg:p-4 space-y-3 lg:space-y-4 max-w-7xl mx-auto">
            {/* Step 1: Select Dataset */}
            <AnimatePresence mode="wait">
              {shouldShowStep(1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
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
            <AnimatePresence mode="wait">
              {shouldShowStep(2) && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ 
                    duration: 0.4,
                    delay: 0.1,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
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

            {/* Previous Analyses Alert */}
            <AnimatePresence>
              {showPreviousAnalyses && currentStep >= 3 && !viewingPrevious && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <History className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Previous Analyses Found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            This dataset version has previous analyses. You can view existing results or run
                            a new analysis.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowPreviousAnalyses(false)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Previous
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleRunNewAnalysis}
                              className="flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
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
                  <Card className="border-primary/50 shadow-lg dark:shadow-primary/10 bg-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20">
                            <History className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold">Previous Analyses</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              Select an analysis to view or run a new one
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowPreviousAnalyses(false)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          New Analysis
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              className="h-full cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-accent/50 dark:hover:bg-accent/20 transition-all duration-200"
                              onClick={() => handleViewPreviousAnalysis()}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="font-semibold text-base">{analysis.name}</h3>
                                  <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.date}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {analysis.insights} insights
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Quality: {analysis.quality}</p>
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
                    className={`transition-all duration-300 overflow-hidden ${
                      currentStep === 3
                        ? "border-primary/40 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 ring-1 ring-primary/20"
                        : currentStep > 3
                          ? "bg-card/70 border-border/50 opacity-80"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              currentStep > 3
                                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                                : currentStep === 3
                                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {currentStep > 3 ? <Check className="w-6 h-6" /> : <Search className="w-6 h-6" />}
                          </motion.div>
                          <div>
                            <CardTitle className="text-xl font-semibold">Data Preview</CardTitle>
                            <CardDescription className="text-sm mt-0.5">
                              Explore your dataset structure and content
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
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button onClick={handleExploreData} size="sm" className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Start Analysis
                              </Button>
                            </motion.div>
                          )}
                          {currentStep > 3 && (
                            <Badge variant="secondary" className="text-sm">
                              <Check className="w-3 h-3 mr-1" />
                              Data Explored
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
                            <div className="px-4 py-3 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 border-b border-border/50">
                              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                                {tableData.headers.slice(0, 6).map((header: string, idx: number) => (
                                  <motion.div
                                    key={header}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.05, type: "spring", stiffness: 500, damping: 30 }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-br from-card to-card/80 rounded-lg shadow-md hover:shadow-lg border border-border/60 min-w-fit transition-all cursor-default"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                                    <span className="text-xs font-medium text-foreground/90">{header}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/20">Text</Badge>
                                  </motion.div>
                                ))}
                                {tableData.headers.length > 6 && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                  >
                                    <Badge variant="outline" className="text-xs px-2.5 py-1.5 border-dashed">
                                      +{tableData.headers.length - 6} more
                                    </Badge>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            
                            {/* Data Table */}
                            <div className="w-full overflow-hidden">
                              <div className="overflow-x-auto">
                                <div className="min-w-full">
                                  <Table className="min-w-max">
                                    <TableHeader>
                                      <TableRow>
                                        {tableData.headers.map((header: string) => (
                                          <TableHead key={header} className="font-medium text-sm">
                                            {header}
                                          </TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tableData.rows.slice(0, 5).map((row: Record<string, unknown>, rowIndex: number) => (
                                        <TableRow key={rowIndex}>
                                          {tableData.headers.map((header: string) => (
                                            <TableCell key={header} className="text-sm">
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
                          <div className="p-12 text-center">
                            <motion.div
                              className="relative w-16 h-16 mx-auto mb-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-4 border-primary/20 rounded-full"
                              />
                              <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border-4 border-t-primary border-r-primary/50 border-b-transparent border-l-transparent rounded-full"
                              />
                            </motion.div>
                            <p className="text-sm font-medium text-muted-foreground">Loading preview data...</p>
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
                    className={`transition-all duration-300 overflow-hidden ${
                      currentStep === 4
                        ? "border-primary/40 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 ring-1 ring-primary/20"
                        : currentStep > 4
                          ? "bg-card/70 border-border/50 opacity-80"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            currentStep > 4
                              ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                              : currentStep === 4
                                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 4 ? <Check className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl font-semibold">Analysis Options</CardTitle>
                          <CardDescription className="text-sm mt-0.5">
                            Choose your preferred analysis method
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                    ? "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg ring-1 ring-primary/20"
                                    : isSelected
                                      ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20 ring-2 ring-primary/30"
                                      : isCompleted
                                        ? "opacity-60 cursor-default bg-card/60 border-border/40"
                                        : "cursor-pointer hover:shadow-lg hover:border-primary/40 hover:bg-gradient-to-br hover:from-card hover:to-primary/5 bg-card border-border/60"
                                }`}
                                onClick={!isCompleted && option.id === "pandas" ? () => handleAnalysisSelect(option.id) : undefined}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                                <CardContent className="p-4 relative">
                                  <div className="flex items-start gap-3">
                                    <motion.div 
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      whileTap={{ scale: 0.9 }}
                                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                                        option.id === 'pandas' ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                                        option.id === 'sweetviz' ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' :
                                        'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                                      }`}
                                    >
                                      <Icon className="w-7 h-7" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-base">{option.name}</h3>
                                        {isSelected && isCompleted && (
                                          <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="bg-primary rounded-full p-1.5 shadow-sm"
                                          >
                                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                          </motion.div>
                                        )}
                                        {!isCompleted && option.id === "pandas" && (
                                          <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="text-primary"
                                          >
                                            <Play className="w-5 h-5" />
                                          </motion.div>
                                        )}
                                        {!isCompleted && option.id !== "pandas" && (
                                          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{option.description}</p>
                                      {option.id === "pandas" && (
                                        <div className="flex items-center gap-2">
                                          <Badge className="text-xs" variant="default">Recommended</Badge>
                                          <Badge variant="secondary" className="text-xs">~30s</Badge>
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
                          className="border rounded-lg bg-white shadow-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <iframe 
                            srcDoc={(exploreMutation.data && typeof exploreMutation.data === 'object' && 'profile' in exploreMutation.data ? (exploreMutation.data as { profile?: string }).profile : null) || sessionStorage.getItem(`profile_${selectedDataset?.id}_${selectedVersion?.id}`) || ''} 
                            title="Dataset Profile" 
                            className="w-full min-h-[800px] border-0"
                            style={{ height: 'auto' }}
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
                                { label: "File Size", value: formatByteSize(selectedVersion?.overlay_file_size || selectedVersion?.materialized_file_size || selectedVersion?.file_size), gradient: "from-orange-500 to-red-600", bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30", icon: FileText },
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
                              <ul className="space-y-2 text-sm text-muted-foreground">
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
                                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
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

      <LoadingOverlay
        isLoading={isAnalyzing}
        title="Analyzing Data"
        description={`Running ${analysisOptions.find((a) => a.id === selectedAnalysis)?.name || 'analysis'}...`}
      />
    </div>
  )
}