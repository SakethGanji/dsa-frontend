import { ResponsiveBoxPlot } from "@nivo/boxplot"
import { cn } from "@/lib/utils"
import type { BoxPlotData } from "../types"

interface BoxPlotProps {
  data: BoxPlotData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function BoxPlot({ 
  data, 
  title, 
  description, 
  className, 
  height = 400 
}: BoxPlotProps) {
  // Transform data for NIVO BoxPlot
  const chartData = data.categories.map((category, index) => {
    const stats = data.data[index]
    return {
      group: category,
      subgroup: category,
      mu: stats.median,
      sd: 1, // Not used but required
      n: 100, // Not used but required
      value: stats.median,
      min: stats.min,
      max: stats.max,
      q1: stats.q1,
      q3: stats.q3,
      median: stats.median,
      outliers: stats.outliers.map(v => ({ value: v }))
    }
  })

  const nivoTheme = {
    text: {
      fontSize: 12,
      fill: 'var(--foreground)',
    },
    axis: {
      ticks: {
        text: {
          fontSize: 11,
          fill: 'var(--muted-foreground)',
        }
      },
      legend: {
        text: {
          fontSize: 12,
          fill: 'var(--foreground)',
        }
      }
    },
    grid: {
      line: {
        stroke: 'var(--border)',
        strokeWidth: 1,
      }
    },
    tooltip: {
      container: {
        background: 'var(--popover)',
        color: 'var(--popover-foreground)',
        fontSize: 12,
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
      }
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
      <div style={{ height }} className="w-full">
        <ResponsiveBoxPlot
          data={chartData}
          margin={{ top: 60, right: 140, bottom: 60, left: 90 }}
          quantiles={[0.25, 0.5, 0.75]}
          whiskerEndSize={0.6}
          theme={nivoTheme}
          colors={['var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-2)']}
          borderRadius={2}
          borderWidth={2}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.3]]
          }}
          medianWidth={2}
          medianColor={{
            from: 'color',
            modifiers: [['darker', 0.8]]
          }}
          whiskerWidth={2}
          whiskerColor={{
            from: 'color',
            modifiers: [['darker', 0.3]]
          }}
          outlierSize={4}
          outlierColor={{
            from: 'color',
            modifiers: [['darker', 0.5]]
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Category',
            legendPosition: 'middle',
            legendOffset: 50
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Value',
            legendPosition: 'middle',
            legendOffset: -70
          }}
          // Custom tooltip removed due to type incompatibility
        />
      </div>
      <div className="text-xs text-muted-foreground">
        <p>Box shows Q1 to Q3 range, line shows median. Whiskers extend to min/max (excluding outliers).</p>
        <p>Individual dots represent outliers (values beyond 1.5 × IQR from Q1/Q3).</p>
      </div>
    </div>
  )
}