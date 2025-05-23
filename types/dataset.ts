// src/types/dataset.ts
import { Dataset as ApiDataset, Tag } from './api';

// Original Dataset interface for backwards compatibility
export interface Dataset {
    id: number;
    title: string;
    description: string;
    type: string;
    size: string;
    lastUpdated: string;
    tags: string[];
    version: string;
    downloads: number;
    uploader: string;
}

// Re-export API types for backwards compatibility
export type { Tag } from './api';
export type { DatasetVersion } from './api';

// Alias the API Dataset type as DatasetResponse for backwards compatibility
export type DatasetResponse = ApiDataset;

// For use in the component that expects a different format
export interface DatasetInfo {
    id: number;
    name: string;
    description: string;
    version: string;
    fileType: string;
    fileSize: string;
    lastUpdatedTimestamp: string;
    uploader: string;
    tags: string[];
}

// Function to convert API response to component format
export function mapApiResponseToDatasetInfo(dataset: ApiDataset): DatasetInfo {
    try {
        return {
            id: dataset.id,
            name: dataset.name,
            description: dataset.description,
            version: dataset.current_version?.toString() || '1',
            fileType: (dataset.file_type || 'unknown').toUpperCase(),
            fileSize: formatFileSize(dataset.file_size || 0),
            lastUpdatedTimestamp: dataset.updated_at || new Date().toISOString(),
            uploader: `User ${dataset.created_by || 'unknown'}`,
            tags: dataset.tags?.map(tag => tag.name) || [],
        };
    } catch (error) {
        console.error('Error mapping dataset response:', error, dataset);
        // Return a fallback dataset info in case of errors
        return {
            id: dataset?.id || 0,
            name: dataset?.name || 'Unknown Dataset',
            description: dataset?.description || 'No description available',
            version: '1',
            fileType: 'UNKNOWN',
            fileSize: '0 B',
            lastUpdatedTimestamp: new Date().toISOString(),
            uploader: 'Unknown',
            tags: [],
        };
    }
}

// Utility to format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(1) + ' MB';
    const gb = mb / 1024;
    return gb.toFixed(1) + ' GB';
}