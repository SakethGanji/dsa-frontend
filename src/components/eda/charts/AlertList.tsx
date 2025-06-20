import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AlertListData } from "../types"

interface AlertListProps {
  data: AlertListData
  title?: string
  description?: string
  className?: string
}

const severityConfig = {
  INFO: {
    icon: Info,
    variant: "default" as const,
    className: "border-primary/30 bg-primary/5",
    iconClassName: "text-primary"
  },
  WARNING: {
    icon: AlertTriangle,
    variant: "default" as const,
    className: "border-chart-2/30 bg-chart-2/5",
    iconClassName: "text-chart-2"
  },
  ERROR: {
    icon: AlertCircle,
    variant: "destructive" as const,
    className: "border-destructive/30 bg-destructive/5",
    iconClassName: "text-destructive"
  }
}

export function AlertList({ 
  data, 
  title, 
  description, 
  className 
}: AlertListProps) {
  // Group alerts by severity
  const groupedAlerts = data.alerts.reduce((acc, alert) => {
    if (!acc[alert.severity]) {
      acc[alert.severity] = []
    }
    acc[alert.severity].push(alert)
    return acc
  }, {} as Record<string, typeof data.alerts>)

  // Sort by severity order
  const severityOrder = ['ERROR', 'WARNING', 'INFO']
  const sortedGroups = severityOrder
    .filter(severity => groupedAlerts[severity])
    .map(severity => ({
      severity,
      alerts: groupedAlerts[severity]
    }))

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {sortedGroups.map((group, groupIndex) => (
        <div key={group.severity} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant={group.severity === 'ERROR' ? 'destructive' : group.severity === 'WARNING' ? 'secondary' : 'default'}
              className={cn(
                "text-xs",
                group.severity === 'WARNING' && "bg-chart-2/20 text-chart-2 border-chart-2/30"
              )}
            >
              {group.severity} ({group.alerts.length})
            </Badge>
          </div>

          <div className="space-y-2">
            {group.alerts.map((alert, index) => {
              const config = severityConfig[alert.severity]
              const Icon = config.icon

              return (
                <motion.div
                  key={`${alert.alert_type}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                >
                  <Alert className={cn("relative transition-all hover:shadow-sm", config.className)}>
                    <Icon className={cn("h-4 w-4", config.iconClassName)} />
                    <AlertTitle className="font-medium">
                      {alert.column ? (
                        <>
                          Column: <span className="font-mono text-sm">{alert.column}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {alert.alert_type.replace(/_/g, ' ')}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {alert.alert_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p>{alert.message}</p>
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="mt-2 text-xs space-y-1">
                          {Object.entries(alert.details).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2">
                              <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-mono">
                                {typeof value === 'number' 
                                  ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}

      {data.alerts.length === 0 && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>No Issues Found</AlertTitle>
          <AlertDescription>
            Your data has passed all quality checks. No alerts or warnings to report.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}