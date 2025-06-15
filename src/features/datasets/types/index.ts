export interface DatasetFeatureConfig {
  enableVersioning?: boolean;
  enableTags?: boolean;
  enableSharing?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export interface DatasetFilter {
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  owner?: string;
  status?: 'active' | 'archived' | 'processing';
}

export interface DatasetSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'size';
  order: 'asc' | 'desc';
}

export interface DatasetViewState {
  view: 'grid' | 'list' | 'table';
  filters: DatasetFilter;
  sort: DatasetSort;
  selectedIds: Set<number>;
}

export interface DatasetActions {
  onCreate: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onShare: (id: number) => void;
  onArchive: (id: number) => void;
  onViewDetails: (id: number) => void;
}