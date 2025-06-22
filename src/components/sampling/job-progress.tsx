import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Layers,
  AlertCircle
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
  isPolling,
  onCancel
}: JobProgressProps) {
  const progressPercentage = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0

  const getStatusIcon = () => {
    switch (jobStatus) {
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    const variant = jobStatus === 'completed' ? 'default' : 
                    jobStatus === 'failed' ? 'destructive' : 
                    jobStatus === 'running' ? 'secondary' : 
                    'outline'
    
    return (
      <Badge variant={variant} className="capitalize">
        {jobStatus || 'Unknown'}
      </Badge>
    )
  }

  if (!jobId || !jobStatus) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                Multi-Round Sampling Job
              </CardTitle>
              <CardDescription>
                Job ID: {jobId}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onCancel && jobStatus === 'running' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {jobStatus === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Processing Round {currentRound || '...'} of {totalRounds}
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Round Status */}
        {jobData && jobData.round_results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Layers className="w-4 h-4" />
              Round Progress
            </div>
            <div className="grid gap-2">
              {Array.from({ length: totalRounds }, (_, i) => {
                const roundNumber = i + 1
                const roundResult = jobData.round_results.find(r => r.round_number === roundNumber)
                const isComplete = !!roundResult
                const isCurrent = currentRound === roundNumber
                
                return (
                  <div 
                    key={roundNumber} 
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={isComplete ? 'text-foreground' : 'text-muted-foreground'}>
                        Round {roundNumber}
                      </span>
                    </div>
                    {roundResult && (
                      <span className="text-xs text-muted-foreground">
                        {roundResult.sample_size.toLocaleString()} samples • {roundResult.method}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Execution Time */}
        {executionTime && jobStatus === 'completed' && (
          <div className="text-sm text-muted-foreground">
            Completed in {(executionTime / 1000).toFixed(1)} seconds
          </div>
        )}
      </CardContent>
    </Card>
  )
}