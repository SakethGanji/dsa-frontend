import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  iconColor?: string
  className?: string
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = "text-primary",
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("p-2.5 rounded-lg", iconColor === "text-primary" ? "bg-primary/10" : "bg-muted")}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}