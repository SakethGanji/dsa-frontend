// API request and response types based on the OpenAPI schema

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// User types
export interface UserCreate {
  soeid: string;
  password: string;
  role_id: number;
}

export interface UserOut {
  id: number;
  soeid: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

// Dataset types
export interface Tag {
  name: string;
  description: string | null;
  id: number;
  usage_count: number | null;
}

export interface Sheet {
  name: string;
  sheet_index: number;
  description: string | null;
  id: number;
  dataset_version_id: number;
  metadata?: SheetMetadata | null;
}

export interface SheetInfo {
  name: string;
  index: number;
  description: string | null;
  id?: number | null;
}

export interface SheetMetadata {
  metadata: Record<string, any>;
  profiling_report_file_id?: number | null;
}

export interface DatasetVersion {
  dataset_id: number;
  parent_version_id?: number | null;
  overlay_file_id?: number | null;
  message?: string | null;
  version_number: number;
  status?: string | null;
  created_by: number;
  id: number;
  materialized_file_id?: number | null;
  created_at: string;
  updated_at: string;
  created_by_soeid?: string | null;
  overlay_file_type?: string | null;
  overlay_file_size?: number | null;
  materialized_file_type?: string | null;
  materialized_file_size?: number | null;
  sheets?: Sheet[] | null;
  // Legacy fields for backward compatibility
  file_id?: number;
  uploaded_by?: number;
  ingestion_timestamp?: string;
  last_updated_timestamp?: string;
  uploaded_by_soeid?: string | null;
  file_type?: string | null;
  file_size?: number | null;
}

export interface Dataset {
  name: string;
  description?: string | null;
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  current_version?: number | null;
  file_type?: string | null;
  file_size?: number | null;
  versions?: DatasetVersion[] | null;
  tags?: Tag[] | null;
}

export interface DatasetUpdate {
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

export interface DatasetUploadResponse {
  dataset_id: number;
  version_id: number;
  sheets: SheetInfo[];
}

// Exploration types
export type ProfileFormat = 'json' | 'html';

export interface ExploreRequest {
  operations: Record<string, any>[];
  sheet?: string | null;
  format?: ProfileFormat;
  run_profiling?: boolean;
}

// Error response type
export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Query parameters types
export interface DatasetListParams {
  limit?: number;
  offset?: number;
  name?: string;
  description?: string;
  created_by?: number;
  tags?: string[];
  sort_by?: string;
  sort_order?: string;
}

export interface SheetDataParams {
  sheet?: string;
  limit?: number;
  offset?: number;
}

// For the file upload multipart/form-data
export interface DatasetUploadParams {
  file: File;
  dataset_id?: number;
  name: string;
  description?: string;
  tags?: string;
}

// Response types with pagination metadata
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Sampling types
export type SamplingMethod = 'random' | 'stratified' | 'systematic' | 'cluster' | 'custom';

export interface SamplingCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value: any;
}

export interface SamplingFilters {
  conditions: SamplingCondition[];
  logic: 'AND' | 'OR';
}

export interface SamplingSelection {
  columns?: string[] | null;
  exclude_columns?: string[] | null;
  order_by?: string | null;
  order_desc?: boolean;
  limit?: number | null;
  offset?: number | null;
}

export interface RandomSamplingParams {
  sample_size: number;
  seed?: number;
}

export interface StratifiedSamplingParams {
  strata_columns: string[];
  sample_size?: number;
  min_per_stratum?: number;
  seed?: number;
}

export interface SystematicSamplingParams {
  interval: number;
  start?: number;
}

export interface ClusterSamplingParams {
  cluster_column: string;
  num_clusters: number;
  sample_within_clusters?: number;
}

export interface CustomSamplingParams {
  query: string;
}

export type SamplingParameters = 
  | RandomSamplingParams 
  | StratifiedSamplingParams 
  | SystematicSamplingParams 
  | ClusterSamplingParams 
  | CustomSamplingParams;

export interface SamplingRequest {
  method: SamplingMethod;
  parameters: SamplingParameters;
  output_name: string;
  filters?: SamplingFilters;
  selection?: SamplingSelection;
}

export interface SamplingResult {
  [key: string]: any;
}

export interface SamplingResponse {
  data: SamplingResult[];
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Multi-round sampling types
export interface DataFilterGroup {
  conditions?: SamplingCondition[];
  groups?: DataFilterGroup[];
  logic: 'AND' | 'OR';
}

export interface DataFilters {
  conditions?: SamplingCondition[];
  groups?: DataFilterGroup[];
  logic: 'AND' | 'OR';
}

export interface MultiRoundSamplingRound {
  round_number: number;
  method: SamplingMethod;
  parameters: SamplingParameters;
  output_name: string;
  filters?: DataFilters;
  selection?: SamplingSelection;
}

export interface MultiRoundSamplingRequest {
  rounds: MultiRoundSamplingRound[];
  export_residual?: boolean;
  residual_output_name?: string;
}

export interface RoundResult {
  round_number: number;
  output_name: string;
  method: string;
  sample_size: number;
  data: SamplingResult[];
  summary?: {
    total_rows: number;
    total_columns: number;
    column_types?: Record<string, string>;
    memory_usage_mb?: number;
    null_counts?: Record<string, number>;
  };
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface MultiRoundSamplingResponse {
  rounds: RoundResult[];
  residual?: {
    output_name: string;
    size: number;
    data: SamplingResult[];
  };
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// New async job types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface StartJobResponse {
  run_id: number | string;
  status: JobStatus;
  message: string;
  // These fields are returned when job completes synchronously
  total_rounds?: number;
  completed_rounds?: number;
  current_round?: number | null;
  round_results?: RoundResultAsync[];
  residual_uri?: string | null;
  residual_size?: number | null;
  residual_summary?: any | null;
  error_message?: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface RoundResultAsync {
  round_number: number;
  method: string;
  sample_size: number;
  output_uri: string;
  preview?: SamplingResult[] | null;
  summary?: {
    total_rows: number;
    total_columns: number;
    column_types?: Record<string, string>;
    memory_usage_mb?: number;
    null_counts?: Record<string, number>;
  } | null;
  started_at?: string;
  completed_at?: string;
}

export interface JobStatusResponse {
  id: string;
  dataset_id: number;
  version_id: number;
  user_id: number;
  status: JobStatus;
  created_at: string;
  total_rounds: number;
  completed_rounds: number;
  current_round: number | null;
  round_results: RoundResultAsync[];
  request: MultiRoundSamplingRequest;
  execution_time_ms?: number | null;
  error_message?: string | null;
  residual_uri?: string | null;
  residual_size?: number | null;
  residual_summary?: {
    total_rows: number;
    total_columns: number;
    [key: string]: any;
  } | null;
}

export interface MergedSampleResponse {
  data: SamplingResult[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  columns: string[];
  summary?: any | null;
  file_path: string;
  job_id: string;
}

export interface MergedSampleExportResponse {
  format: 'csv' | 'json';
  data: string;
  filename: string;
}

// Sampling Run type for history
export interface SamplingRun {
  id: number;
  dataset_id: number;
  dataset_version_id: number;
  dataset_name: string;
  version_number: number;
  user_id: number;
  user_soeid: string;
  run_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  run_timestamp: string;
  execution_time_ms: number;
  notes: string | null;
  output_file_id: number | null;
  output_file_path: string | null;
  output_file_size: number | null;
  run_parameters: {
    request: MultiRoundSamplingRequest;
    job_type: string;
    total_rounds: number;
    completed_rounds: number;
  };
  output_summary: any | null;
}