import { ResponsiveHeatMap } from "@nivo/heatmap"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import type { HeatmapData } from "../types"

interface HeatmapProps {
  data: HeatmapData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function Heatmap({ 
  data, 
  title, 
  description, 
  className, 
  height = 400 
}: HeatmapProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Validate data
  if (!data || !data.row_labels || !data.col_labels || !data.values) {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          No data available for heatmap
        </div>
      </div>
    )
  }

  // Transform data for NIVO
  const chartData = data.row_labels.map((rowLabel, rowIndex) => ({
    id: rowLabel,
    data: data.col_labels.map((colLabel, colIndex) => ({
      x: colLabel,
      y: data.values[rowIndex]?.[colIndex] ?? 0
    }))
  }))

  const nivoTheme = {
    text: {
      fontSize: 12,
      fill: isDark ? '#e5e7eb' : '#374151',
    },
    axis: {
      ticks: {
        text: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#6b7280',
        }
      },
      legend: {
        text: {
          fontSize: 12,
          fill: isDark ? '#e5e7eb' : '#374151',
        }
      }
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#374151',
        fontSize: 12,
        borderRadius: 4,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    }
  }

  // For correlation matrices, use diverging color scheme
  const isCorrelation = data.min_value === -1 && data.max_value === 1

  // Catch any rendering errors
  try {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div style={{ height }} className="w-full">
          <ResponsiveHeatMap
          data={chartData}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.2f"
          theme={nivoTheme}
          colors={isCorrelation ? {
            type: 'diverging',
            scheme: 'red_blue',
            divergeAt: 0.5,
          } : {
            type: 'sequential',
            scheme: 'blues',
          }}
          emptyColor={isDark ? '#374151' : '#e5e7eb'}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.3]]
          }}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: '',
            legendOffset: 46
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: -72
          }}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 2]]
          }}
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              title: isCorrelation ? 'Correlation →' : 'Value →',
              titleAlign: 'start',
              titleOffset: 4
            }
          ]}
          tooltip={({ cell }) => (
            <div className="bg-popover px-3 py-2 rounded shadow-lg border text-sm">
              <div className="font-medium">{cell.serieId} × {cell.data.x}</div>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: cell.color }}
                />
                <span className="text-muted-foreground">
                  {typeof cell.value === 'number' ? cell.value.toFixed(3) : cell.value}
                </span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
    )
  } catch (error) {
    console.error('Heatmap rendering error:', error)
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to render heatmap</p>
          <p className="text-xs mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }
}