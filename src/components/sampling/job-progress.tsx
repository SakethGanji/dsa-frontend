import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  X
} from "lucide-react"
import type { JobStatusResponse, JobStatus } from "@/lib/api/types"

interface JobProgressProps {
  jobId: string | null
  jobStatus: JobStatus | null
  jobData: JobStatusResponse | null
  completedRounds: number
  totalRounds: number
  currentRound: number | null
  executionTime: number | null
  error: string | null
  isPolling: boolean
  onCancel?: () => void
}

export function JobProgress({
  jobId,
  jobStatus,
  jobData,
  completedRounds,
  totalRounds,
  currentRound,
  executionTime,
  error,
  isPolling: _isPolling,
  onCancel
}: JobProgressProps) {
  const progressPercentage = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0

  const getStatusIcon = () => {
    switch (jobStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (jobStatus) {
      case 'pending':
        return 'Preparing job...'
      case 'running':
        return `Processing round ${currentRound || '...'} of ${totalRounds}`
      case 'completed':
        return `Completed ${completedRounds} rounds in ${(executionTime! / 1000).toFixed(1)}s`
      case 'failed':
        return 'Job failed'
      default:
        return 'Unknown status'
    }
  }

  if (!jobId || !jobStatus) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium">{getStatusText()}</p>
            <p className="text-xs text-muted-foreground">Job ID: {jobId}</p>
          </div>
        </div>
        {onCancel && (jobStatus === 'running' || jobStatus === 'pending') && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {jobStatus === 'running' && (
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedRounds} of {totalRounds} rounds complete</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
      )}

      {/* Round Details */}
      {jobData && jobData.round_results.length > 0 && jobStatus !== 'failed' && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {jobData.round_results.map((round) => (
              <div 
                key={round.round_number}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="font-medium">Round {round.round_number}</span>
                <span className="text-muted-foreground">
                  {round.sample_size.toLocaleString()} samples
                </span>
              </div>
            ))}
            {Array.from({ length: totalRounds - completedRounds }, (_, i) => {
              const roundNumber = completedRounds + i + 1
              const isCurrent = currentRound === roundNumber
              
              return (
                <div 
                  key={`pending-${roundNumber}`}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/10 text-sm"
                >
                  {isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-muted-foreground">Round {roundNumber}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || (jobData?.error_message && jobStatus === 'failed')) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-destructive/90">
                {error || jobData?.error_message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}