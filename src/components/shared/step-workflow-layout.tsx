"use client"

import { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StepNavigation } from "./step-navigation"
import { LoadingOverlay } from "./loading-overlay"

export interface StepWorkflowLayoutProps {
  stepInfo: Record<number, { title: string; subtitle: string }>
  currentStep: number
  onStepClick: (step: number) => void
  onReset: () => void
  resetLabel: string
  children: ReactNode
  loadingOverlay?: {
    isLoading: boolean
    title: string
    description: string
  }
}

export const stepAnimationConfig = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: {
    duration: 0.4,
    ease: [0.4, 0.0, 0.2, 1] as const
  }
}

export function StepWorkflowLayout({
  stepInfo,
  currentStep,
  onStepClick,
  onReset,
  resetLabel,
  children,
  loadingOverlay
}: StepWorkflowLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-0 lg:-mt-0">
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
        <StepNavigation
          steps={stepInfo}
          currentStep={currentStep}
          onStepClick={onStepClick}
          onReset={onReset}
          resetLabel={resetLabel}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
            {children}
          </div>
        </div>
      </div>

      {loadingOverlay && (
        <LoadingOverlay
          isLoading={loadingOverlay.isLoading}
          title={loadingOverlay.title}
          description={loadingOverlay.description}
        />
      )}
    </div>
  )
}