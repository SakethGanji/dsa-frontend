# Sampling Page Design

## Overview

The sampling page provides a comprehensive interface for creating and managing data samples from datasets. Users can perform multi-round sampling with various techniques while maintaining full visibility of sampling history.

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Sampling Dashboard                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Dataset & Version Selection                    │   │
│  │  Dataset: [Product Inventory ▼]   Version: [v1.0 (Latest) ▼]    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Sampling History                            │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Sample Name │ Technique │ Version │ User │ Created At   │   │   │
│  │  ├─────────────┼───────────┼─────────┼──────┼─────────────┤   │   │
│  │  │ Q4_Sample   │ Stratified│ v1.0    │ bg547│ 2025-06-22  │   │   │
│  │  │ Random_1k   │ Random    │ v1.0    │ jd123│ 2025-06-21  │   │   │
│  │  │ Regional    │ Cluster   │ v1.0    │ bg547│ 2025-06-20  │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  │  [+ New Sample]  [View Details]  [Download]  [Compare]         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Create New Sample                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │   │
│  │  │ Configure     │  │ Preview       │  │ Results       │      │   │
│  │  │ Sampling      │→ │ & Confirm     │→ │ & Export      │      │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Main Container: `SamplingDashboard`
The root component that manages the overall page state and layout.

```typescript
interface SamplingDashboardProps {
  datasetId?: number;
  versionId?: number;
}

interface SamplingDashboardState {
  selectedDataset: Dataset | null;
  selectedVersion: DatasetVersion | null;
  samplingHistory: SamplingRun[];
  isCreatingNew: boolean;
  selectedSample: SamplingRun | null;
}
```

### 2. Dataset Selection Bar: `DatasetVersionSelector`
A persistent top bar for dataset and version selection.

```typescript
interface DatasetVersionSelectorProps {
  selectedDataset: Dataset | null;
  selectedVersion: DatasetVersion | null;
  onDatasetChange: (dataset: Dataset) => void;
  onVersionChange: (version: DatasetVersion) => void;
}
```

### 3. Sampling History Table: `SamplingHistoryTable`
Displays all sampling runs for the selected dataset with filtering and sorting.

```typescript
interface SamplingHistoryTableProps {
  datasetId: number;
  versionId?: number;
  onSampleSelect: (sample: SamplingRun) => void;
  onNewSample: () => void;
}

interface SamplingRun {
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
  output_summary: any;
}
```

### 4. Sampling Creation Workflow: `SamplingCreationFlow`
A streamlined 3-step process for creating new samples.

```typescript
interface SamplingCreationFlowProps {
  datasetId: number;
  versionId: number;
  onComplete: (jobId: string) => void;
  onCancel: () => void;
}

type CreationStep = 'configure' | 'preview' | 'results';
```

## Detailed Component Designs

### Sampling History Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Sampling History                                              [Refresh] │
├─────────────────────────────────────────────────────────────────────────┤
│ Filters: [All Statuses ▼] [All Users ▼] [Date Range ▼]    Search: [___]│
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────┬─────────────┬───────────┬─────────┬────────┬─────────────────┐│
│ │ □   │ Sample Name │ Technique │ Version │ User   │ Created At      ││
│ ├─────┼─────────────┼───────────┼─────────┼────────┼─────────────────┤│
│ │ □   │ Q4_Analysis │ Stratified│ v1.0    │ bg5467 │ 2025-06-22 14:30││
│ │     │             │ (2 rounds)│         │        │ ✓ Completed     ││
│ ├─────┼─────────────┼───────────┼─────────┼────────┼─────────────────┤│
│ │ □   │ Random_1000 │ Random    │ v1.0    │ jd1234 │ 2025-06-21 10:15││
│ │     │             │ (1 round) │         │        │ ✓ Completed     ││
│ ├─────┼─────────────┼───────────┼─────────┼────────┼─────────────────┤│
│ │ □   │ Regional_Q3 │ Cluster   │ v1.0    │ bg5467 │ 2025-06-20 16:45││
│ │     │             │ (3 rounds)│         │        │ ⚡ Running      ││
│ └─────┴─────────────┴───────────┴─────────┴────────┴─────────────────┘│
│                                                                          │
│ Selected: 0 items   [View] [Download] [Compare] [Delete]               │
│ Page 1 of 5         [< Previous] [1] [2] [3] [4] [5] [Next >]         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sampling Creation Flow

#### Step 1: Configure Sampling
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Configure Multi-Round Sampling                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Sample Name: [_________________________]                               │
│                                                                          │
│ ┌─ Round 1 ──────────────────────────────────────────────────────────┐ │
│ │ Method: [Random ▼]                                                  │ │
│ │ Sample Size: [1000___] □ Use percentage                            │ │
│ │ Seed: [42____] (optional)                                          │ │
│ │ Output Name: [round_1_random]                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ [+ Add Round]                                                           │
│                                                                          │
│ □ Export residual data                                                  │
│ Residual Output Name: [final_residual]                                 │
│                                                                          │
│ Dataset Info:                                                           │
│ • Total Rows: 10,000                                                    │
│ • Columns: product, quantity, price, category                          │
│                                                                          │
│ [Cancel]                                        [Preview →]             │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 2: Preview & Confirm
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Preview Sampling Configuration                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Summary:                                                                │
│ • Dataset: Product Inventory v1.0                                       │
│ • Total Rounds: 2                                                       │
│ • Estimated Samples: 1,500                                             │
│ • Residual Export: Yes                                                 │
│                                                                          │
│ Rounds:                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 1. Random Sampling                                                  ││
│ │    • Size: 1,000 rows                                              ││
│ │    • Seed: 42                                                      ││
│ │    • Output: round_1_random.parquet                               ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ 2. Stratified Sampling                                             ││
│ │    • Size: 500 rows                                               ││
│ │    • Strata: category                                             ││
│ │    • Output: round_2_stratified.parquet                           ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ [← Back]                                      [Execute Sampling]        │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 3: Results & Export
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Sampling Results                                              ✓ Complete│
├─────────────────────────────────────────────────────────────────────────┤
│ Execution Summary:                                                      │
│ • Status: Completed                                                     │
│ • Duration: 2.3 seconds                                                │
│ • Total Samples: 1,500                                                │
│                                                                          │
│ Round Results:                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Round │ Method     │ Samples │ File Size │ Status                  ││
│ ├───────┼────────────┼─────────┼───────────┼─────────────────────────┤│
│ │ 1     │ Random     │ 1,000   │ 245 KB    │ ✓ Completed            ││
│ │ 2     │ Stratified │ 500     │ 122 KB    │ ✓ Completed            ││
│ │ Resid.│ -          │ 8,500   │ 2.1 MB    │ ✓ Exported             ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ Sample Preview:                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ product      │ quantity │ price   │ category                      ││
│ ├──────────────┼──────────┼─────────┼───────────────────────────────┤│
│ │ Laptop       │ 10       │ 999.99  │ Electronics                   ││
│ │ Mouse        │ 50       │ 25.99   │ Accessories                   ││
│ │ Keyboard     │ 30       │ 45.99   │ Accessories                   ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ [New Sample]  [Download All]  [Download Merged]  [View in Workbench]  │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Integration

### Required Endpoints

1. **Get Sampling History**
   - `GET /api/sampling/dataset/{dataset_id}/samplings`
   - `GET /api/sampling/dataset-version/{version_id}/samplings`

2. **Create New Sample**
   - `POST /api/sampling/{dataset_id}/{version_id}/multi-round/run`

3. **Monitor Job Progress**
   - `GET /api/sampling/multi-round/jobs/{job_id}`

4. **Get Results**
   - `GET /api/sampling/multi-round/jobs/{job_id}/merged-sample`

5. **Dataset Information**
   - `GET /api/datasets/{dataset_id}/versions/latest`
   - `GET /api/sampling/{dataset_id}/{version_id}/columns`

## State Management

### Global State (Context)
```typescript
interface SamplingContext {
  // Current selections
  selectedDataset: Dataset | null;
  selectedVersion: DatasetVersion | null;
  
  // History
  samplingHistory: SamplingRun[];
  historyLoading: boolean;
  historyError: Error | null;
  
  // Active job
  activeJob: {
    id: string;
    status: JobStatus;
    progress: number;
  } | null;
  
  // Actions
  refreshHistory: () => void;
  selectSample: (sampleId: number) => void;
  startNewSample: () => void;
}
```

### Local Component State
- Form values and validation
- UI state (expanded/collapsed sections)
- Pagination and filtering

## User Flow

### View Sampling History
1. User selects dataset from dropdown
2. System loads all versions and sampling history
3. User can filter/sort history table
4. User can select samples to view details or compare

### Create New Sample
1. User clicks "New Sample" button
2. Configure sampling rounds (method, parameters)
3. Preview configuration and estimated output
4. Execute sampling (shows progress)
5. View and export results

### Compare Samples
1. User selects multiple samples from history
2. Opens comparison view showing:
   - Configuration differences
   - Statistical summaries
   - Sample overlap analysis

## Key Features

### 1. Smart Defaults
- Auto-suggest sample names based on method and date
- Remember user's last configuration
- Preset templates for common sampling strategies

### 2. Real-time Validation
- Validate sample size against dataset size
- Check column existence for stratified sampling
- Warn about potential memory issues

### 3. Progress Monitoring
- Real-time progress bar for each round
- Estimated time remaining
- Ability to cancel long-running jobs

### 4. Export Options
- Download individual rounds
- Download merged sample
- Export to various formats (CSV, JSON, Parquet)
- Copy sample query to clipboard

### 5. History Management
- Search and filter history
- Bulk operations (delete, export)
- Version comparison
- Audit trail with user and timestamp

## Error Handling

### Common Error Scenarios
1. **Dataset Access Denied**
   - Show permission error message
   - Suggest contacting dataset owner

2. **Sampling Job Failed**
   - Display error details
   - Offer retry with modified parameters
   - Save failed configuration for debugging

3. **Network Issues**
   - Implement retry logic
   - Show offline indicator
   - Queue actions for when connection restored

## Performance Considerations

1. **Lazy Loading**
   - Load history in pages
   - Virtualize long tables
   - Load sample previews on demand

2. **Caching**
   - Cache dataset metadata
   - Cache recent sampling results
   - Implement smart cache invalidation

3. **Optimistic Updates**
   - Show job as started immediately
   - Update progress without full refresh
   - Handle rollback on failure

## Accessibility

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Keyboard shortcuts for common actions
   - Focus management in modals

2. **Screen Reader Support**
   - Descriptive labels and ARIA attributes
   - Announce status changes
   - Provide text alternatives for visual indicators

3. **Color and Contrast**
   - Meet WCAG AA standards
   - Don't rely solely on color
   - Provide high contrast mode

## Implementation Guidelines

### Phase 1: Core Functionality
1. Dataset/version selection
2. Basic sampling history table
3. Simple single-round sampling

### Phase 2: Enhanced Features
1. Multi-round sampling configuration
2. Advanced filtering and search
3. Progress monitoring

### Phase 3: Advanced Features
1. Sample comparison
2. Templates and presets
3. Batch operations
4. Export to multiple formats

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **UI Components**: Shadcn/ui
- **State Management**: React Context + TanStack Query
- **Styling**: Tailwind CSS
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## Security Considerations

1. **Authentication**
   - Verify user permissions for dataset access
   - Implement row-level security for samples

2. **Data Protection**
   - Encrypt sensitive data in transit
   - Implement audit logging
   - Respect data retention policies

3. **Input Validation**
   - Validate all user inputs
   - Prevent SQL injection in custom queries
   - Limit resource consumption

## Future Enhancements

1. **AI-Assisted Sampling**
   - Recommend sampling strategies based on data characteristics
   - Auto-detect optimal sample sizes

2. **Collaborative Features**
   - Share sampling configurations
   - Comment on samples
   - Team templates

3. **Advanced Analytics**
   - Statistical quality metrics
   - Bias detection
   - Sample representativeness scores

4. **Integration**
   - Export to ML platforms
   - Pipeline integration
   - Scheduling and automation