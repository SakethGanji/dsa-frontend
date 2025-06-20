import { Card, CardContent } from "@/components/ui/card"
import { KeyValuePairs } from "./charts/KeyValuePairs"
import { DataTable } from "./charts/DataTable"
import { Histogram } from "./charts/Histogram"
import { BarChart } from "./charts/BarChart"
import { SimpleHeatmap } from "./charts/SimpleHeatmap"
import { BoxPlot } from "./charts/BoxPlot"
import { AlertList } from "./charts/AlertList"
import type { AnalysisBlock as AnalysisBlockType } from "./types"

interface AnalysisBlockProps {
  block: AnalysisBlockType
  className?: string
}

export function AnalysisBlock({ block, className }: AnalysisBlockProps) {
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
          <SimpleHeatmap 
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