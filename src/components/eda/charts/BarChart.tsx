import { ResponsiveBar } from "@nivo/bar"
import { cn } from "@/lib/utils"
import type { BarChartData } from "../types"

interface BarChartProps {
  data: BarChartData
  title?: string
  description?: string
  className?: string
  height?: number
  layout?: 'vertical' | 'horizontal'
}

export function BarChart({ 
  data, 
  title, 
  description, 
  className, 
  height = 300,
  layout = 'vertical'
}: BarChartProps) {
  // Transform data for NIVO
  const chartData = data.categories.map((category, index) => ({
    category,
    value: data.values[index],
    label: data.labels?.[index] || ''
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

  const isHorizontal = layout === 'horizontal'

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
          keys={['value']}
          indexBy="category"
          layout={layout}
          margin={{ 
            top: 20, 
            right: isHorizontal ? 80 : 30, 
            bottom: isHorizontal ? 50 : 80, 
            left: isHorizontal ? 120 : 60 
          }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={['var(--chart-2)']}
          theme={nivoTheme}
          axisBottom={isHorizontal ? {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Value',
            legendPosition: 'middle',
            legendOffset: 40
          } : {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legendPosition: 'middle',
            legendOffset: 70
          }}
          axisLeft={isHorizontal ? {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendPosition: 'middle',
            legendOffset: -100
          } : {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Value',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          enableLabel={true}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          enableGridY={!isHorizontal}
          enableGridX={isHorizontal}
          tooltip={({ indexValue, value, data }) => (
            <div className="bg-popover px-3 py-2 rounded-md shadow-lg border border-border text-sm">
              <div className="font-medium text-popover-foreground">{indexValue}</div>
              <div className="text-muted-foreground">
                Value: {value?.toLocaleString()}
              </div>
              {data.label && (
                <div className="text-muted-foreground text-xs mt-1">
                  {data.label}
                </div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  )
}