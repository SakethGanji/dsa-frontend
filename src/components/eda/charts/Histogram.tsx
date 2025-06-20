import { ResponsiveBar } from "@nivo/bar"
import { cn } from "@/lib/utils"
import type { HistogramData } from "../types"

interface HistogramProps {
  data: HistogramData
  title?: string
  description?: string
  className?: string
  height?: number
}

export function Histogram({ 
  data, 
  title, 
  description, 
  className, 
  height = 300 
}: HistogramProps) {
  // Transform data for NIVO
  const chartData = data.bins.map((bin) => ({
    bin: `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`,
    count: bin.count,
    percentage: ((bin.count / data.total_count) * 100).toFixed(1)
  }))

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
        <ResponsiveBar
          data={chartData}
          keys={['count']}
          indexBy="bin"
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={['var(--chart-1)']}
          theme={nivoTheme}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Value Range',
            legendPosition: 'middle',
            legendOffset: 50
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          enableLabel={false}
          enableGridY={true}
          tooltip={({ indexValue, value, data }) => (
            <div className="bg-popover px-3 py-2 rounded-md shadow-lg border border-border text-sm">
              <div className="font-medium text-popover-foreground">{indexValue}</div>
              <div className="text-muted-foreground">
                Count: {value?.toLocaleString()}
              </div>
              <div className="text-muted-foreground">
                Percentage: {data.percentage}%
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}