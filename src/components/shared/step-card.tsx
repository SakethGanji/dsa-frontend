"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StepCardProps {
  isActive: boolean
  isCompleted: boolean
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
  headerContent?: ReactNode
  iconGradient?: string
}

export function StepCard({
  isActive,
  isCompleted,
  icon: Icon,
  title,
  description,
  children,
  headerContent,
  iconGradient = "from-primary to-primary/80"
}: StepCardProps) {
  return (
    <Card
      className={`transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-primary/40 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 ring-1 ring-primary/20"
          : isCompleted
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
                isCompleted
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                  : isActive
                    ? `bg-gradient-to-br ${iconGradient} text-primary-foreground shadow-lg shadow-primary/30`
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </motion.div>
            <div>
              <CardTitle className="text-xl font-semibold">{title}</CardTitle>
              <CardDescription className="text-sm mt-0.5">{description}</CardDescription>
            </div>
          </div>
          {headerContent}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}