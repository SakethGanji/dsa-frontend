"use client"

import { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { stepAnimationConfig } from "./step-workflow-layout"

interface AnimatedStepProps {
  show: boolean
  delay?: number
  children: ReactNode
  layout?: boolean
}

export function AnimatedStep({ show, delay = 0, children, layout = true }: AnimatedStepProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={stepAnimationConfig.initial}
          animate={stepAnimationConfig.animate}
          exit={stepAnimationConfig.exit}
          transition={{
            ...stepAnimationConfig.transition,
            delay
          }}
          layout={layout}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}