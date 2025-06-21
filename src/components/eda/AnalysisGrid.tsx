"use client"

import { cn } from "@/lib/utils"
import { EnhancedAnalysisBlock } from "./EnhancedAnalysisBlock"
import type { AnalysisBlock } from "./types"

interface ExtendedAnalysisBlock extends AnalysisBlock {
  forceChart?: boolean
}

interface AnalysisGridProps {
  blocks: ExtendedAnalysisBlock[]
  className?: string
}

// Define layout configurations for different chart types
const LAYOUT_CONFIG: Record<string, { cols: number; height?: string }> = {
  // Compact visualizations - 3-4 columns
  PROGRESS_BAR: { cols: 2, height: "h-32" },
  GAUGE_CHART: { cols: 2, height: "h-64" },
  BULLET_CHART: { cols: 2, height: "h-40" },
  SPARKLINE: { cols: 3, height: "h-24" },
  MINI_BAR_CHART: { cols: 3, height: "h-40" },
  KEY_VALUE_PAIRS: { cols: 2, height: "h-auto" },
  
  // Medium visualizations - 2 columns
  DONUT_CHART: { cols: 2, height: "h-80" },
  HORIZONTAL_BAR_CHART: { cols: 2, height: "h-80" },
  RANGE_PLOT: { cols: 2, height: "h-64" },
  DENSITY_PLOT: { cols: 2, height: "h-80" },
  QQ_PLOT: { cols: 2, height: "h-96" },
  
  // Large visualizations - full width
  HISTOGRAM: { cols: 1, height: "h-80" },
  BAR_CHART: { cols: 1, height: "h-96" },
  BOX_PLOT: { cols: 1, height: "h-96" },
  VIOLIN_PLOT: { cols: 1, height: "h-96" },
  HEATMAP: { cols: 1, height: "h-[500px]" },
  STACKED_BAR_CHART: { cols: 1, height: "h-96" },
  LINE_CHART: { cols: 1, height: "h-96" },
  AREA_CHART: { cols: 1, height: "h-96" },
  TREEMAP: { cols: 1, height: "h-[500px]" },
  CALENDAR_HEATMAP: { cols: 1, height: "h-64" },
  
  // Tables and lists
  TABLE: { cols: 1, height: "h-auto" },
  ALERT_LIST: { cols: 1, height: "h-auto" },
}

export function AnalysisGrid({ blocks, className }: AnalysisGridProps) {
  // Group blocks by their layout requirements
  const groupedBlocks = blocks.reduce((acc, block, index) => {
    const config = LAYOUT_CONFIG[block.render_as] || { cols: 1, height: "h-96" }
    const key = `${config.cols}-${config.height}`
    
    if (!acc[key]) {
      acc[key] = []
    }
    
    acc[key].push({ block, index, config })
    return acc
  }, {} as Record<string, Array<{ block: AnalysisBlock; index: number; config: typeof LAYOUT_CONFIG[string] }>>)

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedBlocks).map(([key, items]) => {
        const { cols } = items[0].config
        
        // For single column items, render them directly
        if (cols === 1) {
          return items.map(({ block, index }) => (
            <div key={index} className="w-full">
              <EnhancedAnalysisBlock 
                block={block} 
                forceChart={block.forceChart}
              />
            </div>
          ))
        }
        
        // For multi-column items, create a grid
        return (
          <div
            key={key}
            className={cn(
              "grid gap-4",
              cols === 2 && "grid-cols-1 md:grid-cols-2",
              cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
              cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}
          >
            {items.map(({ block, index }) => (
              <div key={index} className="w-full">
                <EnhancedAnalysisBlock 
                  block={block} 
                  forceChart={block.forceChart}
                />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Helper function to determine optimal layout for a set of blocks
export function createOptimalLayout(blocks: AnalysisBlock[]): AnalysisBlock[][] {
  const groups: AnalysisBlock[][] = []
  let currentGroup: AnalysisBlock[] = []
  let currentCols = 0
  
  blocks.forEach(block => {
    const config = LAYOUT_CONFIG[block.render_as] || { cols: 1 }
    const requiredCols = 4 / config.cols // Convert to 4-column grid
    
    if (currentCols + requiredCols > 4) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [block]
      currentCols = requiredCols
    } else {
      currentGroup.push(block)
      currentCols += requiredCols
    }
  })
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }
  
  return groups
}