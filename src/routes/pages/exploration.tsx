"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"

import PathSelection from "@/components/exploration/path-selection"
import ChooseDataset from "@/components/exploration/choose-dataset"
import ExplorationRuns from "@/components/exploration/exploration-runs"
import TableView from "@/components/exploration/table-view"
import Output from "@/components/exploration/output"

// Define our flow steps
type FlowStep = "path-selection" | "choose-dataset" | "exploration-runs" | "table-view" | "output"

// Define our flow paths
type FlowPath = "new-analysis" | "existing-run"

export function ExplorationPage() {
  // Track current step and selected path
  const [currentStep, setCurrentStep] = useState<FlowStep>("path-selection")
  const [selectedPath, setSelectedPath] = useState<FlowPath | null>(null)

  // Track selected items
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<string | null>(null)

  // Handle path selection
  const selectPath = (path: FlowPath) => {
    setSelectedPath(path)
    if (path === "new-analysis") {
      setCurrentStep("choose-dataset")
    } else {
      setCurrentStep("exploration-runs")
    }
  }

  // Navigation functions
  const goToNextStep = () => {
    if (selectedPath === "new-analysis") {
      if (currentStep === "choose-dataset") setCurrentStep("table-view")
      else if (currentStep === "table-view") setCurrentStep("output")
    } else {
      if (currentStep === "exploration-runs") setCurrentStep("output")
    }
  }

  const goToPreviousStep = () => {
    if (selectedPath === "new-analysis") {
      if (currentStep === "table-view") setCurrentStep("choose-dataset")
      else if (currentStep === "output") setCurrentStep("table-view")
    } else {
      if (currentStep === "output") setCurrentStep("exploration-runs")
    }
  }

  const goToStart = () => {
    setCurrentStep("path-selection")
    setSelectedPath(null)
    setSelectedDataset(null)
    setSelectedRun(null)
  }

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (selectedPath === "new-analysis") {
      switch (currentStep) {
        case "choose-dataset":
          return 33
        case "table-view":
          return 66
        case "output":
          return 100
        default:
          return 0
      }
    } else {
      switch (currentStep) {
        case "exploration-runs":
          return 50
        case "output":
          return 100
        default:
          return 0
      }
    }
  }

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "path-selection":
        return "Select Analysis Type"
      case "choose-dataset":
        return "Choose Dataset"
      case "exploration-runs":
        return "Exploration Runs"
      case "table-view":
        return "Table View"
      case "output":
        return "Output"
    }
  }

  return (
    <PageTransition>
      <div className="container py-6">
        
        {/* Flow container with shadcn styling */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* Header with step indicator */}
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">{getStepTitle()}</h2>
              {selectedPath && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="mr-2">{selectedPath === "new-analysis" ? "New Analysis" : "View Existing Run"}</span>
                  <Button variant="ghost" size="sm" onClick={goToStart} className="text-primary font-medium h-7 px-2">
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {selectedPath && (
              <div className="relative h-1 bg-muted mt-4">
                <motion.div
                  className="absolute h-full bg-primary"
                  initial={{ width: `${getProgressPercentage()}%` }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.3,
                }}
              >
                {currentStep === "path-selection" && <PathSelection onSelectPath={selectPath} />}

                {currentStep === "choose-dataset" && (
                  <ChooseDataset
                    onNext={goToNextStep}
                    selectedDataset={selectedDataset}
                    setSelectedDataset={setSelectedDataset}
                  />
                )}

                {currentStep === "exploration-runs" && (
                  <ExplorationRuns onNext={goToNextStep} selectedRun={selectedRun} setSelectedRun={setSelectedRun} />
                )}

                {currentStep === "table-view" && (
                  <TableView onNext={goToNextStep} onPrevious={goToPreviousStep} datasetId={selectedDataset} />
                )}

                {currentStep === "output" && (
                  <Output
                    onPrevious={goToPreviousStep}
                    source={selectedPath === "new-analysis" ? "dataset" : "run"}
                    sourceId={selectedPath === "new-analysis" ? selectedDataset : selectedRun}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons - only show when not on path selection */}
          {currentStep !== "path-selection" && (
            <div className="flex items-center justify-between p-6 border-t">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === "choose-dataset" || currentStep === "exploration-runs"}
              >
                Back
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={
                  (currentStep === "choose-dataset" && !selectedDataset) ||
                  (currentStep === "exploration-runs" && !selectedRun) ||
                  currentStep === "output"
                }
                className="flex items-center"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}