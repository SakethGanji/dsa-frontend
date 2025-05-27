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
  version_number: number;
  file_id: number;
  uploaded_by: number;
  id: number;
  ingestion_timestamp: string;
  last_updated_timestamp: string;
  uploaded_by_soeid?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  sheets?: Sheet[] | null;
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