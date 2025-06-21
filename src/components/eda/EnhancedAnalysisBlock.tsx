"use client"

import { Card, CardContent } from "@/components/ui/card"
import { KeyValuePairs } from "./charts/KeyValuePairs"
import { DataTable } from "./charts/DataTable"
import { Histogram } from "./charts/Histogram"
import { BarChart } from "./charts/BarChart"
import { Heatmap } from "./charts/Heatmap"
import { BoxPlot } from "./charts/BoxPlot"
import { AlertList } from "./charts/AlertList"
import { MiniBoxPlot } from "./charts/MiniBoxPlot"
import { RangeChart } from "./charts/RangeChart"
import { DistributionShape } from "./charts/DistributionShape"
import { ViolinPlot } from "./charts/ViolinPlot"
import { DensityPlot } from "./charts/DensityPlot"
import { QQPlot } from "./charts/QQPlot"
import { ProgressBar } from "./charts/ProgressBar"
import { GaugeChart } from "./charts/GaugeChart"
import { BulletChart } from "./charts/BulletChart"
import { DonutChart } from "./charts/DonutChart"
import { HorizontalBarChart } from "./charts/HorizontalBarChart"
import { StackedBarChart } from "./charts/StackedBarChart"
import { Sparkline } from "./charts/Sparkline"
import { MiniBarChart } from "./charts/MiniBarChart"
import { RangePlot } from "./charts/RangePlot"
import { Treemap } from "./charts/Treemap"
import { CalendarHeatmap } from "./charts/CalendarHeatmap"
import { LineChart } from "./charts/LineChart"
import { AreaChart } from "./charts/AreaChart"
import { NetworkGraph } from "./charts/NetworkGraph"
import { ParallelCoordinates } from "./charts/ParallelCoordinates"
import type { AnalysisBlock as AnalysisBlockType, KeyValueData } from "./types"

interface EnhancedAnalysisBlockProps {
  block: AnalysisBlockType
  className?: string
  forceChart?: boolean
}

export function EnhancedAnalysisBlock({ block, className, forceChart = false }: EnhancedAnalysisBlockProps) {
  // Check if this is a KEY_VALUE_PAIRS block that could be enhanced
  if (block.render_as === 'KEY_VALUE_PAIRS' && forceChart) {
    const data = block.data as KeyValueData
    const keys = Object.keys(data)
    
    // Check for quantile statistics pattern
    const hasQuantiles = keys.some(k => k.includes('Percentile') || k.includes('Q1') || k.includes('Q3') || k.includes('Median'))
    const hasDistributionMetrics = keys.some(k => k.includes('Skewness') || k.includes('Kurtosis'))
    const hasRange = keys.some(k => k.includes('Min')) && keys.some(k => k.includes('Max'))
    
    if (hasQuantiles) {
      // Extract quantile data
      const quantileData = {
        min: data['Min'] as number || 0,
        q1: data['Q1 (25th Percentile)'] as number || data['Q1'] as number || 0,
        median: data['Median (50th Percentile)'] as number || data['Median'] as number || 0,
        q3: data['Q3 (75th Percentile)'] as number || data['Q3'] as number || 0,
        max: data['Max'] as number || 0,
        p5: data['5th Percentile'] as number,
        p95: data['95th Percentile'] as number
      }
      
      return (
        <div className={className}>
          <MiniBoxPlot 
            data={quantileData}
            title={block.title}
            description={block.description}
            color="blue"
          />
        </div>
      )
    }
    
    if (hasDistributionMetrics && data['Skewness'] && data['Kurtosis']) {
      return (
        <div className={className}>
          <DistributionShape
            skewness={data['Skewness'] as number}
            kurtosis={data['Kurtosis'] as number}
            title="Distribution Shape"
            description="Visual representation of skewness and kurtosis"
            color="purple"
          />
        </div>
      )
    }
    
    if (hasRange && data['Min'] !== undefined && data['Max'] !== undefined) {
      const mean = data['Mean'] as number
      return (
        <div className={className}>
          <RangeChart
            min={data['Min'] as number}
            max={data['Max'] as number}
            value={mean}
            title="Value Range"
            description={`Range: ${data['Range'] || ((data['Max'] as number) - (data['Min'] as number))}`}
            color="green"
          />
        </div>
      )
    }
  }
  
  // Default rendering logic
  const renderChart = () => {
    switch (block.render_as) {
      case 'KEY_VALUE_PAIRS':
        return (
          <KeyValuePairs 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'TABLE':
        return (
          <DataTable 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'HISTOGRAM':
        return (
          <Histogram 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'BAR_CHART':
        return (
          <BarChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'HEATMAP':
        return (
          <Heatmap 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'BOX_PLOT':
        return (
          <BoxPlot 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'ALERT_LIST':
        return (
          <AlertList 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'VIOLIN_PLOT':
        return (
          <ViolinPlot 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'DENSITY_PLOT':
        return (
          <DensityPlot 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'QQ_PLOT':
        return (
          <QQPlot 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'PROGRESS_BAR':
        return (
          <ProgressBar 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'GAUGE_CHART':
        return (
          <GaugeChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'BULLET_CHART':
        return (
          <BulletChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'DONUT_CHART':
        return (
          <DonutChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'HORIZONTAL_BAR_CHART':
        return (
          <HorizontalBarChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'STACKED_BAR_CHART':
        return (
          <StackedBarChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'SPARKLINE':
        return (
          <Sparkline 
            data={block.data} 
            title={block.title}
          />
        )
      
      case 'MINI_BAR_CHART':
        return (
          <MiniBarChart 
            data={block.data} 
            title={block.title}
          />
        )
      
      case 'RANGE_PLOT':
        return (
          <RangePlot 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'TREEMAP':
        return (
          <Treemap 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'CALENDAR_HEATMAP':
        return (
          <CalendarHeatmap 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'LINE_CHART':
        return (
          <LineChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'AREA_CHART':
        return (
          <AreaChart 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'NETWORK_GRAPH':
        return (
          <NetworkGraph 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      case 'PARALLEL_COORDINATES':
        return (
          <ParallelCoordinates 
            data={block.data} 
            title={block.title}
            description={block.description}
          />
        )
      
      default:
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Unknown render type: {block.render_as}
              </p>
              <pre className="mt-2 text-xs">
                {JSON.stringify(block.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className={className}>
      {renderChart()}
    </div>
  )
}