import { cn } from "@/lib/utils"
import type { HeatmapData } from "../types"

interface SimpleHeatmapProps {
  data: HeatmapData
  title?: string
  description?: string
  className?: string
}

export function SimpleHeatmap({ 
  data, 
  title, 
  description, 
  className 
}: SimpleHeatmapProps) {
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

  const isCorrelation = data.min_value === -1 && data.max_value === 1
  
  // Function to get color based on value
  const getColor = (value: number) => {
    if (isCorrelation) {
      // For correlations: red (negative) -> white (0) -> blue (positive)
      if (value < 0) {
        const intensity = Math.abs(value)
        return `hsl(var(--destructive) / ${intensity * 0.8})`
      } else {
        const intensity = value
        return `hsl(var(--primary) / ${intensity * 0.8})`
      }
    } else {
      // For other data: light -> dark blue
      const normalized = (value - data.min_value) / (data.max_value - data.min_value)
      return `hsl(var(--primary) / ${normalized * 0.8})`
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-muted-foreground"></th>
              {data.col_labels.map((col, idx) => (
                <th 
                  key={idx} 
                  className="p-2 text-xs font-medium text-muted-foreground text-center min-w-[60px]"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  title={col}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.row_labels.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 text-xs font-medium text-muted-foreground text-right pr-4">
                  {row}
                </td>
                {data.col_labels.map((col, colIdx) => {
                  const value = data.values[rowIdx]?.[colIdx] ?? 0
                  return (
                    <td 
                      key={colIdx}
                      className="p-0 border border-border/50"
                    >
                      <div 
                        className="w-full h-full p-2 text-xs text-center font-medium relative group cursor-default"
                        style={{ 
                          backgroundColor: getColor(value),
                          color: Math.abs(value) > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                        }}
                      >
                        {value.toFixed(2)}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-xs z-10">
                          {row} × {col}: {value.toFixed(3)}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
        <div className="flex items-center gap-2">
          <span>{data.min_value.toFixed(2)}</span>
          <div className="w-32 h-4 rounded border border-border" style={{
            background: isCorrelation 
              ? 'linear-gradient(to right, hsl(var(--destructive) / 0.8), hsl(var(--background)), hsl(var(--primary) / 0.8))'
              : 'linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.8))'
          }} />
          <span>{data.max_value.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}