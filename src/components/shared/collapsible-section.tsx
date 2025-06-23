import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  icon: LucideIcon
  title: string
  description?: string
  defaultExpanded?: boolean
  expandedBadge?: string
  children: React.ReactNode
  className?: string
  onToggle?: (expanded: boolean) => void
}

export function CollapsibleSection({
  icon: Icon,
  title,
  description,
  defaultExpanded = false,
  expandedBadge = "Expanded",
  children,
  className,
  onToggle
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(newExpanded)
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        isExpanded ? "shadow-lg ring-1 ring-primary/10" : "hover:shadow-md",
        className
      )}
    >
      <CardHeader 
        className="cursor-pointer select-none group"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              isExpanded ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "w-5 h-5 transition-colors duration-200",
                isExpanded ? "text-primary" : "text-muted-foreground"
              )} />
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
            {isExpanded && expandedBadge && (
              <Badge variant="secondary" className="text-xs">
                {expandedBadge}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 group-hover:bg-accent"
            >
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !isExpanded && "rotate-[-90deg]"
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <CardContent className="pt-6">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}