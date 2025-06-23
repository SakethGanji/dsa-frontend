import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SectionCardProps {
  icon: LucideIcon
  iconColor?: string
  title: string
  description?: string
  badge?: string | number
  badgeVariant?: "default" | "secondary" | "outline" | "destructive"
  headerAction?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function SectionCard({
  icon: Icon,
  iconColor = "text-muted-foreground",
  title,
  description,
  badge,
  badgeVariant = "secondary",
  headerAction,
  children,
  className,
  contentClassName
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              iconColor === "text-primary" ? "bg-primary/10" : 
              iconColor === "text-green-600" ? "bg-green-500/10" : "bg-muted"
            )}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm mt-0.5">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge !== undefined && (
              <Badge variant={badgeVariant} className="text-xs font-medium">
                {badge}
              </Badge>
            )}
            {headerAction}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}