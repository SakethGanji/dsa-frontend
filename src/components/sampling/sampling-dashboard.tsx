import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DatasetVersionSelector } from "./dataset-version-selector"
import { SamplingHistoryTable } from "./sampling-history-table"
import { MultiRoundFormV3 } from "./multi-round-form-v3"
import { InlineJobResults } from "./inline-job-results"
import { JobProgress } from "./job-progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FlaskConical, 
  ChevronDown,
  ChevronUp,
  Plus,
  History,
  Zap,
  CheckCircle2
} from "lucide-react"
import { useDatasetContext } from "@/contexts/DatasetContext"
import { useMultiRoundJob } from "@/hooks/use-multi-round-job"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MultiRoundSamplingRequest, JobStatusResponse } from "@/lib/api/types"

interface SamplingDashboardProps {
  datasetId?: number
  versionId?: number
  className?: string
}

export function SamplingDashboard({
  datasetId: initialDatasetId,
  className
}: SamplingDashboardProps) {
  // Global dataset context
  const { selectedDataset, setSelectedDataset, selectedVersion, setSelectedVersion } = useDatasetContext()
  
  // Local state
  const [isCreateExpanded, setIsCreateExpanded] = useState(false)
  const [completedJobs, setCompletedJobs] = useState<JobStatusResponse[]>([])
  const [collapsedJobIds, setCollapsedJobIds] = useState<Set<string>>(new Set())
  
  // Multi-round job hook
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
    isStartingJob
  } = useMultiRoundJob({
    onJobComplete: useCallback((jobId: string, data: JobStatusResponse) => {
      console.log('Job completed:', { jobId, data, dataId: data.id })
      // Ensure the data has the job ID
      const jobDataWithId = { ...data, id: data.id || jobId }
      console.log('Storing completed job with ID:', jobDataWithId.id)
      setCompletedJobs(prev => [jobDataWithId, ...prev.slice(0, 2)]) // Keep last 3 completed jobs
      setIsCreateExpanded(false) // Collapse form after completion
      // Jobs are expanded by default, no need to track
      const totalSamples = data.round_results.reduce((sum: number, round) => sum + round.sample_size, 0)
      toast.success(`Sampling completed! ${data.completed_rounds} rounds with ${totalSamples.toLocaleString()} samples.`)
    }, []),
    onJobFailed: useCallback((error: string) => {
      toast.error(`Sampling failed: ${error}`)
    }, []),
    pollingInterval: 2000
  })
  
  // Fetch dataset columns for the form
  const { data: datasetInfo } = useQuery({
    queryKey: ['sampling-columns', selectedDataset?.id, selectedVersion?.id],
    queryFn: async () => {
      if (!selectedDataset || !selectedVersion) return null
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/sampling/${selectedDataset.id}/${selectedVersion.id}/columns`,
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
    enabled: !!selectedDataset && !!selectedVersion,
  })
  
  // Initialize from props if provided
  useEffect(() => {
    if (initialDatasetId && !selectedDataset) {
      // Would need to fetch dataset details here
      // For now, we'll rely on the context being set elsewhere
    }
  }, [initialDatasetId, selectedDataset])
  
  // Handle multi-round submit
  const handleMultiRoundSubmit = async (request: MultiRoundSamplingRequest) => {
    if (!selectedDataset || !selectedVersion) return
    
    try {
      await startJob(selectedDataset.id, selectedVersion.id, request)
    } catch {
      toast.error('Failed to start sampling job')
    }
  }
  
  // Handle toggling job results expansion
  const handleToggleJobExpansion = (jobId: string) => {
    setCollapsedJobIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        // If it's collapsed, remove it to expand
        newSet.delete(jobId)
      } else {
        // If it's expanded, add it to collapse
        newSet.add(jobId)
      }
      return newSet
    })
  }
  
  const hasActiveJobs = jobStatus && (jobStatus === 'pending' || jobStatus === 'running')
  const showEmptyState = !selectedDataset || !selectedVersion
  
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Dataset & Version Selector */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <DatasetVersionSelector
            selectedDataset={selectedDataset}
            selectedVersion={selectedVersion}
            onDatasetChange={setSelectedDataset}
            onVersionChange={setSelectedVersion}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showEmptyState ? (
          /* Empty State */
          <Card className="border-dashed border-2 bg-muted/5">
            <CardContent className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-8">
                <FlaskConical className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Get Started with Sampling</h3>
              <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                Select a dataset and version above to start creating samples or view sampling history.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Sampling History Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <History className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Sampling History</CardTitle>
                      <CardDescription className="mt-1">
                        View and manage all sampling runs for this dataset
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setIsCreateExpanded(true)
                      // Scroll to create section after a short delay
                      setTimeout(() => {
                        const createSection = document.getElementById('create-sample-section')
                        createSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
                    }}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Sample
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SamplingHistoryTable
                  datasetId={selectedDataset.id}
                  versionId={selectedVersion.id}
                  onSampleSelect={(sample) => {
                    // Handle sample selection - could expand inline or show modal
                    console.log('Selected sample:', sample)
                  }}
                />
              </CardContent>
            </Card>

            {/* Create New Sample Section */}
            <Card id="create-sample-section" className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => setIsCreateExpanded(!isCreateExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Create New Sample</CardTitle>
                      <CardDescription className="mt-1">
                        Configure multi-round sampling with various techniques
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    {isCreateExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {isCreateExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Separator />
                    <CardContent className="pt-6">
                      <MultiRoundFormV3
                        datasetId={selectedDataset.id}
                        versionId={selectedVersion.id}
                        datasetColumns={datasetInfo?.columns || []}
                        onSubmit={handleMultiRoundSubmit}
                        isLoading={isStartingJob}
                      />
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
            
            {/* Active Jobs Section */}
            {hasActiveJobs && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-sm border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <CardTitle className="text-xl">Active Jobs</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Recent Results Section */}
            {completedJobs.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <CardTitle className="text-xl">Recent Results</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {completedJobs.length} completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedJobs.map((job, index) => (
                      <motion.div
                        key={job.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg bg-muted/30 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="font-medium">
                                {job.request?.rounds?.[0]?.output_name || (job.id ? `Job ${job.id}` : 'Sampling Job')}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {job.completed_rounds} rounds • {job.execution_time_ms}ms
                            </span>
                          </div>
                          <InlineJobResults
                            job={job}
                            isExpanded={!collapsedJobIds.has(job.id)}
                            onToggleExpand={() => job.id && handleToggleJobExpansion(job.id)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>
        )}
      </div>
    </div>
  )
}