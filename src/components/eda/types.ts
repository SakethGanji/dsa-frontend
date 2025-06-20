export type RenderType = 
  | 'KEY_VALUE_PAIRS' 
  | 'TABLE' 
  | 'HISTOGRAM' 
  | 'BAR_CHART' 
  | 'HEATMAP' 
  | 'BOX_PLOT' 
  | 'ALERT_LIST'

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