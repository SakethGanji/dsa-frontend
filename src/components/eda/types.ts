export type RenderType = 
  | 'KEY_VALUE_PAIRS' 
  | 'TABLE' 
  | 'HISTOGRAM' 
  | 'BAR_CHART' 
  | 'HEATMAP' 
  | 'BOX_PLOT' 
  | 'ALERT_LIST'
  | 'VIOLIN_PLOT'
  | 'DENSITY_PLOT'
  | 'QQ_PLOT'
  | 'PROGRESS_BAR'
  | 'GAUGE_CHART'
  | 'BULLET_CHART'
  | 'DONUT_CHART'
  | 'HORIZONTAL_BAR_CHART'
  | 'STACKED_BAR_CHART'
  | 'SPARKLINE'
  | 'MINI_BAR_CHART'
  | 'RANGE_PLOT'
  | 'TREEMAP'
  | 'CALENDAR_HEATMAP'
  | 'LINE_CHART'
  | 'AREA_CHART'
  | 'RISK_MATRIX'
  | 'NETWORK_GRAPH'
  | 'PARALLEL_COORDINATES'

export interface AnalysisBlock {
  title: string
  render_as: RenderType
  data: any
  description?: string
}

export interface KeyValueData {
  [key: string]: string | number
}

export interface TableData {
  columns: string[]
  rows: (string | number)[][]
}

export interface HistogramData {
  bins: {
    min: number
    max: number
    count: number
  }[]
  total_count: number
}

export interface BarChartData {
  categories: string[]
  values: number[]
  labels?: string[] | null
}

export interface HeatmapData {
  row_labels: string[]
  col_labels: string[]
  values: number[][]
  min_value: number
  max_value: number
}

export interface BoxPlotData {
  categories: string[]
  data: {
    min: number
    q1: number
    median: number
    q3: number
    max: number
    outliers: number[]
  }[]
}

export interface Alert {
  column: string | null
  alert_type: string
  severity: 'INFO' | 'WARNING' | 'ERROR'
  message: string
  details: Record<string, any>
}

export interface AlertListData {
  alerts: Alert[]
}

// New visualization data types
export interface ViolinPlotData {
  categories: string[]
  data: {
    min: number
    q1: number
    median: number
    q3: number
    max: number
    values: number[]
  }[]
}

export interface DensityPlotData {
  x_values: number[]
  y_values: number[]
  label: string
}

export interface QQPlotData {
  theoretical_quantiles: number[]
  sample_quantiles: number[]
  reference_line: {
    slope: number
    intercept: number
  }
}

export interface ProgressBarData {
  value: number
  max_value: number
  label: string
  color?: string
  show_percentage?: boolean
}

export interface GaugeChartData {
  value: number
  min_value: number
  max_value: number
  thresholds?: {
    value: number
    color: string
  }[]
  label: string
}

export interface BulletChartData {
  value: number
  target: number
  ranges: {
    min: number
    max: number
    label: string
  }[]
  label: string
}

export interface DonutChartData {
  labels: string[]
  values: number[]
  center_text?: string
}

export interface HorizontalBarChartData {
  categories: string[]
  values: number[]
}

export interface StackedBarChartData {
  categories: string[]
  series: {
    name: string
    values: number[]
  }[]
}

export interface SparklineData {
  values: number[]
  show_dots?: boolean
  show_area?: boolean
}

export interface MiniBarChartData {
  values: number[]
  labels: string[]
  max_bars?: number
}

export interface RangePlotData {
  categories: string[]
  ranges: {
    min: number
    max: number
    mean: number
    median: number
  }[]
}

export interface TreemapData {
  data: TreemapNode[]
}

export interface TreemapNode {
  name: string
  value: number
  children?: TreemapNode[]
}

export interface CalendarHeatmapData {
  data: {
    date: string
    value: number
  }[]
  start_date: string
  end_date: string
}

export interface LineChartData {
  x_values: string[]
  series: {
    name: string
    y_values: number[]
  }[]
}

export interface AreaChartData {
  x_values: string[]
  series: {
    name: string
    y_values: number[]
  }[]
  stacked?: boolean
}

export interface RiskMatrixData {
  items: {
    x: number
    y: number
    value: number
    label: string
  }[]
  likelihood_labels: string[]
  impact_labels: string[]
}

export interface NetworkGraphData {
  nodes: {
    id: string
    label: string
    group?: string
  }[]
  edges: {
    source: string
    target: string
    weight?: number
    value?: number
    color?: string
  }[]
}

export interface ParallelCoordinatesData {
  dimensions: {
    label: string
    values: number[]
    min: number
    max: number
  }[]
  data: Record<string, number>[]
}

export interface VariableInfo {
  name: string
  type: 'NUMERIC' | 'CATEGORICAL' | 'DATETIME' | 'TEXT' | 'BOOLEAN'
  dtype: string
}

export interface VariableAnalysis {
  common_info: VariableInfo
  analyses: AnalysisBlock[]
}

export interface EDAResponse {
  metadata: {
    dataset_id: number
    version_id: number
    analysis_timestamp: string
    sample_size_used: number
    total_rows: number
    total_columns: number
    analysis_duration_seconds: number
  }
  global_summary: AnalysisBlock[]
  variables: Record<string, VariableAnalysis>
  interactions: AnalysisBlock[]
  alerts: AnalysisBlock[]
}