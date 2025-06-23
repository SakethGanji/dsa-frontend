import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DatasetVersionSelector } from "@/components/shared"
import { SamplingHistoryTable } from "./sampling-history-table"
import { MultiRoundFormV3 } from "./multi-round-form-v3"
import { InlineJobResults } from "./inline-job-results"
import { JobProgress } from "./job-progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionCard, CollapsibleSection } from "@/components/shared"
import { 
  FlaskConical, 
  ChevronDown,
  Plus,
  History,
  Zap,
  CheckCircle2,
  Database,
  Sparkles
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
    <div className={cn("w-full", className)}>
      {/* Header Section with Dataset Selector */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Data Sampling</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage sampling configurations for your datasets
                </p>
              </div>
            </div>
            <DatasetVersionSelector
              selectedDataset={selectedDataset}
              selectedVersion={selectedVersion}
              onDatasetChange={setSelectedDataset}
              onVersionChange={setSelectedVersion}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-6">
        {showEmptyState ? (
          /* Enhanced Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-dashed border-2 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                    <Database className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3">No Dataset Selected</h3>
                <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Select a dataset and version from the dropdown above to start creating samples 
                  or view your sampling history.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Multi-round sampling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Track history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Real-time progress</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4" />
                <span className="font-medium">{selectedDataset.name}</span>
                <span>/</span>
                <span>v{selectedVersion.version_number}</span>
              </div>
              <Button
                onClick={() => {
                  setIsCreateExpanded(true)
                  setTimeout(() => {
                    const createSection = document.getElementById('create-sample-section')
                    createSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Sample
              </Button>
            </div>

            {/* Active Jobs Section - Always visible when there are active jobs */}
            {hasActiveJobs && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SectionCard
                  icon={Zap}
                  iconColor="text-primary"
                  title="Active Sampling Job"
                  description={`Processing ${totalRounds} rounds`}
                  className="border-primary/20 shadow-lg shadow-primary/5"
                >
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
                </SectionCard>
              </motion.div>
            )}
            
            {/* Sampling History Section */}
            <SectionCard
              icon={History}
              iconColor="text-muted-foreground"
              title="Sampling History"
              description="View and manage all sampling runs for this dataset"
            >
              <SamplingHistoryTable
                datasetId={selectedDataset.id}
                versionId={selectedVersion.id}
                onSampleSelect={(sample) => {
                  // Handle sample selection - could expand inline or show modal
                  console.log('Selected sample:', sample)
                }}
              />
            </SectionCard>

            {/* Create New Sample Section */}
            <CollapsibleSection
              icon={Plus}
              title="Create New Sample"
              description="Configure multi-round sampling with various techniques"
              defaultExpanded={isCreateExpanded}
              onToggle={setIsCreateExpanded}
            >
              <MultiRoundFormV3
                datasetId={selectedDataset.id}
                versionId={selectedVersion.id}
                datasetColumns={datasetInfo?.columns || []}
                onSubmit={handleMultiRoundSubmit}
                isLoading={isStartingJob}
              />
            </CollapsibleSection>

            {/* Recent Results Section - Show if there are completed jobs */}
            {completedJobs.length > 0 && (
              <SectionCard
                icon={CheckCircle2}
                iconColor="text-green-600"
                title="Recent Results"
                description="Latest completed sampling jobs"
                badge={`${completedJobs.length} completed`}
              >
                <div className="space-y-3">
                    {completedJobs.map((job, index) => (
                      <motion.div
                        key={job.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">
                                  {job.request?.rounds?.[0]?.output_name || (job.id ? `Job ${job.id}` : 'Sampling Job')}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {job.completed_rounds} rounds • {job.execution_time_ms}ms • 
                                  {job.round_results.reduce((sum: number, round) => sum + round.sample_size, 0).toLocaleString()} samples
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => job.id && handleToggleJobExpansion(job.id)}
                            >
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  collapsedJobIds.has(job.id) && "rotate-[-90deg]"
                                )}
                              />
                            </Button>
                          </div>
                          <AnimatePresence>
                            {!collapsedJobIds.has(job.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <InlineJobResults
                                  job={job}
                                  isExpanded={true}
                                  onToggleExpand={() => {}}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}